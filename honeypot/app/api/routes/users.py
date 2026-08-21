from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.db.models import User
from app.db.session import get_db
from app.observability.events import emit_security_event


router = APIRouter(prefix="/users", tags=["users"])


@router.get("/{user_id}")
def get_user(user_id: int, request: Request, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if user is None:
        emit_security_event(
            request,
            event_type="IDOR_MISS",
            vulnerability="IDOR",
            outcome="not_found",
            status_code=404,
            metadata={"target_user_id": user_id},
        )
        return {"detail": "user not found"}
    actor = request.headers.get("X-User-ID")
    emit_security_event(
        request,
        event_type="IDOR_ACCESS",
        vulnerability="IDOR",
        outcome="object_returned",
        status_code=200,
        metadata={"actor_user_id": actor, "target_user_id": user_id},
    )
    return {"id": user.id, "username": user.username, "email": user.email, "role": user.role}
