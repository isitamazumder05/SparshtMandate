from sqlalchemy import Column, String, Integer, Text, DateTime
from datetime import datetime
from backend.database import Base

class UserModel(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    password_salt = Column(String, nullable=False)
    full_name = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

class UserSessionModel(Base):
    __tablename__ = "sessions"

    token = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)

class AnalysisModel(Base):
    __tablename__ = "analyses"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=True) # Linked to UserModel.id
    merchant_name = Column(String, index=True)
    source_url = Column(String, index=True)
    analyzed_at = Column(DateTime, default=datetime.utcnow)
    transparency_score = Column(Integer, default=0)
    transparency_grade = Column(String, default="C")
    verification_coverage_pct = Column(Integer, default=0)
    
    # Serialized JSON representations
    extracted_terms_json = Column(Text, default="{}")
    timeline_json = Column(Text, default="[]")
    findings_json = Column(Text, default="[]")
    mandate_verification_json = Column(Text, default="{}")
    ai_recommendations_json = Column(Text, default="[]")
    raw_text_preview = Column(Text, default="")
    extraction_mode = Column(String, default="HEURISTIC_PARSER")

    # Interactive Subscription Intelligence Extensions
    user_subscription_json = Column(Text, default="{}")
    price_comparison_json = Column(Text, default="{}")
    offer_intelligence_json = Column(Text, default="{}")
    scorecard_json = Column(Text, default="{}")
    chat_history_json = Column(Text, default="[]")
