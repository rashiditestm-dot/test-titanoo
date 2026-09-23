"""Adding a node from its domain alone, and claiming it without any variables.

The admin's complaint was concrete: adding a node answered "put the variables in
the node's service", which means every node had to be wired by hand. These tests
pin the replacement: a TiTaN node answers an identity card, the panel fills the
form itself, and a node that holds no credential is claimed over the same channel
so nothing has to be typed. The manual path still exists and copies every
variable at once.
"""
import shutil
import tempfile

import pytest
from fastapi.testclient import TestClient

from app import db, security
from app import main as m
from app import nodes as nodesync


@pytest.fixture()
def panel(monkeypatch):
    """A panel process with its own data dir and a known shared secret."""
    tmp = tempfile.mkdtemp(prefix="titan-discover-")
    monkeypatch.setenv("TITAN_DATA_DIR", tmp)
    monkeypatch.setattr(m.config, "NODE_SECRET", "panel-shared-secret-abcdef123456")
    db.close() if hasattr(db, "close") else None
    db._connect()
    db._ensure_bootstrap()
    hp = security.hash_password("TiTaN")
    db.set_admin("TiTaN", hp["hash"], hp["salt"])
    db.set_meta("auth_is_default", "1")
    db.set_settings({"public_domain": "", "public_port": 443})
    with TestClient(m.app) as client:
        client.post("/api/login", json={"username": "TiTaN", "password": "TiTaN"})
        yield client
    shutil.rmtree(tmp, ignore_errors=True)


ORIGIN = {"Origin": "http://testserver"}


def _me(panel):
    return panel.get("/api/me").json() if panel.get("/api/me").status_code == 200 else {}


# ─────────────────────────────────────────────────────── node-side endpoints
def test_a_node_answers_an_identity_card_without_leaking_anything(panel, monkeypatch):
    """The panel calls this before it can add anything, so it must not need a session."""
    monkeypatch.setattr(m.config, "IS_NODE", True)
    monkeypatch.setattr(m.config, "NODE_SECRET", "")   # nothing configured yet
    monkeypatch.setattr(m.config, "NODE_TOKEN", "")
    db.set_meta("node_secret", "")
    db.set_meta("panel_secret", "")          # the panel may have minted one by now
    db.set_local_node_location("Frankfurt", "Germany", "DE", "🇩🇪")
    monkeypatch.setattr(m, "detect_own_location", lambda: {
        "city": "Frankfurt", "country": "Germany", "country_code": "DE", "flag": "🇩🇪"})
    r = panel.get("/api/node/discover")
    assert r.status_code == 200, r.text
    card = r.json()
    assert card["app"] == "titan" and card["role"] == "node"
    assert card["city"] == "Frankfurt" and card["country_code"] == "DE"
    assert card["accepts_bootstrap"] is True and card["credential"] == ""
    assert "secret" not in str(card).lower() or "credential" in card
    # the private bits stay private unless the caller proves it holds the secret
    assert "users" not in card and "panel_url" not in card
    db.set_meta("node_secret", "panel-shared-secret-abcdef123456")
    authed = panel.get("/api/node/discover",
                       headers={"X-TiTaN-Node-Secret": "panel-shared-secret-abcdef123456"}).json()
    assert "users" in authed and authed["credential"] == "claimed", \
        "an authenticated caller sees the fuller card, including a claimed secret"


def test_a_fresh_node_accepts_one_claim_and_then_locks(panel, monkeypatch):
    """Trust on first use: the first panel to reach a fresh node owns it."""
    monkeypatch.setattr(m.config, "IS_NODE", True)
    monkeypatch.setattr(m.config, "NODE_SECRET", "")
    monkeypatch.setattr(m.config, "NODE_TOKEN", "")
    db.set_meta("node_secret", "")
    db.set_meta("panel_secret", "")

    first = panel.post("/api/node/bootstrap",
                       json={"secret": "owner-secret-0123456789", "panel_url": "https://panel.example"})
    assert first.status_code == 200 and first.json()["claimed"] is True
    assert db.get_meta("node_secret") == "owner-secret-0123456789"
    assert db.get_meta("node_panel_url") == "https://panel.example"
    # the stored credential is now what this node accepts for pushes
    assert nodesync.secret_valid_for_node("owner-secret-0123456789") is True
    assert nodesync.secret_valid_for_node("someone-else-secret-0123456789") is False
    assert nodesync.node_credential() == "owner-secret-0123456789"

    # a second panel cannot take the node over
    second = panel.post("/api/node/bootstrap",
                        json={"secret": "attacker-secret-0123456789"})
    assert second.status_code == 409
    # ... and re-claiming with the same secret is idempotent
    again = panel.post("/api/node/bootstrap", json={"secret": "owner-secret-0123456789"})
    assert again.status_code == 200 and again.json().get("already") is True
    # a short secret is refused outright
    assert panel.post("/api/node/bootstrap", json={"secret": "short"}).status_code == 400


