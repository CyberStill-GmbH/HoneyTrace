from pathlib import Path

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import PlainTextResponse

from app.observability.events import emit_security_event
from app.services.decoy_files import resolve_decoy_path


router = APIRouter(prefix="/files", tags=["files"])


@router.get("", response_class=PlainTextResponse)
def read_file(path: str, request: Request):
    root: Path = getattr(request.app.state, "decoy_root", Path("/app/decoy_data"))
    try:
        requested = resolve_decoy_path(root, path)
    except (PermissionError, ValueError):
        emit_security_event(
            request,
            event_type="PATH_TRAVERSAL_ATTEMPT",
            vulnerability="Path Traversal",
            outcome="blocked_outside_decoy_root",
            status_code=403,
            payload=path,
        )
        raise HTTPException(status_code=403, detail="path outside decoy filesystem")
    if not requested.is_file():
        raise HTTPException(status_code=404, detail="file not found")
    emit_security_event(
        request,
        event_type="PATH_TRAVERSAL_ACCESS",
        vulnerability="Path Traversal",
        outcome="decoy_file_returned",
        status_code=200,
        payload=path,
    )
    return requested.read_text(encoding="utf-8")
