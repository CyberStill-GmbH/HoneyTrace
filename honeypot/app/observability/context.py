from contextvars import ContextVar


current_trace_id: ContextVar[str] = ContextVar("honeytrace_trace_id", default="unknown")