def test_an_env_credential_is_never_replaced_by_a_claim(panel, monkeypatch):
    """A node that was deployed with variables keeps them, claim or not."""
    monkeypatch.setattr(m.config, "IS_NODE", True)
    monkeypatch.setattr(m.config, "NODE_SECRET", "already-set-secret-0123456789")
    r = panel.post("/api/node/bootstrap", json={"secret": "other-secret-0123456789"})
    assert r.status_code == 409
    assert m.config.NODE_SECRET == "already-set-secret-0123456789"


# ──────────────────────────────────────────────────── panel-side detect/claim
class _FakeProbe:
    """Stands in for the network: a live TiTaN node that holds nothing yet."""

    def __init__(self, *, kind="titan", accepts=True):
        self.kind = kind
        self.accepts = accepts
        self.claims = 0

    async def __call__(self, addr, timeout=6.0):
        if self.kind != "titan":
            return {"kind": self.kind, "url": "", "identity": {}, "error": "HTTP 502"}
        return {"kind": "titan", "url": addr, "identity": {
            "app": "titan", "version": "1.0.0", "role": "node", "name": "fra-node",
            "city": "Frankfurt", "country": "Germany", "country_code": "DE", "flag": "🇩🇪",
            "edge": {"scheme": "https", "port": 443}, "credential": "",
            "accepts_bootstrap": self.accepts,
        }, "error": ""}

    async def claim(self, url, panel_url, timeout=8.0):
        self.claims += 1
        if not self.accepts:
            return {"ok": False, "error": "node-already-claimed"}
        return {"ok": True, "claimed": True}


def test_a_domain_alone_is_enough_to_add_a_node(panel, monkeypatch):
    """POST /api/nodes with only an address: detected, claimed, and pushed."""
    probe = _FakeProbe()
    monkeypatch.setattr(m, "_probe_node_identity", probe)

    async def _fake_claim(url, panel_url, timeout=8.0):
        return await probe.claim(url, panel_url)

    monkeypatch.setattr(m, "_claim_node", _fake_claim)

    pushed = []

    async def _fake_sync(node_id, timeout=6.0):
        pushed.append(node_id)
        return {"node_id": node_id, "ok": True, "error": "", "served_by": ["nobody"]}

    monkeypatch.setattr(m, "_sync_node_now", _fake_sync)

    r = panel.post("/api/nodes", json={"address": "https://fra-node.up.railway.app"}, headers=ORIGIN)
    assert r.status_code == 200, r.text
    body = r.json()
    node = body["node"]
    assert node["name"] == "fra-node", "the name came from the node itself"
    assert node["city"] == "Frankfurt" and node["country_code"] == "DE"
    assert node["flag"] == "🇩🇪"
    assert body["discovery"]["kind"] == "titan"
    assert body["discovery"]["claim"]["ok"] is True, "the fresh node was claimed automatically"
    assert probe.claims == 1
    assert body["sync_now"]["ok"] is True and pushed, "the users were pushed right away"
    # the manual recipe is still there, and now copies as one block
    assert body["setup"]["block"].startswith("TITAN_ROLE=node")
    assert "TITAN_NODE_TOKEN=" in body["setup"]["block"]
    assert body["setup"]["lines"] == body["setup"]["block"].splitlines()


def test_a_detect_call_fills_the_form_without_storing_anything(panel, monkeypatch):
    monkeypatch.setattr(m, "_probe_node_identity", _FakeProbe())
    before = len(db.list_nodes())
    r = panel.post("/api/nodes/detect", json={"address": "fra-node.example.com"}, headers=ORIGIN)
    assert r.status_code == 200
    d = r.json()
    assert d["ok"] is True and d["kind"] == "titan"
    assert d["fields"]["city"] == "Frankfurt" and d["fields"]["country_code"] == "DE"
    assert d["needs_credentials"] is True and d["can_claim"] is True
    assert len(db.list_nodes()) == before, "detect must not add a node"


