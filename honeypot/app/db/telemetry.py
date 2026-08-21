from __future__ import annotations

import hashlib
import re
import time
from typing import Any

from sqlalchemy import event
from sqlalchemy.engine import Engine

from app.observability.context import current_trace_id
from app.observability.events import build_event, emit_event


_TABLE_RE = re.compile(r"\b(?:from|into|update|join)\s+([a-zA-Z_][\w.]*)", re.IGNORECASE)


def _metadata(statement: str) -> dict[str, Any]:
    normalized = " ".join(statement.split())
    operation = normalized.split(" ", 1)[0].upper()[:16]
    table_match = _TABLE_RE.search(normalized)
    table = table_match.group(1).split(".")[-1][:64] if table_match else "unknown"
    return {
        "operation": operation,
        "table": table,
        "statement_sha256": hashlib.sha256(normalized.encode()).hexdigest(),
        "statement_size": len(normalized.encode()),
    }


@event.listens_for(Engine, "before_cursor_execute")
def _before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    conn.info["honeytrace_query_started"] = time.perf_counter()


@event.listens_for(Engine, "after_cursor_execute")
def _after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    started = conn.info.pop("honeytrace_query_started", time.perf_counter())
    emit_event(
        build_event(
            event_type="DB_QUERY",
            trace_id=current_trace_id.get(),
            raw_source="postgresql",
            duration_ms=(time.perf_counter() - started) * 1000,
            outcome="success",
            metadata={**_metadata(statement), "rowcount": max(cursor.rowcount, 0)},
        )
    )


@event.listens_for(Engine, "handle_error")
def _handle_error(exception_context):
    statement = exception_context.statement or ""
    emit_event(
        build_event(
            event_type="DB_ERROR",
            trace_id=current_trace_id.get(),
            raw_source="postgresql",
            outcome=type(exception_context.original_exception).__name__[:128],
            payload=statement,
            metadata=_metadata(statement),
        )
    )

