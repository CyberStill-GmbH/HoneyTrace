from fastapi import APIRouter

from app.api.routes import auth, files, orders, products, users


api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(products.router)
api_router.include_router(files.router)
api_router.include_router(orders.router)