def test_when_detection_fails_the_manual_path_still_works(panel, monkeypatch):
    """An older node (or a typo) must not block the admin: manual entry stays."""
    monkeypatch.setattr(m, "_probe_node_identity", _FakeProbe(kind="unreachable"))

    async def _fake_sync(node_id, timeout=6.0):
        return {"node_id": node_id, "ok": False, "error": "HTTP 401 (credential rejected)"}

    monkeypatch.setattr(m, "_sync_node_now", _fake_sync)
    r = panel.post("/api/nodes",
                   json={"name": "manual-node", "address": "old-node.example.com",
                         "city": "Dubai", "country_code": "AE", "flag": "🇦🇪"},
                   headers=ORIGIN)
    assert r.status_code == 200
    body = r.json()
    assert body["discovery"]["kind"] == "unreachable"
    assert body["node"]["name"] == "manual-node" and body["node"]["city"] == "Dubai"
    assert body["sync_now"]["ok"] is False
    assert body["setup"]["block"].splitlines()[0].startswith("TITAN_ROLE=")


def test_claiming_an_existing_node_reports_every_step(panel, monkeypatch):
    node = db.create_node({"name": "late-node", "address": "https://late.example.com",
                           "token": "tok", "enabled": True})
    probe = _FakeProbe()
    monkeypatch.setattr(m, "_probe_node_identity", probe)

    async def _fake_claim(url, panel_url, timeout=8.0):
        return await probe.claim(url, panel_url)

    monkeypatch.setattr(m, "_claim_node", _fake_claim)

    async def _fake_sync(node_id, timeout=6.0):
        return {"node_id": node_id, "ok": True, "error": "", "served_by": []}

    monkeypatch.setattr(m, "_sync_node_now", _fake_sync)
    r = panel.post(f"/api/nodes/{node['id']}/claim", headers=ORIGIN)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["kind"] == "titan" and body["claim"]["ok"] is True
    assert body["node_sync"]["ok"] is True
    assert db.get_node(node["id"])["city"] == "Frankfurt", "the card was written onto the node"


def test_auto_detect_prefers_the_requested_nodes_self_report(panel, monkeypatch):
    """DNS may point at an edge in another country; the node report wins."""
    calls = []
    async def probe(address):
        calls.append(address)
        result = await _FakeProbe()(address)
        result["identity"].update(city="Dubai", country="United Arab Emirates",
                                  country_code="AE", flag="🇩🇪")
        return result

    monkeypatch.setattr(m, "_probe_node_identity", probe)
    monkeypatch.setattr(m, "detect_location", lambda *args: pytest.fail("must not locate a CDN DNS IP"))
    before = len(db.list_nodes())
    r = panel.post("/api/nodes/detect", json={"address": "dubai.example.com"}, headers=ORIGIN)
    assert r.status_code == 200, r.text
    fields = r.json()["fields"]
    assert calls == ["dubai.example.com"]
    assert (fields["city"], fields["country_code"], fields["flag"]) == ("Dubai", "AE", "🇦🇪")
    assert len(db.list_nodes()) == before


def test_failed_detection_does_not_borrow_the_panels_country(panel, monkeypatch):
    monkeypatch.setattr(m, "_probe_node_identity", _FakeProbe(kind="unreachable"))
    monkeypatch.setattr(m, "detect_location", lambda *args: {})
    db.set_local_node_location("Frankfurt", "Germany", "DE", "🇩🇪")
    r = panel.post("/api/nodes/detect", json={"address": "unreachable.example.com"}, headers=ORIGIN)
    assert r.status_code == 200
    assert not r.json()["ok"]
    assert r.json()["fields"] == {}


def test_country_and_flag_survive_manual_creation_and_country_edits(panel, monkeypatch):
    monkeypatch.setattr(m, "_probe_node_identity", _FakeProbe())
    async def sync(node_id, timeout=6.0):
        return {"node_id": node_id, "ok": True}
    monkeypatch.setattr(m, "_sync_node_now", sync)
    r = panel.post("/api/nodes", json={"name": "manual", "address": "manual.example.com",
                   "country": "هلند", "city": "Amsterdam", "flag": "🇩🇪"}, headers=ORIGIN)
    assert r.status_code == 200, r.text
    node = r.json()["node"]
    assert (node["city"], node["country_code"], node["flag"]) == ("Amsterdam", "NL", "🇳🇱")
    changed = panel.patch(f"/api/nodes/{node['id']}", json={"country_code": "tr", "flag": "🇩🇪"}, headers=ORIGIN)
    assert changed.status_code == 200
    assert changed.json()["node"]["flag"] == "🇹🇷"
    assert db.get_node(node["id"])["flag"] == "🇹🇷"
    db.delete_node(node["id"])


