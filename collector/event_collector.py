from __future__ import annotations

import json
from collections.abc import Iterable, Iterator
from typing import Any

from normalizer.normalizer import EventValidationError, normalize_event


def collect_ndjson(lines: Iterable[str], max_events: int = 1000) -> Iterator[dict[str, Any]]:
    """Ingest bounded NDJSON and pass each object to the Normalizer."""
    accepted = 0
    for line_number, line in enumerate(lines, start=1):
        if accepted >= max_events:
            break
        if not line.strip():
            continue
        try:
            payload = json.loads(line)
            if not isinstance(payload, dict):
                raise EventValidationError("event must be an object")
            yield normalize_event(payload, sequence=line_number)
            accepted += 1
        except (json.JSONDecodeError, EventValidationError) as exc:
            raise EventValidationError(f"line {line_number}: {exc}") from exc


def collect_stream(lines: Iterable[str], max_events: int = 1000) -> tuple[list[dict[str, Any]], list[str]]:
    """Ingest a bounded stream, isolating malformed records from valid ones."""
    accepted: list[dict[str, Any]] = []
    rejected: list[str] = []
    for line_number, line in enumerate(lines, start=1):
        if len(accepted) >= max_events:
            break
        if not line.strip():
            continue
        try:
            payload = json.loads(line)
            if not isinstance(payload, dict):
                raise EventValidationError("event must be an object")
            accepted.append(normalize_event(payload, sequence=line_number))
        except (json.JSONDecodeError, EventValidationError) as exc:
            rejected.append(f"line {line_number}: {exc}")
    return accepted, rejected
