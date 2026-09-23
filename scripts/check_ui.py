#!/usr/bin/env python3
"""Cross-browser UI regression checks against an isolated, temporary local panel.

Install requirements-dev.txt, then run `python -m playwright install --with-deps`
followed by `python scripts/check_ui.py`. No production URL or database is used.
"""
import argparse
import json
import os
import re
import socket
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WIDTHS = [320, 360, 390, 480, 600, 768, 820, 960, 1024, 1100, 1280, 1440, 1920, 2560]
PERSIAN = re.compile(r"[\u0600-\u06ff]")
BOUNDS = """() => {
  const w=innerWidth;
  return [...document.querySelectorAll('body *')].filter(el=>{
    if(el.closest('svg,script,style'))return false;
    if(el.closest('.sidebar')&&!document.querySelector('#menu')?.checked)return false;
    if(el.closest('.table-scroll')&&el.className!=='table-scroll')return false;
    const css=getComputedStyle(el),r=el.getBoundingClientRect();
    if(!r.width||!r.height||css.visibility==='hidden'||css.display==='none'||+css.opacity===0)return false;
    return r.left < -1 || r.right > w+1;
  }).slice(0,8).map(el=>({tag:el.tagName,id:el.id,cls:el.className,
    left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right}));
}"""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--browsers", default="chromium,firefox,webkit")
    parser.add_argument("--widths", default=",".join(map(str, WIDTHS)))
    parser.add_argument("--output", type=Path, help="Optional JSON report path")
    args = parser.parse_args()
    from playwright.sync_api import sync_playwright

    with tempfile.TemporaryDirectory(prefix="titan-ui-") as directory:
        data = Path(directory)
        env = {**os.environ, "TITAN_DATA_DIR": str(data), "TITAN_DB_PATH": str(data / "titan.db"),
               "TITAN_XRAY_CONFIG": str(data / "xray.json"), "XRAY_BIN": str(data / "no-xray"),
               "TITAN_ADMIN_USER": "TiTaN", "TITAN_ADMIN_PASS": "TiTaN", "TITAN_ROLE": "main"}
        with socket.socket() as sock:
            sock.bind(("127.0.0.1", 0))
            port = sock.getsockname()[1]
        base = f"http://127.0.0.1:{port}"
        records = []
        with (data / "server.log").open("w") as log:
            server = subprocess.Popen([sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1",
                                       "--port", str(port), "--no-proxy-headers"], cwd=ROOT, env=env,
                                      stdout=log, stderr=subprocess.STDOUT)
            try:
                import httpx
                for _ in range(100):
                    if server.poll() is not None:
                        raise RuntimeError((data / "server.log").read_text())
                    try:
                        if httpx.get(base + "/healthz").status_code == 200:
                            break
                    except httpx.HTTPError:
                        pass
                    time.sleep(.1)
                else:
                    raise RuntimeError("Test panel did not start")
                with httpx.Client(base_url=base, headers={"Origin": base}) as api:
                    assert api.post("/api/login", json={"password": "TiTaN"}).status_code == 200
                    user = api.post("/api/users", json={"name": "Browser user", "protocol": "vless",
                                    "quota_gb": 100, "expire_days": 30}).json()["user"]
                    sub = api.post("/api/subscriptions", json={"name": "Browser subscription", "items": [
                        {"uid": user["uid"], "configs": []}]}).json()["subscription"]
                    for name, country, cc in [("Amsterdam", "Netherlands", "NL"),
                                              ("Dubai", "United Arab Emirates", "AE")]:
                        response = api.post("/api/nodes", json={"name": name, "city": name,
                                            "country": country, "country_code": cc, "flag": "🇩🇪"})
                        assert response.status_code == 200, response.text
                with sync_playwright() as playwright:
                    for engine in args.browsers.split(","):
                        browser = getattr(playwright, engine).launch()
                        for width in map(int, args.widths.split(",")):
                            for language in ("fa", "en"):
                                context = browser.new_context(viewport={"width": width, "height": 900},
                                                              reduced_motion="reduce")
                                context.add_init_script(f"localStorage.setItem('titan_lang','{language}')")
                                page = context.new_page()
                                errors = []
                                page.on("pageerror", lambda error, errors=errors: errors.append(str(error)))
                                page.goto(base + "/login")
                                page.wait_for_load_state("networkidle")
                                check_page(page, language, "login")
                                left, right = (page.locator(selector).bounding_box() for selector in (".left", ".right"))
                                if width >= 960:
                                    assert abs(left["x"] + left["width"] - right["x"]) < 1, "Login seam has a gap"
                                    assert abs(left["y"] - right["y"]) < 1
                                else:
                                    assert abs(left["y"] + left["height"] - right["y"]) < 1
                                page.fill("#password", "TiTaN")
                                with page.expect_response(lambda response: response.url.endswith("/api/login")) as login:
                                    page.locator("#form .submit").click()
                                assert login.value.request.post_data_json == {
                                    "username": "TiTaN", "password": "TiTaN", "remember": True}
                                page.wait_for_url("**/dashboard")
                                page.locator(".recent-name").first.wait_for()
                                check_page(page, language, "dashboard")
                                if width == 390:
                                    check_interactions(page, base, language)
                                    if language == "en":
                                        check_crud(page, base)
                                # Finish background refresh reads before navigating away. WebKit
                                # reports aborted old-document fetches as access-control page errors.
                                page.wait_for_load_state("networkidle")
                                page.goto(base + "/p/" + sub["token"])
                                page.wait_for_function("document.querySelector('.hero-name').textContent === 'Browser subscription'")
                                page.wait_for_function("document.querySelectorAll('#latest .flag').length > 0")
                                check_page(page, language, "subscription")
                                page.locator(".all-btn").click()
                                check_page(page, language, "subscription modal")
                                page.locator("#modal .close").click()
                                assert not errors, (engine, width, language, errors)
                                records.append({"engine": engine, "width": width, "language": language,
                                                "pages": ["login", "dashboard", "subscription"], "passed": True})
                                context.close()
                        # Touch and landscape reflow use the same layout, with device-scale emulation.
                        for device in ("iPhone 13", "Pixel 7"):
                            options = dict(playwright.devices[device])
                            if engine == "firefox":
                                options.pop("is_mobile", None)
                            context = browser.new_context(**options)
                            page = context.new_page()
                            page.goto(base + "/login")
                            page.wait_for_load_state("networkidle")
                            check_page(page, "fa", device)
                            assert float(page.locator("#password").evaluate("el=>parseFloat(getComputedStyle(el).fontSize)")) >= 16
                            context.close()
                        browser.close()
                        print(f"{engine}: layout, languages, flags and interactions passed", flush=True)
            finally:
                server.terminate()
                try:
                    server.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    server.kill()
                    server.wait()
        result = {"checks": records, "cases": len(records), "pages_checked": 3 * len(records),
                  "note": "Browser engines on the host OS; emulation is not a physical-device or live proxy test."}
        if args.output:
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_text(json.dumps(result, indent=2))
        print(f"Passed: {len(records)} viewport/language cases, {3 * len(records)} page checks.")


