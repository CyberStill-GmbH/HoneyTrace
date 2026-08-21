import json

import pytest

from collector.event_collector import collect_ndjson, collect_stream
from collector.normalizer import EventValidationError, normalize_event


def event(**overrides):
    value = {
        "schema_version": "1.0",
        "event_id": "evt-1",
        "timestamp": "2026-08-21T10:00:00Z",
        "trace_id": "trace-1",
        "event_type": "http_request",
        "raw_source": "honeypot-api",
    }
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


def test_collect_ndjson_is_bounded_and_never_evaluates_payload():
    lines = [json.dumps(event(event_id=f"evt-{i}")) for i in range(3)]
    assert len(list(collect_ndjson(lines, max_events=2))) == 2


def test_collect_ndjson_rejects_malformed_line():
    with pytest.raises(EventValidationError, match="line 1"):
        list(collect_ndjson(["not-json"]))


def test_collect_stream_assigns_input_sequence_when_missing():
    accepted, rejected = collect_stream(["", json.dumps(event()), json.dumps(event())])
    assert not rejected
    assert [item["sequence"] for item in accepted] == [2, 3]
