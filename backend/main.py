"""
SpashtMandate AI - FastAPI Main Backend Application
Paytm Build for India Hackathon 2026 | Track: AI-Powered Financial Journeys
"Every payment deserves clarity."
"""

import sys
from pathlib import Path

# Ensure project root is in sys.path so 'backend' package resolves cleanly
_ROOT_DIR = Path(__file__).resolve().parent.parent
if str(_ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(_ROOT_DIR))

import uuid
import json
from datetime import datetime
from typing import List, Optional
from urllib.parse import urlparse
from pydantic import BaseModel
from fastapi import FastAPI, Depends, HTTPException, Query, Header, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.config import settings
from backend.database import init_db, get_db
from backend.models import UserModel, UserSessionModel, AnalysisModel
from backend.schemas import (
    UserCreate,
    UserLogin,
    UserResponse,
    AuthTokenResponse,
    AnalyzeRequest,
    AnalysisResponse,
    AnalysisSummary,
    ExtractedTerms,
    AuditFinding,
    TimelineEvent,
    MandateVerificationResult,
    MandateRecordInput,
    UserSubscriptionInput,
    PriceVerificationResult,
    OfferIntelligenceResult,
    TransparencyScorecard,
    ChatRequest,
    ChatResponse
)
from backend.regulatory_kb import get_all_regulatory_references
from backend.services.scraper import fetch_webpage, ScrapeError, validate_url_safety
from backend.services.extractor import extract_terms_with_llm
from backend.services.rule_engine import evaluate_disclosures
from backend.services.mandate_comparator import compare_mandate_with_disclosure
from backend.services.timeline_generator import generate_subscription_timeline
from backend.services.pdf_generator import generate_pdf_report
from backend.services.offers_engine import compute_offers_intelligence
from backend.services.price_comparator import verify_plan_and_pricing
from backend.services.ai_assistant import handle_assistant_query
from backend.services.auth import (
    create_user,
    authenticate_user,
    create_user_session,
    get_user_from_token,
    revoke_session
)

# Initialize database schema and non-destructive migrations
init_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Powered Financial Journeys: Subscription Transparency, Timeline Extraction & Regulatory Verification Engine"
)

# CORS Middleware - permits authenticated frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# Authentication Dependency
# -------------------------------------------------------------
def get_current_user(
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None),
    auth_token: Optional[str] = Query(None),
    db: Session = Depends(get_db)
) -> UserModel:
    """
    Extracts Bearer token from Authorization header or URL query parameter,
    validates session token, and returns the authenticated user.
    """
    extracted_token = None
    if authorization and authorization.startswith("Bearer "):
        extracted_token = authorization.replace("Bearer ", "").strip()
    elif token:
        extracted_token = token.strip()
    elif auth_token:
        extracted_token = auth_token.strip()

    if not extracted_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided."
        )

    user = get_user_from_token(db, extracted_token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token. Please sign in again."
        )
    return user


