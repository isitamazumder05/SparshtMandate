from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

# ==========================================
# User & Authentication Schemas
# ==========================================
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = ""

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = ""
    created_at: str

class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ==========================================
# Evidence & Extraction Schemas
# ==========================================
class FieldEvidence(BaseModel):
    value: Any = None
    supporting_text: Optional[str] = None
    source_url: str = ""
    capture_timestamp: str = ""
    confidence_score: float = 0.0 # 0.0 to 1.0
    verification_status: str = "UNVERIFIED" # VERIFIED | AMBIGUOUS | MISSING | NOT_APPLICABLE | UNVERIFIED

class ExtractedTerms(BaseModel):
    merchant_name: FieldEvidence = Field(default_factory=FieldEvidence)
    subscription_amount: FieldEvidence = Field(default_factory=FieldEvidence)
    currency: FieldEvidence = Field(default_factory=FieldEvidence)
    billing_frequency: FieldEvidence = Field(default_factory=FieldEvidence)
    free_trial_available: FieldEvidence = Field(default_factory=FieldEvidence)
    trial_duration_days: FieldEvidence = Field(default_factory=FieldEvidence)
    renewal_amount: FieldEvidence = Field(default_factory=FieldEvidence)
    renewal_frequency: FieldEvidence = Field(default_factory=FieldEvidence)
    first_charge_timing: FieldEvidence = Field(default_factory=FieldEvidence)
    cancellation_policy: FieldEvidence = Field(default_factory=FieldEvidence)
    refund_policy: FieldEvidence = Field(default_factory=FieldEvidence)
    pre_debit_notification: FieldEvidence = Field(default_factory=FieldEvidence)
    payment_method: FieldEvidence = Field(default_factory=FieldEvidence)
    other_recurring_disclosures: List[str] = Field(default_factory=list)


# ==========================================
# Timeline Event Schema (Core Feature)
# ==========================================
class TimelineEvent(BaseModel):
    event_id: str # e.g. 'EVENT-01-ACTIVATION'
    step_number: int # 1, 2, 3...
    phase_name: str # 'Subscription Activation', 'Free Trial', 'Trial Expiry' etc.
    timing_type: str # 'EXPLICIT_DATE' | 'CALCULATED_DATE' | 'RELATIVE_TIMING' | 'UNKNOWN'
    date_display: str # e.g. 'Day 0 (Sign-up)', '7 days after activation'
    amount_display: Optional[str] = None # e.g. '₹0.00 (Free)', '₹119.00 / month'
    description: str
    evidence_quote: Optional[str] = None
    badge_status: str # 'CONFIRMED' | 'CALCULATED' | 'ALERT' | 'INFO'


# ==========================================
# Regulatory Rule Finding Schema
# ==========================================
class AuditFinding(BaseModel):
    id: str
    rule_id: str
    title: str
    status: str # PASS | REVIEW | MISSING | NOT_APPLICABLE | UNVERIFIED
    severity: str # HIGH | MEDIUM | LOW | INFO
    explanation: str
    evidence_snippet: Optional[str] = None
    source_url: str = ""
    applicable_reference_id: Optional[str] = None
    applicable_reference_title: Optional[str] = None
    applicable_authority: Optional[str] = None
    customer_impact: str = ""
    suggested_corrective_disclosure: Optional[str] = None


# ==========================================
# Mandate Comparison Schemas
# ==========================================
class MandateRecordInput(BaseModel):
    merchant_name: Optional[str] = None
    mandate_amount: Optional[str] = None
    frequency: Optional[str] = None # 'Monthly' | 'Weekly' | 'As & when presented'
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    mandate_validity: Optional[str] = None
    umin: Optional[str] = None # Unique Mandate Identifier Number
    transaction_reference: Optional[str] = None
    is_simulated: bool = False # Flag indicating whether mandate is test simulation or genuine authorized record

class MandateComparisonItem(BaseModel):
    parameter: str
    disclosed_value: Optional[str] = None
    actual_mandate_value: Optional[str] = None
    status: str # MATCH | MISMATCH | REVIEW | NOT_VERIFIED
    notes: str

class MandateVerificationResult(BaseModel):
    mandate_provided: bool = False
    verification_status: str = "UNVERIFIED" # VERIFIED | SIMULATED | UNVERIFIED
    status_summary: str = "Actual UPI AutoPay mandate configuration has not been provided. Mandate verification is currently unavailable."
    mandate_record: Optional[MandateRecordInput] = None
    comparison_items: List[MandateComparisonItem] = Field(default_factory=list)
    risk_indicator: str = "UNVERIFIED" # SAFE | WARNING | DANGER | UNVERIFIED


