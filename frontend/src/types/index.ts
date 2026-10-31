export interface FieldEvidence {
  value: any;
  supporting_text: string | null;
  source_url: string;
  capture_timestamp: string;
  confidence_score: number;
  verification_status:
    | 'VERIFIED'
    | 'AMBIGUOUS'
    | 'MISSING'
    | 'NOT_APPLICABLE'
    | 'UNVERIFIED'
    | 'MISSING_FROM_STATIC_HTML'
    | 'MISSING_FROM_RENDERED_PAGE'
    | 'NOT_DISCLOSED_IN_INSPECTED_EVIDENCE'
    | 'NOT_VERIFIABLE';
}

export interface ExtractedTerms {
  merchant_name: FieldEvidence;
  subscription_amount: FieldEvidence;
  currency: FieldEvidence;
  billing_frequency: FieldEvidence;
  free_trial_available: FieldEvidence;
  trial_duration_days: FieldEvidence;
  renewal_amount: FieldEvidence;
  renewal_frequency: FieldEvidence;
  first_charge_timing: FieldEvidence;
  cancellation_policy: FieldEvidence;
  refund_policy: FieldEvidence;
  pre_debit_notification?: FieldEvidence;
  payment_method?: FieldEvidence;
  other_recurring_disclosures: string[];
}

export interface TimelineEvent {
  event_id: string;
  step_number: number;
  phase_name: string;
  timing_type: 'EXPLICIT_DATE' | 'CALCULATED_DATE' | 'RELATIVE_TIMING' | 'UNKNOWN';
  date_display: string;
  amount_display?: string | null;
  description: string;
  evidence_quote?: string | null;
  badge_status: 'CONFIRMED' | 'CALCULATED' | 'ALERT' | 'INFO';
}

export interface AuditFinding {
  id: string;
  rule_id: string;
  title: string;
  status: 'PASS' | 'REVIEW' | 'MISSING' | 'NOT_APPLICABLE' | 'UNVERIFIED';
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  explanation: string;
  evidence_snippet: string | null;
  source_url: string;
  applicable_reference_id?: string | null;
  applicable_reference_title?: string | null;
  applicable_authority?: string | null;
  customer_impact: string;
  suggested_corrective_disclosure?: string | null;
}

export interface MandateRecordInput {
  merchant_name?: string;
  mandate_amount?: string;
  frequency?: string;
  start_date?: string;
  end_date?: string;
  mandate_validity?: string;
  umin?: string;
  transaction_reference?: string;
  is_simulated?: boolean;
}

export interface MandateComparisonItem {
  parameter: string;
  disclosed_value: string | null;
  actual_mandate_value: string | null;
  status: 'MATCH' | 'MISMATCH' | 'REVIEW' | 'NOT_VERIFIED';
  notes: string;
}

export interface MandateVerificationResult {
  mandate_provided: boolean;
  verification_status: 'VERIFIED' | 'SIMULATED' | 'UNVERIFIED';
  status_summary: string;
  mandate_record: MandateRecordInput | null;
  comparison_items: MandateComparisonItem[];
  risk_indicator: 'SAFE' | 'WARNING' | 'DANGER' | 'UNVERIFIED';
}

export interface UserSubscriptionInput {
  merchant_name?: string;
  source_url?: string;
  plan_name?: string;
  user_promised_price?: number;
  standard_listed_price?: number;
  advertised_regular_price?: number;
  actual_charged_price?: number;
  is_already_charged?: boolean;
  currency?: string;
  billing_frequency?: string;
  subscription_tier?: string;
  free_trial_days?: number;
  introductory_price?: number;
  introductory_duration_months?: number;
  promotional_discount_pct?: number;
  promotional_discount_amount?: number;
  coupon_code?: string;
  coupon_discount_amount?: number;
  coupon_discount_pct?: number;
  customer_type?: 'NEW_CUSTOMER' | 'EXISTING_CUSTOMER' | 'UNKNOWN';
  promotional_eligibility?: 'ELIGIBLE' | 'INELIGIBLE' | 'UNCLEAR';
  expected_renewal_price?: number;
  configured_mandate_amount?: number;
  activation_date?: string;
  payment_date?: string;
  invoice_notes?: string;
  input_mode?: 'URL_ASSISTED' | 'MANUAL';
}

export interface OfferStage {
  stage_name: string;
  duration_display: string;
  price_display: string;
  unit_price?: number | null;
  currency: string;
  billing_frequency: string;
  is_recurring: boolean;
  notes: string;
}

export interface OfferIntelligenceResult {
  standard_price?: number | null;
  introductory_price?: number | null;
  introductory_duration_months?: number | null;
  coupon_code?: string | null;
  coupon_discount?: number | null;
  expected_intro_price?: number | null;
  expected_renewal_price?: number | null;
  stages: OfferStage[];
  eligibility_status: 'ELIGIBLE' | 'INELIGIBLE' | 'UNCLEAR' | 'NOT_APPLICABLE';
  eligibility_notes: string;
  comparison_outcome:
    | 'EXACT_MATCH'
    | 'MATCH_AFTER_PROMO'
    | 'MATCH_AFTER_COUPON'
    | 'HIGHER_THAN_EXPECTED'
    | 'LOWER_THAN_EXPECTED'
    | 'FREQUENCY_MISMATCH'
    | 'ELIGIBILITY_UNCLEAR'
    | 'INSUFFICIENT_EVIDENCE';
  comparison_notes: string;
  discrepancy_amount?: number | null;
}