def check_page(page, language, where):
    page.wait_for_timeout(40)
    assert page.get_attribute("html", "lang") == language, where
    assert page.get_attribute("html", "dir") == ("rtl" if language == "fa" else "ltr"), where
    assert not page.evaluate(BOUNDS), (where, page.evaluate(BOUNDS))
    if language == "en":
        leaks = [line for line in page.inner_text("body").splitlines() if PERSIAN.search(line)]
        assert not leaks, (where, leaks)
    page.eval_on_selector_all("img.country-flag", "images=>images.forEach(image=>image.loading='eager')")
    page.wait_for_function("[...document.querySelectorAll('img.country-flag')].every(image=>image.complete && image.naturalWidth>0)")


def navigate(page, index):
    if page.viewport_size["width"] <= 1024:
        page.locator(".mobile-toggle").click()
    page.locator(".nav-item").nth(index).click()


def check_interactions(page, base, language):
    for index in range(1, 9):
        navigate(page, index)
        check_page(page, language, f"section {index}")
    navigate(page, 1)
    page.locator('[data-section="users"] .section-head .primary').click()
    page.locator("#mu_name").wait_for()
    page.fill("#mu_name", "Keep this unsaved name")
    page.select_option("#mu_node", "1")
    for lang in ("en", "fa", language):
        page.evaluate("lang=>I18N.setLang(lang)", lang)
        check_page(page, lang, "user modal after language switch")
        assert page.input_value("#mu_name") == "Keep this unsaved name"
        assert page.input_value("#mu_node") == "1"
    page.locator("#titanModalClose").click()
    navigate(page, 3)
    page.locator('[data-section="servers"] .section-head .primary').click()
    page.locator("#mn_addr").wait_for()
    def detect(route):
        address = route.request.post_data_json["address"]
        found = {"name": "Detected node", "city": "Dubai", "country": "United Arab Emirates",
                 "country_code": "AE", "flag": "🇦🇪"} if address != "unknown.example" else {"name": "Detected node"}
        route.fulfill(json={"ok": True, "kind": "titan", "fields": found, "identity": {
            "name": "Stale card", "city": "Frankfurt", "country_code": "DE", "flag": "🇩🇪",
            "version": "1.0.0", "role": "node", "accepts_bootstrap": True}})
    page.route("**/api/nodes/detect", detect)
    page.fill("#mn_addr", "dubai.example")
    page.locator("#mn_detect").click()
    page.wait_for_function("document.querySelector('#mn_cc').value === 'AE'")
    assert page.input_value("#mn_city") == "Dubai"
    assert page.input_value("#mn_flag") == "🇦🇪"
    assert "Frankfurt" not in page.inner_text("#mn_detectBox")
    assert page.get_attribute("#mn_detectBox .country-flag", "src").endswith("/ae.svg")
    page.fill("#mn_addr", "unknown.example")
    page.locator("#mn_detect").click()
    page.wait_for_function("document.querySelector('#mn_cc').value === ''")
    assert page.input_value("#mn_city") == ""
    check_page(page, language, "node detection")
    page.locator("#titanModalClose").click()
    page.unroute("**/api/nodes/detect", detect)
    navigate(page, 4)
    page.locator('[data-section="subscriptions"] .section-head .primary').click()
    page.locator("#subName").wait_for()
    page.fill("#subName", "Unsaved plan")
    page.locator(".sub-chip").first.click()
    for lang in ("en", "fa", language):
        page.evaluate("lang=>I18N.setLang(lang)", lang)
        check_page(page, lang, "subscription builder")
        assert page.input_value("#subName") == "Unsaved plan"
        assert page.locator(".sub-chip.on").count() == 1
    page.locator("#titanModalClose").click()
    # Changing language must not reset unsaved settings or disconnect the save handler.
    navigate(page, 6)
    page.fill("#set_public_domain", "browser.example")
    for lang in ("en", "fa", language):
        page.select_option("#set_lang", lang)
        assert page.input_value("#set_public_domain") == "browser.example"
    with page.expect_response(lambda response: response.url.endswith("/api/settings") and response.request.method == "POST") as saved:
        page.locator("#set_save").click()
    assert saved.value.status == 200
    assert saved.value.request.post_data_json["public_domain"] == "browser.example"
    # Reset only the setting this disposable test changed.
    response = page.request.post(base + "/api/settings", data={"public_domain": ""}, headers={"Origin": base})
    assert response.status == 200