# ==========================================
# User Subscription Input (Plan Checker & Mandate Verifier)
# ==========================================
class UserSubscriptionInput(BaseModel):
    merchant_name: Optional[str] = None
    source_url: Optional[str] = None
    plan_name: Optional[str] = None
    user_promised_price: Optional[float] = None # What user was promised / selected
    standard_listed_price: Optional[float] = None
    advertised_regular_price: Optional[float] = None # What merchant advertises
    actual_charged_price: Optional[float] = None
    is_already_charged: bool = False # False = Not yet charged / evaluating subscription
    currency: str = "INR"
    billing_frequency: str = "Monthly" # Monthly, Quarterly, Semi-Annual, Annual, Weekly, Daily, One-Time
    subscription_tier: Optional[str] = None
    free_trial_days: Optional[int] = None
    introductory_price: Optional[float] = None
    introductory_duration_months: Optional[int] = None
    promotional_discount_pct: Optional[float] = None
    promotional_discount_amount: Optional[float] = None
    coupon_code: Optional[str] = None
    coupon_discount_amount: Optional[float] = None
    coupon_discount_pct: Optional[float] = None
    customer_type: Optional[str] = "NEW_CUSTOMER" # "NEW_CUSTOMER" | "EXISTING_CUSTOMER" | "UNKNOWN"
    promotional_eligibility: Optional[str] = "UNCLEAR" # "ELIGIBLE" | "INELIGIBLE" | "UNCLEAR"
    expected_renewal_price: Optional[float] = None
    configured_mandate_amount: Optional[float] = None
    activation_date: Optional[str] = None # YYYY-MM-DD
    payment_date: Optional[str] = None # YYYY-MM-DD
    invoice_notes: Optional[str] = None
    input_mode: str = "MANUAL" # "URL_ASSISTED" | "MANUAL"


# ==========================================
# Offers & Discounts Schemas
# ==========================================
class OfferStage(BaseModel):
    stage_name: str # e.g. "Free Trial", "Introductory Offer", "Standard Renewal"
    duration_display: str # e.g. "7 Days", "First 3 Months", "Ongoing"
    price_display: str # e.g. "₹0.00", "₹499.50 / month", "₹999.00 / month"
    unit_price: Optional[float] = None
    currency: str = "INR"
    billing_frequency: str = "Monthly"
    is_recurring: bool = True
    notes: str = ""

class OfferIntelligenceResult(BaseModel):
    standard_price: Optional[float] = None
    introductory_price: Optional[float] = None
    introductory_duration_months: Optional[int] = None
    coupon_code: Optional[str] = None
    coupon_discount: Optional[float] = None
    expected_intro_price: Optional[float] = None
    expected_renewal_price: Optional[float] = None
    stages: List[OfferStage] = Field(default_factory=list)
    eligibility_status: str = "UNCLEAR" # "ELIGIBLE" | "INELIGIBLE" | "UNCLEAR" | "NOT_APPLICABLE"
    eligibility_notes: str = ""
    comparison_outcome: str = "INSUFFICIENT_EVIDENCE" # EXACT_MATCH | MATCH_AFTER_PROMO | MATCH_AFTER_COUPON | HIGHER_THAN_EXPECTED | LOWER_THAN_EXPECTED | FREQUENCY_MISMATCH | ELIGIBILITY_UNCLEAR | INSUFFICIENT_EVIDENCE
    comparison_notes: str = ""
    discrepancy_amount: Optional[float] = None


# ==========================================
# Price and Plan Verification Schemas (3-Way Comparison)
# ==========================================
class PriceComparisonItem(BaseModel):
    parameter: str # e.g. "Price", "Billing Frequency", "First Payment", "Renewal Amount", "Promotional Duration", "Coupon Deduction", "Recurring Debit Cap"
    merchant_disclosure: Optional[str] = None # Source A: What merchant advertises
    user_expectation: Optional[str] = None    # Source B: What user selected / was promised
    payment_configuration: Optional[str] = None # Source C: What recurring mandate is set to charge
    merchant_disclosed: Optional[str] = None # Alias for backward compatibility
    user_entered_or_actual: Optional[str] = None # Alias for backward compatibility
    difference: Optional[str] = None
    status: str = "NOT_SPECIFIED" # EXACT MATCH | MATCH AFTER PROMOTION | MATCH AFTER COUPON | HIGHER THAN EXPECTED | LOWER THAN EXPECTED | FREQUENCY MISMATCH | PLAN MISMATCH | ELIGIBILITY UNCLEAR | INSUFFICIENT DATA
    severity: str = "INFO" # INFO | MEDIUM | HIGH
    explanation: str = ""