# -------------------------------------------------------------
# Curated Verified Testing Presets
# -------------------------------------------------------------
SAMPLE_PRESETS = [
    {
        "id": "preset-hackathon-mismatch",
        "name": "Test Original ₹299 vs ₹499 Mismatch",
        "category": "Paytm Hackathon PPT Benchmark",
        "url": "",
        "description": "Checkout disclosure: ₹99 first month, ₹299 renewal. Mandate configured: ₹499 recurring debit cap.",
        "user_subscription": {
            "merchant_name": "OTT Entertainment Stream",
            "plan_name": "Standard Monthly Subscription",
            "user_promised_price": 299.0,
            "advertised_regular_price": 299.0,
            "standard_listed_price": 299.0,
            "billing_frequency": "Monthly",
            "introductory_price": 99.0,
            "introductory_duration_months": 1,
            "expected_renewal_price": 299.0,
            "is_already_charged": False,
            "currency": "INR",
            "input_mode": "MANUAL"
        },
        "mandate_record": {
            "merchant_name": "OTT Entertainment Stream",
            "mandate_amount": "499.00",
            "frequency": "Monthly",
            "is_simulated": True,
            "umin": "AUTOPAY-SIM-299VS499@paytm"
        }
    },
    {
        "id": "preset-spotify",
        "name": "Spotify Premium India",
        "category": "Audio Streaming",
        "url": "https://www.spotify.com/in-en/premium/",
        "description": "Real-world music streaming subscription plans with trial and recurring monthly AutoPay options.",
        "user_subscription": {
            "merchant_name": "Spotify Premium India",
            "plan_name": "Individual Premium",
            "user_promised_price": 119.0,
            "advertised_regular_price": 119.0,
            "standard_listed_price": 119.0,
            "billing_frequency": "Monthly",
            "free_trial_days": 30,
            "expected_renewal_price": 119.0,
            "currency": "INR",
            "input_mode": "URL_ASSISTED"
        }
    },
    {
        "id": "preset-hotstar",
        "name": "Disney+ Hotstar Plans",
        "category": "Video OTT",
        "url": "https://help.hotstar.com/in/en/support/solutions/articles/68000001150-what-are-the-different-subscription-plans-available-on-disney-hotstar-",
        "description": "Official subscription plans, pricing tiers, and recurring billing frequency guidelines.",
        "user_subscription": {
            "merchant_name": "Disney+ Hotstar",
            "plan_name": "Super Plan",
            "user_promised_price": 299.0,
            "advertised_regular_price": 299.0,
            "standard_listed_price": 299.0,
            "billing_frequency": "Quarterly",
            "expected_renewal_price": 299.0,
            "currency": "INR",
            "input_mode": "URL_ASSISTED"
        }
    },
    {
        "id": "preset-coursera",
        "name": "Coursera Plus Subscription",
        "category": "EdTech",
        "url": "https://www.coursera.org/courseraplus",
        "description": "Annual/monthly recurring education subscription with 7-day trial terms and cancellation rules.",
        "user_subscription": {
            "merchant_name": "Coursera Plus",
            "plan_name": "Coursera Plus Monthly",
            "user_promised_price": 4999.0,
            "advertised_regular_price": 4999.0,
            "standard_listed_price": 4999.0,
            "billing_frequency": "Monthly",
            "free_trial_days": 7,
            "expected_renewal_price": 4999.0,
            "currency": "INR",
            "input_mode": "URL_ASSISTED"
        }
    }
]

# -------------------------------------------------------------
# System & Knowledge Base Routes
# -------------------------------------------------------------
@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "ai_engine": "Gemini-1.5 / OpenAI Enabled" if (settings.GEMINI_API_KEY or settings.OPENAI_API_KEY) else "Heuristic Pattern Engine (Configured for Zero-Dependency Hackathon Run)",
        "firecrawl_configured": bool(settings.FIRECRAWL_API_KEY),
        "db": "SQLite Local",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/v1/presets")
def get_presets():
    """Returns curated authentic merchant subscription pages for instant testing."""
    return SAMPLE_PRESETS

@app.get("/api/v1/regulatory-references")
def get_regulatory_docs():
    """Returns official NPCI, RBI, and Paytm regulatory references."""
    return get_all_regulatory_references()


# -------------------------------------------------------------
# Real Authentication Endpoints
# -------------------------------------------------------------
@app.post("/api/v1/auth/signup", response_model=AuthTokenResponse)
def sign_up(req: UserCreate, db: Session = Depends(get_db)):
    """Registers a new user with secure password hashing and returns session token."""
    email = req.email.strip().lower()
    if not email or "@" not in email or "." not in email:
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    
    password = req.password.strip()
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")

    try:
        user = create_user(db, email=email, password=password, full_name=req.full_name or "")
        session = create_user_session(db, user.id)
        return AuthTokenResponse(
            access_token=session.token,
            token_type="bearer",
            user=UserResponse(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                created_at=user.created_at.isoformat()
            )
        )
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/api/v1/auth/login", response_model=AuthTokenResponse)
def login(req: UserLogin, db: Session = Depends(get_db)):
    """Authenticates existing user credentials and returns an active session token."""
    email = req.email.strip().lower()
    password = req.password.strip()
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password cannot be empty.")

    user = authenticate_user(db, email=email, password=password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    session = create_user_session(db, user.id)
    return AuthTokenResponse(
        access_token=session.token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            created_at=user.created_at.isoformat()
        )
    )

