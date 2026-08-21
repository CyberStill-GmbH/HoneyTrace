import json

from collector.event_collector import collect_ndjson


def test_ndjson_pipeline_preserves_trace_for_correlation():
    event = {
        "schema_version": "1.0",
        "event_id": "evt-1",
        "timestamp": "2026-08-21T10:00:00Z",
        "trace_id": "trace-attack-1",
        "event_type": "AUTH_FAILURE",
        "raw_source": "honeypot-api",
        "metadata": {"attempt": 3},
    }
    normalized = list(collect_ndjson([json.dumps(event)]))
    assert normalized[0]["trace_id"] == "trace-attack-1"
    assert normalized[0]["event_type"] == "AUTH_FAILURE"
