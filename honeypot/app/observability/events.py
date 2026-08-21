from __future__ import annotations

import hashlib
import json
import logging
import os
import sys
from collections import deque
from datetime import UTC, datetime
from logging.handlers import RotatingFileHandler
from pathlib import Path
from threading import Lock
from typing import Any
from uuid import uuid4

from fastapi import Request


SCHEMA_VERSION = "1.1"
LOGGER_NAME = "honeytrace.events"
_event_buffer: deque[dict[str, Any]] = deque(maxlen=0)
_buffer_lock = Lock()
_event_stats = {"emitted": 0, "security": 0}
_sequence = 0


class JsonLineFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        return record.getMessage()


def configure_observability() -> None:
    logger = logging.getLogger(LOGGER_NAME)
    if logger.handlers:
        return
    logger.setLevel(logging.INFO)
    logger.propagate = False
    formatter = JsonLineFormatter()

    stream = logging.StreamHandler(sys.stdout)
    stream.setFormatter(formatter)
    logger.addHandler(stream)

    log_dir = os.getenv("HONEYTRACE_LOG_DIR")
    if log_dir:
        directory = Path(log_dir)
        directory.mkdir(parents=True, exist_ok=True)
        handler = RotatingFileHandler(
            directory / "events.ndjson",
            maxBytes=int(os.getenv("HONEYTRACE_LOG_MAX_BYTES", str(5 * 1024 * 1024))),
            backupCount=int(os.getenv("HONEYTRACE_LOG_BACKUPS", "2")),
            encoding="utf-8",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)


def configure_event_buffer(size: int) -> None:
    global _event_buffer
    with _buffer_lock:
        _event_buffer = deque(maxlen=max(0, size))


def clear_event_buffer() -> None:
    global _sequence
    with _buffer_lock:
        _event_buffer.clear()
        _event_stats.update({"emitted": 0, "security": 0})
        _sequence = 0


def get_event_buffer() -> list[dict[str, Any]]:
    with _buffer_lock:
        return list(_event_buffer)


def get_event_stats() -> dict[str, int]:
    with _buffer_lock:
        return dict(_event_stats)


def _sanitize(value: Any) -> Any:
    if isinstance(value, str):
        return value[:256]
    if isinstance(value, dict):
        return {str(key)[:64]: _sanitize(item) for key, item in list(value.items())[:32]}
    if isinstance(value, (list, tuple)):
        return [_sanitize(item) for item in value[:20]]
    if value is None or isinstance(value, (bool, int, float)):
        return value
    return str(value)[:256]


def build_event(
    *,
    event_type: str,
    trace_id: str,
    source_ip: str | None = None,
    session_id: str | None = None,
    method: str | None = None,
    path: str | None = None,
    status_code: int | None = None,
    duration_ms: float | None = None,
    user_agent: str | None = None,
    vulnerability: str | None = None,
    outcome: str | None = None,
    payload: str | bytes | None = None,
    metadata: dict[str, Any] | None = None,
    raw_source: str = "honeypot-api",
) -> dict[str, Any]:
    now = datetime.now(UTC)
    event: dict[str, Any] = {
        "schema_version": SCHEMA_VERSION,
        "event_id": str(uuid4()),
        "timestamp": now.isoformat(timespec="milliseconds").replace("+00:00", "Z"),
        "ingest_timestamp": now.isoformat(timespec="milliseconds").replace("+00:00", "Z"),
        "trace_id": trace_id,
        "sequence": 0,
        "event_type": event_type,
        "raw_source": raw_source,
    }
    optional = {
        "source_ip": source_ip,
        "session_id": session_id,
        "method": method,
        "path": path,
        "status_code": status_code,
        "duration_ms": round(duration_ms, 3) if duration_ms is not None else None,
        "user_agent": user_agent[:256] if user_agent else None,
        "vulnerability": vulnerability,
        "outcome": outcome,
        "metadata": _sanitize(metadata) if metadata else None,
    }
    event.update({key: value for key, value in optional.items() if value is not None})
    if payload is not None:
        raw = payload.encode("utf-8", errors="replace") if isinstance(payload, str) else payload
        event["payload_sha256"] = hashlib.sha256(raw).hexdigest()
        event["payload_size"] = len(raw)
    return event


def emit_event(event: dict[str, Any]) -> None:
    global _sequence
    configure_observability()
    with _buffer_lock:
        event["sequence"] = _sequence
        _sequence += 1
        logging.getLogger(LOGGER_NAME).info(json.dumps(event, separators=(",", ":"), ensure_ascii=False))
        _event_stats["emitted"] += 1
        if _event_buffer.maxlen:
            _event_buffer.append(event)


def emit_security_event(
    request: Request,
    *,
    event_type: str,
    vulnerability: str,
    outcome: str,
    status_code: int,
    payload: str | bytes | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    with _buffer_lock:
        _event_stats["security"] += 1
    emit_event(
        build_event(
            event_type=event_type,
            trace_id=request.state.trace_id,
            source_ip=request.client.host if request.client else None,
            session_id=request.headers.get("X-Session-ID"),
            method=request.method,
            path=request.url.path,
            status_code=status_code,
            user_agent=request.headers.get("User-Agent"),
            vulnerability=vulnerability,
            outcome=outcome,
            payload=payload,
            metadata=metadata,
        )
    )
