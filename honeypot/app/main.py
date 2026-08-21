from fastapi import FastAPI, Request

from app.api.router import api_router
from app.observability.events import configure_event_buffer, configure_observability, get_event_stats
from app.observability.middleware import ObservabilityMiddleware
from app.observability.system import emit_system_metric


app = FastAPI(title="HoneyTrace Honeypot")
configure_observability()
configure_event_buffer(2048)
app.add_middleware(ObservabilityMiddleware)
app.include_router(api_router)


@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/observability", tags=["system"])
def observability_health(request: Request) -> dict[str, object]:
    """Bounded operational counters; no payloads or secrets are returned."""
    metric = emit_system_metric(request.state.trace_id)
    return {"status": "ok", "events": get_event_stats(), "buffer_capacity": 2048, "system": metric}
