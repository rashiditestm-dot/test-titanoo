"""Coverage and syntax checks for the actual pages served by the application."""
import re
import shutil
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
NODE = shutil.which("node")
pytestmark = pytest.mark.skipif(not NODE, reason="Node.js is needed for frontend checks")


def test_translation_catalogues_are_complete():
    result = subprocess.run([NODE, "scripts/check_i18n.js"], cwd=ROOT, capture_output=True, text=True)
    assert result.returncode == 0, result.stdout + result.stderr


@pytest.mark.parametrize("lang", ["fa", "en"])
def test_live_dashboard_renders_in_both_languages(lang, monkeypatch):
    monkeypatch.setenv("TITAN_LANG", lang)
    result = subprocess.run([NODE, "scripts/bridge_smoke.js"], cwd=ROOT, capture_output=True, text=True)
    assert result.returncode == 0, result.stdout + result.stderr


@pytest.mark.parametrize("template", ["login", "dashboard", "subscription"])
def test_inline_scripts_parse(template, tmp_path):
    text = (ROOT / "templates" / f"{template}.html").read_text()
    for index, script in enumerate(re.findall(r"<script>(.*?)</script>", text, re.S)):
        file = tmp_path / f"{template}-{index}.js"
        file.write_text(script)
        result = subprocess.run([NODE, "--check", file], capture_output=True, text=True)
        assert result.returncode == 0, result.stderr


def test_local_static_dependencies_exist():
    for name in ("login", "dashboard", "subscription"):
        text = (ROOT / "templates" / f"{name}.html").read_text()
        for asset in re.findall(r'(?:src|href)="(/static/[^"$]+)"', text):
            assert (ROOT / asset.lstrip("/")).is_file(), (name, asset)
    assert (ROOT / "static/img/flags/unknown.svg").is_file()
