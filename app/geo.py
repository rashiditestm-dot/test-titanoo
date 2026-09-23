"""Best-effort node location. CDN edge locations are never used as origins."""
import ipaddress
import json
import re
import time
from pathlib import Path
from urllib.parse import urlsplit

import httpx

_COUNTRIES = json.loads(
    (Path(__file__).resolve().parent.parent / "static/data/countries.json").read_text(encoding="utf-8")
)
_own_cache: dict = {"until": 0.0, "location": {}}


def _name_key(value: str) -> str:
    return " ".join(str(value or "").replace("ي", "ی").replace("ك", "ک").casefold().split())


_COUNTRY_NAMES = {
    _name_key(name): code
    for code, country in _COUNTRIES.items()
    for name in [country["en"], country["fa"], *country.get("aliases", [])]
}


def country_code(code: str = "", country: str = "", flag: str = "") -> str:
    code = str(code or "").strip().upper()
    if code == "UK":
        code = "GB"
    if code in _COUNTRIES:
        return code
    named = _COUNTRY_NAMES.get(_name_key(country), "")
    if named:
        return named
    if re.fullmatch("[\U0001F1E6-\U0001F1FF]{2}", str(flag or "")):
        inferred = "".join(chr(ord(c) - 0x1F1E6 + ord("A")) for c in flag)
        if inferred in _COUNTRIES:
            return inferred
    return ""


def flag_from_code(code: str) -> str:
    code = country_code(code)
    return "".join(chr(0x1F1E6 + ord(c) - ord("A")) for c in code) if code else "🏳️"


def location_fields(data: dict) -> dict:
    """Normalize existing location fields without changing the database schema."""
    cc = country_code(data.get("country_code"), data.get("country"), data.get("flag"))
    city = str(data.get("city") or "").strip()[:64]
    country = str(data.get("country") or "").strip()[:64]
    if city.casefold() in ("unknown", "—", "نامشخص"):
        city = ""
    if country.casefold() in ("unknown", "—", "نامشخص"):
        country = ""
    if cc:
        # A stale flag or a mismatched country name must not override the code.
        named = _COUNTRY_NAMES.get(_name_key(country))
        if not country or (named and named != cc):
            country = _COUNTRIES[cc]["en"]
    return {"city": city, "country": country, "country_code": cc, "flag": flag_from_code(cc)}


def _ip_location(ip: str = "", timeout: float = 3.0) -> dict:
    """Query a public IP, or this process's egress IP when ip is empty."""
    urls = [f"https://ipwho.is/{ip}", f"https://ipapi.co/{ip + '/' if ip else ''}json/"]
    for url in urls:
        try:
            # A configured HTTP proxy would locate the proxy, not this node.
            r = httpx.get(url, timeout=timeout, trust_env=False)
            r.raise_for_status()
            d = r.json()
            if not isinstance(d, dict) or d.get("success") is False or d.get("error"):
                continue
            observed = ipaddress.ip_address(str(d.get("ip") or ""))
            if not observed.is_global or (ip and observed != ipaddress.ip_address(ip)):
                continue
            loc = location_fields({
                "city": d.get("city"), "country": d.get("country_name") or d.get("country"),
                "country_code": d.get("country_code"),
            })
            if loc["country_code"]:
                return loc
        except (httpx.HTTPError, ValueError, TypeError):
            continue
    return {}


def detect_own_location(timeout: float = 3.0) -> dict:
    """Estimate this node's location from its own public egress IP.

    GeoIP is approximate, especially with shared cloud egress. Never substitute
    the nearest Cloudflare PoP or the panel's location when lookup fails.
    """
    now = time.monotonic()
    if now < _own_cache["until"]:
        return dict(_own_cache["location"])
    loc = _ip_location(timeout=timeout)
    _own_cache.update(until=now + (12 * 3600 if loc else 300), location=loc)
    return dict(loc)


def detect_location(address: str, timeout: float = 3.0) -> dict:
    """Ask the specified TiTaN node for its location; direct IPs use GeoIP.

    A hostname may resolve to a CDN or a platform's shared ingress. Its DNS IP
    cannot prove the origin's country, so unavailable discovery returns {} and
    leaves manual entry available. No lookup of the main panel is used here.
    """
    raw = str(address or "").strip()
    if not raw:
        return {}
    try:
        literal = ipaddress.ip_address(raw)
    except ValueError:
        literal = None
    try:
        parts = urlsplit(raw if "://" in raw else "//" + raw)
        if parts.scheme and parts.scheme not in ("http", "https"):
            return {}
        host = str(literal) if literal else (parts.hostname or "")
        if not host:
            return {}
        try:
            ip = ipaddress.ip_address(host)
        except ValueError:
            ip = None
        if ip:
            return _ip_location(str(ip), timeout) if ip.is_global else {}
        port = f":{parts.port}" if parts.port else ""
        base = f"{parts.scheme or 'https'}://{host}{port}"
        r = httpx.get(base + "/api/node/discover", timeout=timeout, follow_redirects=True)
        r.raise_for_status()
        data = r.json()
        if not isinstance(data, dict) or data.get("app") != "titan":
            return {}
        loc = location_fields(data)
        return loc if loc["country_code"] else {}
    except (httpx.HTTPError, ValueError, TypeError):
        return {}
