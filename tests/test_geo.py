"""Country metadata is independent of routing, credentials and subscriptions."""
import asyncio
import importlib
import json
from pathlib import Path

import httpx
import pytest


@pytest.fixture
def geo():
    # conftest reloads app modules; always exercise the live module.
    return importlib.import_module("app.geo")


@pytest.mark.parametrize("cc, country, flag, expected", [
    ("nl", "", "🇩🇪", "NL"), ("", "هلند", "", "NL"),
    ("UK", "", "", "GB"), ("", "United Arab Emirates", "", "AE"),
    ("", "آمریکا", "", "US"), ("", "", "🇯🇵", "JP"),
    ("xx", "", "", ""), ("ای", "", "", ""), ("DEU", "", "", ""),
])
def test_country_normalization(geo, cc, country, flag, expected):
    assert geo.country_code(cc, country, flag) == expected


def test_all_country_codes_have_a_real_local_svg(geo):
    root = Path(__file__).resolve().parent.parent
    countries = json.loads((root / "static/data/countries.json").read_text())
    assert len(countries) >= 249
    for code in countries:
        assert geo.flag_from_code(code) != "🏳️", code
        assert (root / f"static/img/flags/{code.lower()}.svg").read_text().lstrip().startswith("<svg"), code


def test_stale_or_missing_flags_never_override_a_known_country(geo):
    assert geo.location_fields({"country_code": "AE", "flag": "🇩🇪"})["flag"] == "🇦🇪"
    assert geo.location_fields({"country": "هلند", "flag": "🌐"})["flag"] == "🇳🇱"
    assert geo.location_fields({"city": "An ambiguous city"})["flag"] == "🏳️"
    assert geo.flag_from_code("İR") == "🏳️"


def test_hostname_asks_that_node_not_its_dns_edge(geo, monkeypatch):
    calls = []
    def get(url, **kwargs):
        calls.append(url)
        return httpx.Response(200, request=httpx.Request("GET", url), json={
            "app": "titan", "city": "Dubai", "country_code": "AE", "flag": "🇩🇪"})
    monkeypatch.setattr(geo.httpx, "get", get)
    result = geo.detect_location("https://user@node.example.com:8443/a/path?x=1#test")
    assert calls == ["https://node.example.com:8443/api/node/discover"]
    assert result == {"city": "Dubai", "country": "United Arab Emirates", "country_code": "AE", "flag": "🇦🇪"}


@pytest.mark.parametrize("response", [{}, {"app": "foreign", "country_code": "DE"},
                                    {"app": "titan", "country_code": "XX"}, []])
def test_no_geo_guess_from_a_cdn_or_unidentified_service(geo, monkeypatch, response):
    calls = []
    def get(url, **kwargs):
        calls.append(url)
        return httpx.Response(200, request=httpx.Request("GET", url), json=response)
    monkeypatch.setattr(geo.httpx, "get", get)
    assert geo.detect_location("example.up.railway.app") == {}
    assert calls == ["https://example.up.railway.app/api/node/discover"]


def test_private_and_invalid_addresses_do_not_call_geo_services(geo, monkeypatch):
    monkeypatch.setattr(geo.httpx, "get", lambda *args, **kwargs: pytest.fail("unexpected network"))
    for address in ("", "127.0.0.1", "https://10.0.0.1:8000", "::1", "[fe80::1]:443", "file:///etc/passwd"):
        assert geo.detect_location(address) == {}


@pytest.mark.parametrize("address, ip", [("8.8.8.8:443", "8.8.8.8"),
                                        ("https://[2606:4700:4700::1111]:8443/", "2606:4700:4700::1111"),
                                        ("2606:4700:4700::1111", "2606:4700:4700::1111")])
def test_literal_ips_are_not_truncated_or_replaced_by_panel_ip(geo, monkeypatch, address, ip):
    calls = []
    def get(url, **kwargs):
        calls.append((url, kwargs))
        return httpx.Response(200, request=httpx.Request("GET", url), json={
            "ip": ip, "success": True, "country_code": "NL", "country": "Netherlands", "city": "Amsterdam"})
    monkeypatch.setattr(geo.httpx, "get", get)
    assert geo.detect_location(address)["country_code"] == "NL"
    assert calls[0][0] == f"https://ipwho.is/{ip}"
    assert calls[0][1]["trust_env"] is False


def test_lookup_failure_never_uses_cloudflare_colo(geo, monkeypatch):
    calls = []
    def get(url, **kwargs):
        calls.append(url)
        raise httpx.ConnectTimeout("unavailable")
    geo._own_cache.update(until=0, location={})
    monkeypatch.setattr(geo.httpx, "get", get)
    assert geo.detect_own_location() == {}
    assert geo.detect_own_location() == {}  # Negative cache avoids hammering providers.
    assert len(calls) == 2 and all(url.startswith("https://") for url in calls)
    assert not any("cloudflare" in url for url in calls)
    geo._own_cache.update(until=0, location={})


def test_lookup_fallback_still_uses_the_same_ip(geo, monkeypatch):
    calls = []
    def get(url, **kwargs):
        calls.append(url)
        data = {"success": False} if "ipwho.is" in url else {
            "ip": "8.8.8.8", "country_code": "US", "country_name": "United States", "city": "Mountain View"}
        return httpx.Response(200, request=httpx.Request("GET", url), json=data)
    monkeypatch.setattr(geo.httpx, "get", get)
    assert geo.detect_location("8.8.8.8")["flag"] == "🇺🇸"
    assert calls == ["https://ipwho.is/8.8.8.8", "https://ipapi.co/8.8.8.8/json/"]


def test_provider_response_for_another_ip_is_not_accepted(geo, monkeypatch):
    def get(url, **kwargs):
        return httpx.Response(200, request=httpx.Request("GET", url), json={
            "ip": "1.1.1.1", "country_code": "DE", "city": "Frankfurt"})
    monkeypatch.setattr(geo.httpx, "get", get)
    assert geo.detect_location("8.8.8.8") == {}


def test_refresh_persists_only_own_geo_estimate(geo, monkeypatch):
    tasks = importlib.import_module("app.tasks")
    written = []
    monkeypatch.setattr(geo, "detect_own_location", lambda: {
        "city": "", "country": "United Arab Emirates", "country_code": "AE", "flag": "🇦🇪"})
    monkeypatch.setattr(tasks.db, "set_local_node_location", lambda *args: written.append(args))
    monkeypatch.setattr(tasks, "LOCATION", {"colo": "FRA"})
    async def stop(_):
        raise asyncio.CancelledError
    monkeypatch.setattr(tasks.asyncio, "sleep", stop)
    with pytest.raises(asyncio.CancelledError):
        asyncio.run(tasks._refresh_location())
    assert written == [("", "United Arab Emirates", "AE", "🇦🇪")]
    assert tasks.LOCATION["country_code"] == "AE"
