from app.observability.events import build_event, clear_event_buffer, emit_event, get_event_stats


def test_event_contract_uses_hashes_and_bounded_metadata() -> None:
    event = build_event(
        event_type="SQLI_ATTEMPT",
        trace_id="a" * 32,
        source_ip="127.0.0.1",
        method="GET",
        path="/products",
        status_code=200,
        vulnerability="SQLi",
        outcome="observed",
        payload="' OR 1=1 --",
        metadata={"query": "x" * 1000},
    )

    assert event["schema_version"] == "1.1"
    assert event["event_id"]
    assert event["timestamp"].endswith("Z")
    assert event["ingest_timestamp"].endswith("Z")
    assert event["sequence"] >= 0
    assert event["payload_sha256"]
    assert "payload" not in event
    assert len(event["metadata"]["query"]) <= 256


def test_event_contract_omits_empty_optional_fields() -> None:
    event = build_event(event_type="HEALTH_CHECK", trace_id="b" * 32)

    assert event["trace_id"] == "b" * 32
    assert "source_ip" not in event
    assert "payload_sha256" not in event


def test_event_stats_are_bounded_operational_counters() -> None:
    clear_event_buffer()
    emit_event(build_event(event_type="HTTP_REQUEST", trace_id="c" * 32))
    assert get_event_stats()["emitted"] == 1
    assert "payload" not in get_event_stats()
