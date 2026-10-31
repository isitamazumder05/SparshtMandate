from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from backend.config import settings

engine = create_engine(
    settings.DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initializes tables and applies non-destructive schema migrations."""
    # 1. Create any missing tables (users, sessions, analyses)
    Base.metadata.create_all(bind=engine)

    # 2. Safely add missing columns to existing tables
    inspector = inspect(engine)
    if "analyses" in inspector.get_table_names():
        existing_cols = {col["name"] for col in inspector.get_columns("analyses")}
        with engine.connect() as conn:
            if "user_id" not in existing_cols:
                conn.execute(text("ALTER TABLE analyses ADD COLUMN user_id VARCHAR"))
                conn.commit()
            if "timeline_json" not in existing_cols:
                conn.execute(text("ALTER TABLE analyses ADD COLUMN timeline_json TEXT DEFAULT '[]'"))
                conn.commit()
            if "user_subscription_json" not in existing_cols:
                conn.execute(text("ALTER TABLE analyses ADD COLUMN user_subscription_json TEXT DEFAULT '{}'"))
                conn.commit()
            if "price_comparison_json" not in existing_cols:
                conn.execute(text("ALTER TABLE analyses ADD COLUMN price_comparison_json TEXT DEFAULT '{}'"))
                conn.commit()
            if "offer_intelligence_json" not in existing_cols:
                conn.execute(text("ALTER TABLE analyses ADD COLUMN offer_intelligence_json TEXT DEFAULT '{}'"))
                conn.commit()
            if "scorecard_json" not in existing_cols:
                conn.execute(text("ALTER TABLE analyses ADD COLUMN scorecard_json TEXT DEFAULT '{}'"))
                conn.commit()
            if "chat_history_json" not in existing_cols:
                conn.execute(text("ALTER TABLE analyses ADD COLUMN chat_history_json TEXT DEFAULT '[]'"))
                conn.commit()

