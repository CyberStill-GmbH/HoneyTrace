import json

from collector.event_collector import collect_stream


def test_collect_stream_keeps_valid_events_when_one_line_is_bad():
    valid = {
        "schema_version": "1.0",
        "event_id": "evt-1",
        "timestamp": "2026-08-21T10:00:00Z",
        "trace_id": "trace-1",
        "event_type": "HTTP_REQUEST",
        "raw_source": "honeypot-api",
    }
    accepted, rejected = collect_stream(["bad", json.dumps(valid)])
    assert len(accepted) == 1
    assert len(rejected) == 1
    assert rejected[0].startswith("line 1:")