@app.post("/api/v1/auth/logout")
def logout(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Terminates the user's active session token."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "").strip()
        revoke_session(db, token)
    return {"message": "Logged out successfully."}

@app.get("/api/v1/auth/me", response_model=UserResponse)
def get_current_user_profile(current_user: UserModel = Depends(get_current_user)):
    """Returns the authenticated user's profile."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        created_at=current_user.created_at.isoformat()
    )


# -------------------------------------------------------------
# Recommendation Generator Helper
# -------------------------------------------------------------
def generate_ai_recommendations(findings: List[AuditFinding], merchant_name: str) -> List[str]:
    """Generates actionable, concrete disclosure enhancements for missing/ambiguous terms."""
    recs = []
    for f in findings:
        if f.status in ("MISSING", "REVIEW") and f.suggested_corrective_disclosure:
            recs.append(f"[{f.rule_id}]: {f.suggested_corrective_disclosure}")
    
    if not recs:
        recs.append("All primary NPCI/RBI disclosure requirements are adequately represented on the page.")
    return recs


# -------------------------------------------------------------
# Subscription Analysis Workspace Endpoints
# -------------------------------------------------------------
@app.post("/api/v1/analyze", response_model=AnalysisResponse)
async def analyze_subscription(
    req: AnalyzeRequest,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    User-Driven Subscription & Recurring-Payment Intelligence:
    1. Validates mandatory user subscription plan inputs.
    2. MODE A (URL_ASSISTED): Enriches analysis with real webpage disclosures.
       MODE B (MANUAL): Performs analysis from user's entered commitments without requiring URL.
    3. Executes 3-way reconciliation (Merchant Disclosure vs User Expectation vs Payment Mandate).
    4. Evaluates multi-stage offers trajectory & deterministic 100-pt scorecard.
    5. Saves isolated analysis record to SQLite.
    """
    # Validation: User subscription details must NEVER be optional
    if not req.user_subscription:
        raise HTTPException(
            status_code=400,
            detail="User subscription details are required. You must provide plan details to verify pricing commitments."
        )

    user_sub = req.user_subscription
    merchant_name = (user_sub.merchant_name or "").strip()
    plan_name = (user_sub.plan_name or "").strip()

    if not merchant_name:
        raise HTTPException(status_code=400, detail="Merchant name is required.")
    if not plan_name:
        raise HTTPException(status_code=400, detail="Plan name/tier is required.")

    promised_price = user_sub.user_promised_price if user_sub.user_promised_price is not None else user_sub.standard_listed_price
    if promised_price is None or promised_price < 0:
        raise HTTPException(status_code=400, detail="A valid subscription price (positive number) is required.")

    # Determine input mode
    raw_url = (req.url or "").strip()
    is_url_mode = bool(raw_url and raw_url.startswith("http"))
    url = raw_url if is_url_mode else "manual://subscription-entry"

    page_text = ""
    mode = "MANUAL_ENTRY"

    if is_url_mode:
        # MODE A: URL-Assisted Extraction
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            raise HTTPException(status_code=400, detail="Invalid URL protocol. Only 'http://' and 'https://' URLs are permitted.")
        if not parsed.netloc:
            raise HTTPException(status_code=400, detail="Invalid URL hostname format.")

        try:
            validate_url_safety(url)
        except ScrapeError as e:
            raise HTTPException(status_code=400, detail=f"Security restriction: {str(e)}")

        try:
            page_text, page_title, meta = await fetch_webpage(url)
        except ScrapeError as e:
            raise HTTPException(status_code=422, detail=f"Webpage Access Error: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Unexpected error while fetching URL: {str(e)}")

        if not page_text or len(page_text.strip()) < 20:
            raise HTTPException(status_code=422, detail="The merchant webpage returned insufficient textual content to audit.")

        # Extract structured terms from merchant DOM (plan-aware target matching)
        terms, mode = await extract_terms_with_llm(page_text, url, page_title, target_plan=plan_name)
    else:
        # MODE B: Enter Subscription Manually (No URL required)
        adv_price = user_sub.advertised_regular_price or user_sub.standard_listed_price or promised_price
        terms = ExtractedTerms(
            merchant_name=FieldEvidence(
                value=merchant_name,
                supporting_text=f"Customer declared merchant: {merchant_name}",
                verification_status="VERIFIED",
                confidence_score=1.0
            ),
            subscription_amount=FieldEvidence(
                value=f"{adv_price:.2f}",
                supporting_text=f"Advertised regular price: {user_sub.currency} {adv_price:.2f}",
                verification_status="VERIFIED",
                confidence_score=1.0
            ),
            currency=FieldEvidence(
                value=user_sub.currency,
                verification_status="VERIFIED",
                confidence_score=1.0
            ),
            billing_frequency=FieldEvidence(
                value=user_sub.billing_frequency,
                supporting_text=f"Billing cadence: {user_sub.billing_frequency}",
                verification_status="VERIFIED",
                confidence_score=1.0
            ),
            free_trial_available=FieldEvidence(
                value=bool(user_sub.free_trial_days and user_sub.free_trial_days > 0),
                verification_status="VERIFIED",
                confidence_score=1.0
            ),
            trial_duration_days=FieldEvidence(
                value=user_sub.free_trial_days or 0,
                verification_status="VERIFIED" if user_sub.free_trial_days else "NOT_APPLICABLE",
                confidence_score=1.0
            ),
            renewal_amount=FieldEvidence(
                value=f"{(user_sub.expected_renewal_price or adv_price):.2f}",
                supporting_text=f"Expected ongoing renewal rate: {user_sub.currency} {(user_sub.expected_renewal_price or adv_price):.2f}",
                verification_status="VERIFIED",
                confidence_score=1.0
            ),
            cancellation_policy=FieldEvidence(
                value="Standard customer cancellation procedure",
                supporting_text="Declared in user plan terms",
                verification_status="VERIFIED",
                confidence_score=0.9
            ),
            pre_debit_notification=FieldEvidence(
                value="Statutory 24-hour advance intimation",
                supporting_text="RBI/2019-20/47 and NPCI UPI AutoPay mandatory 24h pre-debit alert requirement",
                verification_status="VERIFIED",
                confidence_score=0.9
            ),
            payment_method=FieldEvidence(
                value="UPI AutoPay / e-Mandate",
                supporting_text="Recurring payment authorization configuration",
                verification_status="VERIFIED",
                confidence_score=1.0
            )
        )
        page_text = f"Manual Subscription Audit: {merchant_name} ({plan_name}). Promised: {user_sub.currency} {promised_price} / {user_sub.billing_frequency}."
        mode = "MANUAL_ENTRY"

    # 3. Compute Offers & Discounts Intelligence (Promotions, Coupons, Trajectory)
    offers = compute_offers_intelligence(terms, user_sub)

    # 4. Reconcile 3-Way Plan & Price Verification (Merchant vs User vs Payment Config)
    price_ver = verify_plan_and_pricing(terms, user_sub, req.mandate_record, offers)

    # 5. Construct chronological payment timeline (Promos, Explicit/Calculated/Relative dates)
    timeline = generate_subscription_timeline(terms, req.mandate_record, user_sub, offers)
    
    # 6. Deterministic 100-Point Regulatory Rule Engine Audit
    findings, score, grade, coverage, scorecard = evaluate_disclosures(terms, url)

    # 7. Mandate Comparison (Authentic handling: VERIFIED vs SIMULATED vs UNVERIFIED)
    mandate_res = compare_mandate_with_disclosure(terms, req.mandate_record)

    # 8. Corrective recommendations
    merchant = merchant_name or terms.merchant_name.value or "Merchant"
    recs = generate_ai_recommendations(findings, merchant)
    if price_ver.suggested_correction:
        recs.insert(0, f"[RECURRING-PAYMENT-RECONCILIATION]: {price_ver.suggested_correction}")

    analysis_id = str(uuid.uuid4())
    analyzed_at = datetime.utcnow().isoformat()
    text_preview = page_text[:2000]

    # Save to SQLite database linked to current_user.id
    db_record = AnalysisModel(
        id=analysis_id,
        user_id=current_user.id,
        merchant_name=merchant,
        source_url=url,
        analyzed_at=datetime.utcnow(),
        transparency_score=score,
        transparency_grade=grade,
        verification_coverage_pct=coverage,
        extracted_terms_json=terms.model_dump_json(),
        timeline_json=json.dumps([t.model_dump() for t in timeline]),
        findings_json=json.dumps([f.model_dump() for f in findings]),
        mandate_verification_json=mandate_res.model_dump_json(),
        ai_recommendations_json=json.dumps(recs),
        raw_text_preview=text_preview,
        extraction_mode=mode,
        user_subscription_json=user_sub.model_dump_json(),
        price_comparison_json=price_ver.model_dump_json(),
        offer_intelligence_json=offers.model_dump_json(),
        scorecard_json=scorecard.model_dump_json()
    )
    db.add(db_record)
    db.commit()

    return AnalysisResponse(
        id=analysis_id,
        user_id=current_user.id,
        merchant_name=merchant,
        source_url=url,
        analyzed_at=analyzed_at,
        transparency_score=score,
        transparency_grade=grade,
        verification_coverage_pct=coverage,
        extracted_terms=terms,
        timeline=timeline,
        findings=findings,
        mandate_verification=mandate_res,
        ai_recommendations=recs,
        raw_text_preview=text_preview,
        extraction_mode=mode,
        user_subscription=req.user_subscription,
        price_verification=price_ver,
        offer_intelligence=offers,
        scorecard=scorecard
    )

@app.get("/api/v1/analyses", response_model=List[AnalysisSummary])
def list_analyses(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists past real analyses isolated to the authenticated user."""
    # Retrieve user's records or unclaimed legacy records
    records = db.query(AnalysisModel).filter(
        (AnalysisModel.user_id == current_user.id) | (AnalysisModel.user_id == None)
    ).order_by(AnalysisModel.analyzed_at.desc()).limit(30).all()

    summaries = []
    for r in records:
        findings = json.loads(r.findings_json) if r.findings_json else []
        timeline = json.loads(r.timeline_json) if r.timeline_json else []
        mandate = json.loads(r.mandate_verification_json) if r.mandate_verification_json else {}
        summaries.append(AnalysisSummary(
            id=r.id,
            merchant_name=r.merchant_name or "Merchant",
            source_url=r.source_url or "",
            analyzed_at=r.analyzed_at.isoformat() if r.analyzed_at else "",
            transparency_score=r.transparency_score or 0,
            transparency_grade=r.transparency_grade or "C",
            findings_count=len(findings),
            timeline_event_count=len(timeline),
            has_mandate=mandate.get("mandate_provided", False)
        ))
    return summaries

@app.get("/api/v1/analyses/{analysis_id}", response_model=AnalysisResponse)
def get_analysis_by_id(
    analysis_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves a complete stored analysis report belonging to the user."""
    record = db.query(AnalysisModel).filter(AnalysisModel.id == analysis_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis record not found.")

    # User isolation check
    if record.user_id and record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to view this analysis.")

    terms_dict = json.loads(record.extracted_terms_json)
    findings_list = json.loads(record.findings_json)
    mandate_dict = json.loads(record.mandate_verification_json)
    recs_list = json.loads(record.ai_recommendations_json)
    timeline_list = json.loads(record.timeline_json) if record.timeline_json else []

    # Deserializations
    extracted_terms = ExtractedTerms(**terms_dict)
    mandate_ver = MandateVerificationResult(**mandate_dict)

    # User subscription inputs
    user_sub = None
    if getattr(record, "user_subscription_json", None) and record.user_subscription_json != "{}":
        try:
            user_sub = UserSubscriptionInput(**json.loads(record.user_subscription_json))
        except Exception:
            user_sub = None

    # Offers intelligence
    offers = None
    if getattr(record, "offer_intelligence_json", None) and record.offer_intelligence_json != "{}":
        try:
            offers = OfferIntelligenceResult(**json.loads(record.offer_intelligence_json))
        except Exception:
            offers = None
    if not offers:
        offers = compute_offers_intelligence(extracted_terms, user_sub)

    # Price verification
    price_ver = None
    if getattr(record, "price_comparison_json", None) and record.price_comparison_json != "{}":
        try:
            price_ver = PriceVerificationResult(**json.loads(record.price_comparison_json))
        except Exception:
            price_ver = None
    if not price_ver:
        price_ver = verify_plan_and_pricing(extracted_terms, user_sub, offers)

    # Scorecard
    scorecard = None
    if getattr(record, "scorecard_json", None) and record.scorecard_json != "{}":
        try:
            scorecard = TransparencyScorecard(**json.loads(record.scorecard_json))
        except Exception:
            scorecard = None
    if not scorecard:
        _, _, _, _, scorecard = evaluate_disclosures(extracted_terms, record.source_url or "")

    # Timeline
    if not timeline_list:
        timeline = generate_subscription_timeline(extracted_terms, mandate_ver.mandate_record, user_sub, offers)
    else:
        timeline = [TimelineEvent(**t) for t in timeline_list]

    return AnalysisResponse(
        id=record.id,
        user_id=record.user_id,
        merchant_name=record.merchant_name,
        source_url=record.source_url,
        analyzed_at=record.analyzed_at.isoformat() if record.analyzed_at else "",
        transparency_score=record.transparency_score,
        transparency_grade=record.transparency_grade,
        verification_coverage_pct=record.verification_coverage_pct,
        extracted_terms=extracted_terms,
        timeline=timeline,
        findings=[AuditFinding(**f) for f in findings_list],
        mandate_verification=mandate_ver,
        ai_recommendations=recs_list,
        raw_text_preview=record.raw_text_preview,
        extraction_mode=record.extraction_mode,
        user_subscription=user_sub,
        price_verification=price_ver,
        offer_intelligence=offers,
        scorecard=scorecard
    )

class PlanVerificationRequest(BaseModel):
    analysis_id: str
    user_subscription: UserSubscriptionInput

@app.post("/api/v1/plans/verify", response_model=AnalysisResponse)
def verify_user_plan_endpoint(
    req: PlanVerificationRequest,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Plan Checker Endpoint:
    Allows user to update their plan parameters, actual charge, promo codes, or dates.
    Deterministically recalculates price comparison, offers trajectory, and payment timeline.
    """
    record = db.query(AnalysisModel).filter(AnalysisModel.id == req.analysis_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis record not found.")

    if record.user_id and record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to modify this analysis.")

    terms_dict = json.loads(record.extracted_terms_json)
    extracted_terms = ExtractedTerms(**terms_dict)
    mandate_dict = json.loads(record.mandate_verification_json)
    mandate_ver = MandateVerificationResult(**mandate_dict)

    # 1. Compute Offers & Trajectory
    offers = compute_offers_intelligence(extracted_terms, req.user_subscription)

    # 2. Side-by-side reconciliation
    price_ver = verify_plan_and_pricing(
        extracted_terms,
        req.user_subscription,
        mandate=mandate_ver.mandate_record,
        offers=offers
    )

    # 3. Regenerate timeline incorporating dates & promotional price transitions
    timeline = generate_subscription_timeline(
        extracted_terms,
        mandate_ver.mandate_record,
        req.user_subscription,
        offers
    )

    # 4. Deterministic scorecard
    findings, score, grade, coverage, scorecard = evaluate_disclosures(extracted_terms, record.source_url or "")

    # Persist updated calculation
    record.user_subscription_json = req.user_subscription.model_dump_json()
    record.price_comparison_json = price_ver.model_dump_json()
    record.offer_intelligence_json = offers.model_dump_json()
    record.timeline_json = json.dumps([t.model_dump() for t in timeline])
    record.scorecard_json = scorecard.model_dump_json()
    db.commit()

    return AnalysisResponse(
        id=record.id,
        user_id=record.user_id,
        merchant_name=record.merchant_name,
        source_url=record.source_url,
        analyzed_at=record.analyzed_at.isoformat() if record.analyzed_at else "",
        transparency_score=score,
        transparency_grade=grade,
        verification_coverage_pct=coverage,
        extracted_terms=extracted_terms,
        timeline=timeline,
        findings=findings,
        mandate_verification=mandate_ver,
        ai_recommendations=json.loads(record.ai_recommendations_json) if record.ai_recommendations_json else [],
        raw_text_preview=record.raw_text_preview,
        extraction_mode=record.extraction_mode,
        user_subscription=req.user_subscription,
        price_verification=price_ver,
        offer_intelligence=offers,
        scorecard=scorecard
    )

@app.post("/api/v1/assistant/chat", response_model=ChatResponse)
def assistant_chat_endpoint(
    req: ChatRequest,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Interactive Subscription Intelligence Assistant:
    Answers natural-language user queries grounded in verified audit disclosures,
    pricing discrepancies, payment timeline, and official NPCI/RBI frameworks.
    """
    analysis_resp = get_analysis_by_id(req.analysis_id, current_user, db)
    
    # Run assistant with provider abstraction
    chat_response = handle_assistant_query(
        analysis=analysis_resp,
        message=req.message,
        history=req.history
    )

    # Record conversation history in database
    record = db.query(AnalysisModel).filter(AnalysisModel.id == req.analysis_id).first()
    if record:
        existing_history = json.loads(record.chat_history_json) if getattr(record, "chat_history_json", None) else []
        existing_history.append({"role": "user", "content": req.message, "timestamp": datetime.utcnow().isoformat()})
        existing_history.append({
            "role": "assistant",
            "content": chat_response.reply,
            "citations": chat_response.regulatory_citations,
            "timestamp": datetime.utcnow().isoformat()
        })
        record.chat_history_json = json.dumps(existing_history)
        db.commit()

    return chat_response

@app.delete("/api/v1/analyses/{analysis_id}")
def delete_analysis(
    analysis_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes an analysis record belonging to the user."""
    record = db.query(AnalysisModel).filter(AnalysisModel.id == analysis_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis record not found.")

    if record.user_id and record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to delete this analysis.")

    db.delete(record)
    db.commit()
    return {"message": "Analysis record deleted successfully.", "id": analysis_id}

@app.get("/api/v1/analyses/{analysis_id}/pdf")
def download_analysis_pdf(
    analysis_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generates and serves a publication-grade branded PDF audit report."""
    analysis_resp = get_analysis_by_id(analysis_id, current_user, db)
    pdf_bytes = generate_pdf_report(analysis_resp)
    
    clean_merchant = "".join(c for c in analysis_resp.merchant_name if c.isalnum() or c in (' ', '_')).rstrip()
    filename = f"SpashtMandate_Report_{clean_merchant.replace(' ', '_')}_{analysis_id[:8]}.pdf"
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )

@app.post("/api/v1/mandate/compare-record")
def compare_record_endpoint(
    req: AnalyzeRequest,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Compares an authorized UPI AutoPay mandate record payload against disclosed terms."""
    return {"message": "Use /api/v1/analyze with mandate_record payload"}
