
import hashlib

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.models import User
from app.db.session import get_db
from app.observability.events import emit_security_event


router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=128)


@router.post("", status_code=status.HTTP_200_OK)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    valid = bool(user and user.is_active and user.password_hash == hashlib.sha256(payload.password.encode()).hexdigest())
    if not valid:
        emit_security_event(
            request,
            event_type="AUTH_FAILURE",
            vulnerability="Brute Force",
            outcome="invalid_credentials",
            status_code=status.HTTP_401_UNAUTHORIZED,
            payload=payload.password,
            metadata={"username": payload.username},
        )
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"authenticated": False, "detail": "invalid credentials"},
        )
    emit_security_event(
        request,
        event_type="AUTH_SUCCESS",
        vulnerability="Brute Force",
        outcome="authenticated",
        status_code=status.HTTP_200_OK,
        metadata={"user_id": user.id},
    )
    return {"authenticated": True, "user_id": user.id, "role": user.role}
