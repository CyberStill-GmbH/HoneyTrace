from __future__ import annotations

import hashlib
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.models import Order, Product, User
from app.db.session import get_db
from app.main import app
from app.observability.events import clear_event_buffer


@pytest.fixture()
def db_session() -> Session:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)
    session = factory()
    session.add_all(
        [
            User(
                id=1,
                username="analyst",
                email="analyst@example.test",
                password_hash=hashlib.sha256(b"honey123").hexdigest(),
                role="analyst",
                is_active=True,
            ),
            User(
                id=2,
                username="admin",
                email="admin@example.test",
                password_hash=hashlib.sha256(b"admin-demo").hexdigest(),
                role="admin",
                is_active=True,
            ),
            Product(id=1, name="Honey Jar", description="Synthetic product", price=Decimal("12.50"), stock=20),
            Product(id=2, name="Wax Block", description="Synthetic product", price=Decimal("8.00"), stock=15),
            Product(id=3, name="Bee Brush", description="Synthetic product", price=Decimal("5.75"), stock=30),
            Order(id=1, user_id=1, status="pending", total=Decimal("12.50")),
        ]
    )
    session.commit()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


@pytest.fixture()
def client(db_session: Session, tmp_path) -> TestClient:
    def override_db():
        yield db_session

    decoy_root = tmp_path / "decoy"
    (decoy_root / "public").mkdir(parents=True)
    (decoy_root / "secrets").mkdir()
    (decoy_root / "public" / "welcome.txt").write_text("public decoy", encoding="utf-8")
    (decoy_root / "secrets" / "system.txt").write_text("synthetic secret", encoding="utf-8")
    app.state.decoy_root = decoy_root
    app.dependency_overrides[get_db] = override_db
    clear_event_buffer()
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
