import pytest

from app.observability.events import get_event_buffer


@pytest.mark.integration
def test_auth_allows_repeated_attempts_and_records_each_one(client) -> None:
    for _ in range(5):
        response = client.post("/auth", json={"username": "analyst", "password": "wrong"})
        assert response.status_code == 401

    events = [event for event in get_event_buffer() if event["event_type"] == "AUTH_FAILURE"]
    assert len(events) == 5
    assert all(event["vulnerability"] == "Brute Force" for event in events)


@pytest.mark.integration
def test_users_exposes_idor_and_records_actor(client) -> None:
    response = client.get("/users/2", headers={"X-User-ID": "1"})

    assert response.status_code == 200
    assert response.json()["username"] == "admin"
    event = next(event for event in get_event_buffer() if event["event_type"] == "IDOR_ACCESS")
    assert event["metadata"]["actor_user_id"] == "1"
    assert event["metadata"]["target_user_id"] == 2


@pytest.mark.integration
def test_products_is_deliberately_sqli_vulnerable(client) -> None:
    normal = client.get("/products", params={"q": "Honey"})
    injected = client.get("/products", params={"q": "' OR 1=1 --"})

    assert len(normal.json()) == 1
    assert len(injected.json()) == 3
    assert any(event["event_type"] == "SQLI_ATTEMPT" for event in get_event_buffer())


@pytest.mark.integration
def test_files_traversal_is_contained_in_decoy(client) -> None:
    vulnerable = client.get("/files", params={"path": "../secrets/system.txt"})
    escaped = client.get("/files", params={"path": "../../../../etc/passwd"})

    assert vulnerable.status_code == 200
    assert vulnerable.text == "synthetic secret"
    assert escaped.status_code == 403
    assert any(event["event_type"] == "PATH_TRAVERSAL_ATTEMPT" for event in get_event_buffer())


@pytest.mark.integration
def test_order_note_is_stored_and_rendered_without_escaping(client) -> None:
    payload = '<script>document.body.dataset.honeytrace="xss"</script>'
    created = client.post("/orders/1/notes", json={"author_id": 1, "note": payload})
    rendered = client.get("/orders/1/notes/render")

    assert created.status_code == 201
    assert rendered.status_code == 200
    assert payload in rendered.text
    assert rendered.headers["content-type"].startswith("text/html")
    assert any(event["event_type"] == "STORED_XSS_PAYLOAD" for event in get_event_buffer())


@pytest.mark.integration
def test_http_event_has_collector_required_fields(client) -> None:
    response = client.get("/health", headers={"User-Agent": "honeytrace-test"})
    trace_id = response.headers["X-Trace-ID"]
    event = next(
        event
        for event in get_event_buffer()
        if event["event_type"] == "HTTP_REQUEST" and event["trace_id"] == trace_id
    )

    assert event["method"] == "GET"
    assert event["path"] == "/health"
    assert event["status_code"] == 200
    assert event["duration_ms"] >= 0
    assert event["user_agent"] == "honeytrace-test"


@pytest.mark.integration
def test_database_query_telemetry_is_correlated(client) -> None:
    response = client.get("/products", headers={"X-Trace-ID": "a" * 32})
    assert response.status_code == 200
    db_events = [event for event in get_event_buffer() if event["event_type"] == "DB_QUERY"]
    assert db_events
    assert any(event["trace_id"] == "a" * 32 and event["raw_source"] == "postgresql" for event in db_events)


@pytest.mark.integration
def test_system_telemetry_is_exposed_for_scraping(client) -> None:
    response = client.get("/health/observability")
    assert response.status_code == 200
    assert response.json()["system"]["cpu_count"] >= 1
    metric = next(event for event in get_event_buffer() if event["event_type"] == "SYSTEM_METRIC")
    assert metric["trace_id"] == response.headers["X-Trace-ID"]