def check_crud(page, base):
    """Exercise real form bindings after translation, using only the disposable panel."""
    navigate(page, 1)
    page.locator('[data-section="users"] .section-head .primary').click()
    page.locator('#mu_name').wait_for()
    page.fill('#mu_name', 'Created in browser')
    with page.expect_response(lambda r: r.url.endswith('/api/users') and r.request.method == 'POST') as created:
        page.locator('#titanModalSave').click()
    assert created.value.status == 200
    user = created.value.json()['user']
    uid = user['uid']
    edit = page.locator(f'[data-section="users"] [data-act="edit"][data-uid="{uid}"]')
    edit.wait_for()
    edit.click()
    page.locator('#mu_note').wait_for()
    page.fill('#mu_note', 'Language-safe form binding')
    with page.expect_response(lambda r: r.url.endswith('/api/users/' + uid) and r.request.method == 'PATCH') as updated:
        page.locator('#titanModalSave').click()
    assert updated.value.status == 200
    assert page.request.get(base + '/api/users/' + uid).json()['note'] == 'Language-safe form binding'

    navigate(page, 4)
    page.locator('[data-section="subscriptions"] .section-head .primary').click()
    page.locator('#subName').wait_for()
    page.fill('#subName', 'Created in browser')
    page.locator(f'.sub-chip[data-sub-uid="{uid}"]').first.click()
    with page.expect_response(lambda r: r.url.endswith('/api/subscriptions') and r.request.method == 'POST') as linked:
        page.locator('#titanModalSave').click()
    assert linked.value.status == 200
    sub = linked.value.json()['subscription']
    sid = sub['id']
    power = page.locator(f'[data-section="subscriptions"] [data-act="power"][data-sub="{sid}"]')
    power.wait_for()
    with page.expect_response(lambda r: r.url.endswith('/api/subscriptions/' + str(sid)) and r.request.method == 'PATCH') as switched:
        power.click()
    assert switched.value.status == 200
    assert page.request.get(base + '/s/' + sub['token'], headers={'Accept': '*/*'}).status == 403
    assert page.request.get(base + '/p/' + sub['token']).status == 200
    page.once('dialog', lambda dialog: dialog.accept())
    with page.expect_response(lambda r: r.url.endswith('/api/subscriptions/' + str(sid)) and r.request.method == 'DELETE') as removed:
        page.locator(f'[data-section="subscriptions"] [data-act="del"][data-sub="{sid}"]').click()
    assert removed.value.status == 200
    assert page.request.get(base + '/p/' + sub['token']).status == 404

    navigate(page, 3)
    page.locator('[data-section="servers"] .section-head .primary').click()
    page.locator('#mn_name').wait_for()
    page.fill('#mn_name', 'Manual browser node')
    page.fill('#mn_city', 'Dubai')
    page.fill('#mn_country', 'United Arab Emirates')
    page.fill('#mn_cc', 'AE')
    with page.expect_response(lambda r: r.url.endswith('/api/nodes') and r.request.method == 'POST') as node_created:
        page.locator('#titanModalSave').click()
    assert node_created.value.status == 200
    node = node_created.value.json()['node']
    assert node['flag'] == '🇦🇪' and node['country_code'] == 'AE'
    assert page.request.delete(base + '/api/nodes/' + str(node['id']), headers={'Origin': base}).status == 200
    assert page.request.delete(base + '/api/users/' + uid, headers={'Origin': base}).status == 200


if __name__ == "__main__":
    main()
