from __future__ import annotations

import re
import time
from uuid import uuid4

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from app.observability.events import build_event, emit_event
from app.observability.context import current_trace_id


TRACE_ID_PATTERN = re.compile(r"^[a-fA-F0-9]{16,32}$")


def _trace_id(request: Request) -> str:
    candidate = request.headers.get("X-Trace-ID", "")
    if TRACE_ID_PATTERN.fullmatch(candidate):
        return candidate.lower()
    traceparent = request.headers.get("traceparent", "")
    parts = traceparent.split("-")
    if len(parts) == 4 and TRACE_ID_PATTERN.fullmatch(parts[1]):
        return parts[1].lower()
    return uuid4().hex


class ObservabilityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        started = time.perf_counter()
        request.state.trace_id = _trace_id(request)
        trace_token = current_trace_id.set(request.state.trace_id)
        status_code = 500
        response: Response | None = None
        try:
            response = await call_next(request)
            status_code = response.status_code
            return response
        finally:
            duration_ms = (time.perf_counter() - started) * 1000
            emit_event(
                build_event(
                    event_type="HTTP_REQUEST",
                    trace_id=request.state.trace_id,
                    source_ip=request.client.host if request.client else None,
                    session_id=request.headers.get("X-Session-ID"),
                    method=request.method,
                    path=request.url.path,
                    status_code=status_code,
                    duration_ms=duration_ms,
                    user_agent=request.headers.get("User-Agent"),
                    metadata={
                        "query_keys": sorted(request.query_params.keys()),
                        "request_content_length": request.headers.get("Content-Length"),
                        "response_content_length": response.headers.get("Content-Length") if response else None,
                    },
                )
            )
            if response is not None:
                response.headers["X-Trace-ID"] = request.state.trace_id
            current_trace_id.reset(trace_token)
