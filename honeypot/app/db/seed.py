from __future__ import annotations

import hashlib
from decimal import Decimal

from sqlalchemy import select

from app.db.models import Order, Product, User
from app.db.session import SessionLocal


def seed_database() -> None:
    with SessionLocal() as session:
        if session.scalar(select(User.id).limit(1)) is not None:
            return
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


if __name__ == "__main__":
    seed_database()
