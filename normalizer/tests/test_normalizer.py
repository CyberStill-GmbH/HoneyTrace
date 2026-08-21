import pytest

from normalizer.normalizer import EventValidationError, normalize_event


def event(**overrides):
    value = {"schema_version": "1.0", "event_id": "evt-1", "timestamp": "2026-08-21T10:00:00Z", "trace_id": "trace-1", "event_type": "http_request", "raw_source": "honeypot-api"}
    value.update(overrides)
    return value


def test_normalize_event_validates_and_normalizes_type():
    result = normalize_event(event())
    assert result["event_type"] == "HTTP_REQUEST"
    assert result["schema_version"] == "1.1"
    assert result["sequence"] == 0
    assert result["metadata"] == {}


def test_normalize_event_rejects_missing_fields():
    with pytest.raises(EventValidationError, match="missing required"):
        normalize_event({"event_id": "only-one"})


def test_normalize_event_rejects_oversized_payload():
    with pytest.raises(EventValidationError, match="maximum size"):
        normalize_event(event(metadata={"payload": "x" * (64 * 1024)}))


def test_normalize_event_rejects_invalid_metadata():
    with pytest.raises(EventValidationError, match="metadata"):
        normalize_event(event(metadata=[]))
