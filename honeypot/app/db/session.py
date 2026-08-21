import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db import telemetry  # noqa: F401 - registers SQLAlchemy listeners

load_dotenv()
db_url = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://honeytrace:password@localhost:5432/honeytrace",
)

engine = create_engine(db_url, pool_pre_ping=True)

SessionLocal = sessionmaker(expire_on_commit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try: 
        yield db
    finally:
        db.close()
