from __future__ import annotations

import os
from pathlib import Path

import httpx
import pytest


BASE_URL = os.getenv("HONEYPOT_BASE_URL", "http://127.0.0.1:8000")
LOG_FILE = Path(os.getenv("HONEYTRACE_LOG_FILE", "honeypot/logs/events.ndjson"))
MAX_ROTATED_LOG_BYTES = int(os.getenv("HONEYTRACE_LOG_MAX_BYTES", str(5 * 1024 * 1024)))


def _meminfo() -> dict[str, int]:
    values: dict[str, int] = {}
    for line in Path("/proc/meminfo").read_text(encoding="utf-8").splitlines():
        key, _, value = line.partition(":")
        if value.strip().endswith(" kB"):
            values[key] = int(value.split()[0]) * 1024
    return values


@pytest.mark.physical
def test_rpi_runtime_contract_and_telemetry() -> None:
    """Hardware smoke test: run on Raspberry Pi OS with the SSD mounted."""
    meminfo = _meminfo()
    assert meminfo["MemTotal"] > 0
    assert meminfo["MemAvailable"] > 0
    assert Path("/proc").is_dir()

    with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
        trace = "c" * 32
        health = client.get("/health", headers={"X-Trace-ID": trace})
        assert health.status_code == 200
        telemetry = client.get("/health/observability", headers={"X-Trace-ID": trace})
        assert telemetry.status_code == 200
        system = telemetry.json()["system"]
        assert system["cpu_count"] >= 1
        assert system["memory_available_mb"] is not None
        assert system["disk_free_bytes"] > 0

    assert LOG_FILE.exists()
    assert LOG_FILE.stat().st_size <= MAX_ROTATED_LOG_BYTES
    lines = [line for line in LOG_FILE.read_text(encoding="utf-8").splitlines() if line.strip()]
    assert lines
    assert any('"event_type":"SYSTEM_METRIC"' in line for line in lines)
    assert any(f'"trace_id":"{trace}"' in line for line in lines)
