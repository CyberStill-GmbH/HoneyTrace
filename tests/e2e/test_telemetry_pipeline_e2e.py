from __future__ import annotations

import json
import os
from pathlib import Path
from uuid import uuid4

import httpx

from collector.event_collector import collect_stream


BASE_URL = os.getenv("HONEYPOT_BASE_URL", "http://127.0.0.1:8000")
LOG_FILE = Path(os.getenv("HONEYTRACE_LOG_FILE", "honeypot/logs/events.ndjson"))


def test_e2e_telemetry_reaches_collector_contract() -> None:
    with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
        trace = uuid4().hex
        assert client.get("/health", headers={"X-Trace-ID": trace}).status_code == 200
        assert client.get("/health/observability", headers={"X-Trace-ID": trace}).status_code == 200
        assert client.get("/products", params={"q": "' OR 1=1 --"}, headers={"X-Trace-ID": trace}).status_code == 200

    assert LOG_FILE.exists(), f"telemetry file not found: {LOG_FILE}"
    raw_lines = LOG_FILE.read_text(encoding="utf-8").splitlines()
    accepted, rejected = collect_stream(raw_lines, max_events=5000)
    assert not rejected
    event_types = {event["event_type"] for event in accepted}
    assert {"HTTP_REQUEST", "DB_QUERY", "SYSTEM_METRIC", "SQLI_ATTEMPT"} <= event_types
    assert any(event["raw_source"] == "postgresql" for event in accepted)
    assert any(event["trace_id"] == trace and event["event_type"] == "DB_QUERY" for event in accepted)
    sequences = [event["sequence"] for event in accepted if event["trace_id"] == trace]
    assert sequences == sorted(sequences)


def test_e2e_wazuh_input_is_present_and_json_lines_are_valid() -> None:
    config = Path("wazuh/honeytrace-localfile.xml")
    assert config.exists()
    assert "<log_format>json</log_format>" in config.read_text(encoding="utf-8")
    for line in LOG_FILE.read_text(encoding="utf-8").splitlines():
        if line.strip():
            json.loads(line)