class PriceVerificationResult(BaseModel):
    overall_status: str = "INSUFFICIENT_DATA" # "EXACT MATCH" | "MATCH AFTER PROMOTION" | "MATCH AFTER COUPON" | "HIGHER THAN EXPECTED" | "LOWER THAN EXPECTED" | "FREQUENCY MISMATCH" | "PLAN MISMATCH" | "ELIGIBILITY UNCLEAR" | "INSUFFICIENT DATA"
    summary: str = ""
    comparison_items: List[PriceComparisonItem] = Field(default_factory=list)
    total_expected_first_cycle: Optional[float] = None
    actual_charged_amount: Optional[float] = None
    variance_amount: Optional[float] = None
    discrepancy_reasons: List[str] = Field(default_factory=list)
    recurring_mismatch_amount: Optional[float] = None # Specific for recurring amount differences (e.g. ₹200)
    customer_impact: Optional[str] = None
    suggested_correction: Optional[str] = None


# ==========================================
# Explainable Weighted Transparency Scoring (100 pts)
# ==========================================
class ScoreCategory(BaseModel):
    category_id: str # "RULE-01-PRICE", "RULE-02-FREQUENCY", etc.
    title: str # e.g. "Price Clarity"
    max_points: int # 20, 15, 15, 15, 15, 10, 5, 5
    points_earned: int
    points_deducted: int = 0
    criterion_applicability: str = "APPLICABLE" # "APPLICABLE" | "NOT_APPLICABLE" | "NOT_VERIFIABLE" | "NOT_ASSESSED" | "PAYMENT_SYSTEM_SAFEGUARD"
    assessment_area: str = "MERCHANT_DISCLOSURE" # "MERCHANT_DISCLOSURE" | "PAYMENT_SYSTEM_SAFEGUARD" | "MANDATE_VERIFICATION"
    status: str # "PASS" | "PARTIAL" | "REVIEW" | "MISSING" | "NOT_APPLICABLE" | "NOT_VERIFIABLE" | "NOT_ASSESSED"
    reason_for_deduction: Optional[str] = None
    evidence_used: Optional[str] = None
    confidence_status: str = "UNVERIFIED" # "VERIFIED" | "AMBIGUOUS" | "MISSING" | "NOT_VERIFIABLE" | "NOT_ASSESSED"
    suggested_corrective_disclosure: Optional[str] = None
    customer_impact: str = ""
    regulatory_reference_id: Optional[str] = None
    regulatory_authority: Optional[str] = None

class TransparencyScorecard(BaseModel):
    total_score: int = 0 # 0 to 100
    max_possible_score: int = 100
    grade: str = "C" # "A+", "A", "B", "C", "D"
    summary: str = ""
    categories: List[ScoreCategory] = Field(default_factory=list)


# ==========================================
# AI Assistant Schemas
# ==========================================
class ChatMessage(BaseModel):
    id: str
    sender: str # "user" | "assistant"
    text: str
    timestamp: str
    evidence_citations: List[str] = Field(default_factory=list)
    regulatory_citations: List[str] = Field(default_factory=list)

class ChatRequest(BaseModel):
    analysis_id: str
    message: str
    history: List[Dict[str, Any]] = Field(default_factory=list)

class ChatResponse(BaseModel):
    reply: str
    evidence_citations: List[str] = Field(default_factory=list)
    regulatory_citations: List[str] = Field(default_factory=list)
    suggested_next_questions: List[str] = Field(default_factory=list)


# ==========================================
# Main API Request & Response Schemas
# ==========================================
class AnalyzeRequest(BaseModel):
    url: Optional[str] = None
    input_mode: str = "MANUAL" # "URL_ASSISTED" | "MANUAL"
    user_subscription: Optional[UserSubscriptionInput] = None
    mandate_record: Optional[MandateRecordInput] = None
    force_refresh: bool = False

class AnalysisResponse(BaseModel):
    id: str
    merchant_name: str
    source_url: str
    analyzed_at: str
    transparency_score: int # 0 to 100
    transparency_grade: str # A+, A, B, C, D
    verification_coverage_pct: int
    extracted_terms: ExtractedTerms
    timeline: List[TimelineEvent] = Field(default_factory=list)
    findings: List[AuditFinding]
    mandate_verification: MandateVerificationResult
    ai_recommendations: List[str]
    raw_text_preview: Optional[str] = None
    extraction_mode: str = "HEURISTIC_PARSER" # "AI_LLM" | "HEURISTIC_PARSER"
    user_id: Optional[str] = None

    # New Product Extensions
    user_subscription: Optional[UserSubscriptionInput] = None
    price_verification: Optional[PriceVerificationResult] = None
    offer_intelligence: Optional[OfferIntelligenceResult] = None
    scorecard: Optional[TransparencyScorecard] = None

class AnalysisSummary(BaseModel):
    id: str
    merchant_name: str
    source_url: str
    analyzed_at: str
    transparency_score: int
    transparency_grade: str
    findings_count: int
    timeline_event_count: int = 0
    has_mandate: bool