export interface PriceComparisonItem {
  parameter: string;
  merchant_disclosure?: string | null;
  user_expectation?: string | null;
  payment_configuration?: string | null;
  merchant_disclosed?: string | null;
  user_entered_or_actual?: string | null;
  difference?: string | null;
  status:
    | 'EXACT MATCH'
    | 'MATCH AFTER PROMOTION'
    | 'MATCH AFTER COUPON'
    | 'HIGHER THAN EXPECTED'
    | 'LOWER THAN EXPECTED'
    | 'FREQUENCY MISMATCH'
    | 'PLAN MISMATCH'
    | 'ELIGIBILITY UNCLEAR'
    | 'INSUFFICIENT DATA'
    | 'MATCH'
    | 'DISCREPANCY'
    | 'REVIEW'
    | 'NOT_SPECIFIED';
  severity?: 'INFO' | 'MEDIUM' | 'HIGH';
  explanation: string;
}

export interface PriceVerificationResult {
  overall_status:
    | 'EXACT MATCH'
    | 'MERCHANT_USER_MATCH'
    | 'MATCH AFTER PROMOTION'
    | 'MATCH AFTER COUPON'
    | 'HIGHER THAN EXPECTED'
    | 'LOWER THAN EXPECTED'
    | 'FREQUENCY MISMATCH'
    | 'PLAN MISMATCH'
    | 'ELIGIBILITY UNCLEAR'
    | 'INSUFFICIENT DATA'
    | 'MATCH'
    | 'DISCREPANCY'
    | 'NEEDS_REVIEW';
  summary: string;
  comparison_items: PriceComparisonItem[];
  total_expected_first_cycle?: number | null;
  actual_charged_amount?: number | null;
  variance_amount?: number | null;
  discrepancy_reasons: string[];
  recurring_mismatch_amount?: number | null;
  customer_impact?: string | null;
  suggested_correction?: string | null;
}

export interface ScoreCategory {
  category_id: string;
  title: string;
  max_points: number;
  points_earned: number;
  points_deducted?: number;
  criterion_applicability?: 'APPLICABLE' | 'NOT_APPLICABLE' | 'NOT_VERIFIABLE' | 'NOT_ASSESSED' | 'PAYMENT_SYSTEM_SAFEGUARD';
  assessment_area?: 'MERCHANT_DISCLOSURE' | 'PAYMENT_SYSTEM_SAFEGUARD' | 'MANDATE_VERIFICATION';
  status: 'PASS' | 'PARTIAL' | 'REVIEW' | 'MISSING' | 'NOT_APPLICABLE' | 'NOT_VERIFIABLE' | 'NOT_ASSESSED';
  reason_for_deduction?: string | null;
  evidence_used?: string | null;
  confidence_status: 'VERIFIED' | 'AMBIGUOUS' | 'MISSING' | 'UNVERIFIED' | 'NOT_VERIFIABLE' | 'NOT_ASSESSED';
  suggested_corrective_disclosure?: string | null;
  customer_impact: string;
  regulatory_reference_id?: string | null;
  regulatory_authority?: string | null;
}

export interface TransparencyScorecard {
  total_score: number;
  max_possible_score: number;
  grade: string;
  summary: string;
  categories: ScoreCategory[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  evidence_citations?: string[];
  regulatory_citations?: string[];
}

export interface ChatResponse {
  reply: string;
  evidence_citations: string[];
  regulatory_citations: string[];
  suggested_next_questions: string[];
}

export interface AnalysisResponse {
  id: string;
  merchant_name: string;
  source_url: string;
  analyzed_at: string;
  transparency_score: number;
  transparency_grade: string;
  verification_coverage_pct: number;
  extracted_terms: ExtractedTerms;
  timeline: TimelineEvent[];
  findings: AuditFinding[];
  mandate_verification: MandateVerificationResult;
  ai_recommendations: string[];
  raw_text_preview?: string | null;
  extraction_mode: string;
  user_id?: string | null;

  // New Subscription Intelligence Fields
  user_subscription?: UserSubscriptionInput | null;
  price_verification?: PriceVerificationResult | null;
  offer_intelligence?: OfferIntelligenceResult | null;
  scorecard?: TransparencyScorecard | null;
}

export interface AnalysisSummary {
  id: string;
  merchant_name: string;
  source_url: string;
  analyzed_at: string;
  transparency_score: number;
  transparency_grade: string;
  findings_count: number;
  timeline_event_count?: number;
  has_mandate: boolean;
}

export interface PresetItem {
  id: string;
  name: string;
  category: string;
  url: string;
  description: string;
  user_subscription?: UserSubscriptionInput;
  mandate_record?: MandateRecordInput;
}

export interface RegulatoryReference {
  id: string;
  authority: string;
  document_title: string;
  circular_ref?: string | null;
  publication_date: string;
  official_url: string;
  relevant_provision: string;
  mandate_rule_target: string;
  applicability_notes: string;
  is_mandatory: boolean;
}

export type RegulatoryReferenceItem = RegulatoryReference;

export interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
