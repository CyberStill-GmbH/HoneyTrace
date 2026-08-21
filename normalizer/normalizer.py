from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any

SCHEMA_VERSION = "1.1"
MAX_EVENT_BYTES = 64 * 1024
REQUIRED_FIELDS = {"schema_version", "event_id", "timestamp", "trace_id", "event_type", "raw_source"}


class EventValidationError(ValueError):
    """Raised when an event cannot safely enter the normalized pipeline."""


def normalize_event(raw: dict[str, Any], sequence: int | None = None) -> dict[str, Any]:
    missing = REQUIRED_FIELDS - raw.keys()
    if missing:
        raise EventValidationError(f"missing required fields: {sorted(missing)}")
    if not isinstance(raw["event_id"], str) or not isinstance(raw["trace_id"], str):
        raise EventValidationError("event_id and trace_id must be strings")
    try:
        datetime.fromisoformat(str(raw["timestamp"]).replace("Z", "+00:00"))
    except ValueError as exc:
        raise EventValidationError("timestamp must be ISO-8601") from exc
    encoded = json.dumps(raw, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    if len(encoded) > MAX_EVENT_BYTES:
        raise EventValidationError("event exceeds maximum size")
    event = dict(raw)
    event["schema_version"] = SCHEMA_VERSION
    event.setdefault("ingest_timestamp", datetime.now(UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z"))
    if "sequence" not in event:
        event["sequence"] = sequence if sequence is not None else 0
    if not isinstance(event["sequence"], int) or event["sequence"] < 0:
        raise EventValidationError("sequence must be a non-negative integer")
    event["event_type"] = str(event["event_type"]).upper()[:64]
    event["raw_source"] = str(event["raw_source"])[:64]
    event.setdefault("metadata", {})
    if not isinstance(event["metadata"], dict):
        raise EventValidationError("metadata must be an object")
    if "entities" in event and (not isinstance(event["entities"], list) or len(event["entities"]) > 16):
        raise EventValidationError("entities must be a bounded list")
    if "causes" in event and (not isinstance(event["causes"], list) or len(event["causes"]) > 16):
        raise EventValidationError("causes must be a bounded list")
    return event
