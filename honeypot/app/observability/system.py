from __future__ import annotations

import os
import shutil
from pathlib import Path

from app.observability.events import build_event, emit_event


def _memory_mb() -> tuple[int | None, int | None]:
    meminfo = Path("/proc/meminfo")
    if not meminfo.exists():
        return None, None
    values = {}
    for line in meminfo.read_text(encoding="utf-8").splitlines():
        key, _, value = line.partition(":")
        if value.strip().endswith(" kB"):
            values[key] = int(value.split()[0]) // 1024
    return values.get("MemTotal"), values.get("MemAvailable")


def emit_system_metric(trace_id: str = "system") -> dict[str, object]:
    total_mb, available_mb = _memory_mb()
    disk_path = Path(os.getenv("HONEYTRACE_LOG_DIR", "/var/log/honeytrace"))
    disk = shutil.disk_usage(disk_path if disk_path.exists() else Path.cwd())
    metric = {
        "cpu_count": os.cpu_count(),
        "memory_total_mb": total_mb,
        "memory_available_mb": available_mb,
        "disk_free_bytes": disk.free,
        "disk_total_bytes": disk.total,
    }
    emit_event(
        build_event(
            event_type="SYSTEM_METRIC",
            trace_id=trace_id,
            raw_source="system",
            outcome="sampled",
            metadata=metric,
        )
    )
    return metric
