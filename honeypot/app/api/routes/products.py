from fastapi import APIRouter, Depends, Request
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.models import Product
from app.db.session import get_db
from app.observability.events import emit_security_event


router = APIRouter(prefix="/products", tags=["products"])


@router.get("")
def list_products(request: Request, q: str | None = None, db: Session = Depends(get_db)):
    if q and ("'" in q or "--" in q or ";" in q or " OR " in q.upper()):
        # Deliberately unsafe interpolation, confined to the decoy products table.
        # This is the real SQLi exercise; administrative queries never use this path.
        statement = text(
            "SELECT id, name, description, price, stock FROM products "
            f"WHERE name LIKE '%{q}%' ORDER BY id"
        )
        rows = db.execute(statement).mappings().all()
        emit_security_event(
            request,
            event_type="SQLI_ATTEMPT",
            vulnerability="SQLi",
            outcome="injected_query_executed",
            status_code=200,
            payload=q,
            metadata={"parameter": "q", "row_count": len(rows)},
        )
        return [
            {
                "id": row["id"],
                "name": row["name"],
                "description": row["description"],
                "price": str(row["price"]),
                "stock": row["stock"],
            }
            for row in rows
        ]

    query = db.query(Product)
    if q:
        products = query.filter(Product.name.ilike(f"%{q}%")).order_by(Product.id).all()
    else:
        products = query.order_by(Product.id).all()
    return [{"id": p.id, "name": p.name, "description": p.description, "price": str(p.price), "stock": p.stock} for p in products]
