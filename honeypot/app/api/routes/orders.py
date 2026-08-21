from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.models import Note, Order
from app.db.session import get_db
from app.observability.events import emit_security_event


router = APIRouter(prefix="/orders", tags=["orders"])


class NoteRequest(BaseModel):
    author_id: int
    note: str = Field(min_length=1, max_length=120)


@router.post("/{order_id}/notes", status_code=201)
def create_note(order_id: int, payload: NoteRequest, request: Request, db: Session = Depends(get_db)):
    if db.get(Order, order_id) is None:
        return {"detail": "order not found"}
    note = Note(author_id=payload.author_id, order_id=order_id, content=payload.note)
    db.add(note)
    db.commit()
    db.refresh(note)
    emit_security_event(
        request,
        event_type="STORED_XSS_PAYLOAD",
        vulnerability="Stored XSS mediante Note",
        outcome="payload_stored",
        status_code=201,
        payload=payload.note,
        metadata={"order_id": order_id, "note_id": note.id},
    )
    return {"id": note.id, "order_id": note.order_id, "note": note.content}


@router.get("/{order_id}/notes/render", response_class=HTMLResponse)
def render_notes(order_id: int, request: Request, db: Session = Depends(get_db)):
    notes = db.query(Note).filter(Note.order_id == order_id).order_by(Note.id).all()
    body = "".join(note.content for note in notes)
    emit_security_event(
        request,
        event_type="STORED_XSS_RENDER",
        vulnerability="Stored XSS mediante Note",
        outcome="payload_rendered_in_decoy_view",
        status_code=200,
        metadata={"order_id": order_id, "note_count": len(notes)},
    )
    return f"<html><body><main id='notes'>{body}</main></body></html>"