def test_country_only_discovery_still_has_a_matching_flag(panel, monkeypatch):
    async def probe(address):
        result = await _FakeProbe()(address)
        result["identity"].update(country="هلند", country_code="", flag="", city="Amsterdam")
        return result
    monkeypatch.setattr(m, "_probe_node_identity", probe)
    fields = panel.post("/api/nodes/detect", json={"address": "amsterdam.example.com"}, headers=ORIGIN).json()["fields"]
    assert fields["country_code"] == "NL" and fields["flag"] == "🇳🇱"


def test_every_node_answers_with_a_flag_that_matches_its_country(panel):
    """No node is ever serialized without a flag, and it follows the country."""
    node = db.create_node({"name": "flagless", "address": "x.example.com",
                           "country_code": "TR", "flag": "", "token": "t"})
    s = m._serialize_node(node, {})
    assert s["flag"] == "🇹🇷"
    bare = db.create_node({"name": "bare", "token": "t2"})
    assert m._serialize_node(bare, {})["flag"] == "🏳️"
    db.delete_node(node["id"])
    db.delete_node(bare["id"])


def test_the_shared_secret_is_what_gets_handed_over(panel, monkeypatch):
    """The claim carries the panel's own credential, never a made-up one."""
    sent = {}

    class _Resp:
        status_code = 200
        text = '{"ok": true, "claimed": true}'

        @staticmethod
        def json():
            return {"ok": True, "claimed": True}

    class _Client:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *a):
            return False

        async def post(self, url, json=None, headers=None):
            sent["url"] = url
            sent["json"] = json
            return _Resp()

    monkeypatch.setattr(m.httpx, "AsyncClient", lambda **kw: _Client())
    out = __import__("asyncio").run(m._claim_node("https://node.example.com", "https://panel.example"))
    assert out["ok"] is True
    assert sent["url"] == "https://node.example.com/api/node/bootstrap"
    assert sent["json"]["secret"] == "panel-shared-secret-abcdef123456"
    assert sent["json"]["panel_url"] == "https://panel.example"

def test_a_panel_with_no_secret_mints_one_and_uses_it(panel, monkeypatch):
    """Nobody typed a variable anywhere, and the node still gets users.

    A panel deployed without TITAN_NODE_SECRET used to have nothing to hand over,
    so "claim this node" could not work: the claim carries the panel's secret.
    The panel now mints one on first need, keeps it in its own database, offers it
    to nodes and accepts what they report back with it.
    """
    monkeypatch.setattr(m.config, "NODE_SECRET", "")
    db.set_meta("panel_secret", "")
    minted = nodesync.panel_secret()
    assert len(minted) >= 24, "the minted secret is long enough to be one"
    assert nodesync.panel_secret() == minted, "it is stable, not regenerated per call"
    assert db.get_meta("panel_secret") == minted
    # it is offered to nodes as the shared credential ...
    pairs = dict((kind, sec) for sec, kind in nodesync._sync_secrets({"id": 2, "token": "per-node"}))
    assert pairs["shared"] == minted and pairs["token"] == "per-node"
    # ... and reports signed with it are accepted back
    assert nodesync.secret_valid_for_main(minted) is True
    assert nodesync.secret_valid_for_main("nope") is False
    # an explicit env value always wins and is never replaced by the minted one
    monkeypatch.setattr(m.config, "NODE_SECRET", "typed-secret-0123456789")
    assert nodesync.panel_secret() == "typed-secret-0123456789"
    assert db.get_meta("panel_secret") == minted, "minting does not overwrite anything"


def test_claiming_carries_the_minted_secret_when_no_env_is_set(panel, monkeypatch):
    monkeypatch.setattr(m.config, "NODE_SECRET", "")
    db.set_meta("panel_secret", "")
    sent = {}

    class _Resp:
        status_code = 200
        text = '{"ok": true}'

        @staticmethod
        def json():
            return {"ok": True, "claimed": True}

    class _Client:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *a):
            return False

        async def post(self, url, json=None, headers=None):
            sent["json"] = json
            return _Resp()

    monkeypatch.setattr(m.httpx, "AsyncClient", lambda **kw: _Client())
    out = __import__("asyncio").run(m._claim_node("https://node.example.com", "https://panel.example"))
    assert out["ok"] is True
    assert sent["json"]["secret"] == db.get_meta("panel_secret") != ""


def test_identity_remains_available_when_own_geolocation_fails(panel, monkeypatch):
    def unavailable():
        raise TimeoutError("GeoIP unavailable")
    monkeypatch.setattr(m, "detect_own_location", unavailable)
    response = panel.get("/api/node/discover")
    assert response.status_code == 200
    card = response.json()
    assert card["app"] == "titan" and "accepts_bootstrap" in card
    assert card["country_code"] == "" and card["flag"] == "🏳️"
