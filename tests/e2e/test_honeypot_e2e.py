from __future__ import annotations

import os

import httpx


BASE_URL = os.getenv("HONEYPOT_BASE_URL", "http://127.0.0.1:8000")


def test_complete_controlled_attack_surface() -> None:
    with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
        assert client.get("/health").status_code == 200
        observability = client.get("/health/observability")
        assert observability.status_code == 200
        assert observability.json()["buffer_capacity"] == 2048

        for password in ("one", "two", "three"):
            assert client.post("/auth", json={"username": "analyst", "password": password}).status_code == 401

        assert client.get("/users/2", headers={"X-User-ID": "1"}).status_code == 200

        injected = client.get("/products", params={"q": "' OR 1=1 --"})
        assert injected.status_code == 200
        assert len(injected.json()) >= 3

        traversal = client.get("/files", params={"path": "../secrets/system.txt"})
        assert traversal.status_code == 200
        assert client.get("/files", params={"path": "../../../../etc/passwd"}).status_code == 403

        payload = '<script>document.body.dataset.honeytrace="e2e"</script>'
        assert client.post("/orders/1/notes", json={"author_id": 1, "note": payload}).status_code == 201
        rendered = client.get("/orders/1/notes/render")
        assert rendered.status_code == 200
        assert payload in rendered.text

        assert all(response.headers.get("X-Trace-ID") for response in [injected, traversal, rendered])
