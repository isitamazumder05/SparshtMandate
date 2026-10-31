"""
SpashtMandate AI - Deterministic 100-Point Weighted Transparency Scoring Engine
Audits extracted subscription disclosures against authentic NPCI/RBI/Paytm consumer standards.
Strict Rules:
1. Deterministic and reproducible: Score is calculated via strict Python logic, never an LLM.
2. 8 Weighted Categories summing to exactly 100 points:
   - Price Clarity: 20 pts
   - Billing Frequency: 15 pts
   - Trial & Conversion Clarity: 15 pts
   - Renewal Disclosure: 15 pts
   - Cancellation & Revocation Clarity: 15 pts
   - Pre-Debit Notification Disclosure: 10 pts
   - Refund & Recourse Clarity: 5 pts
   - Mandate Payment Disclosure: 5 pts
3. Explains every deduction with reason, evidence citation, and corrective disclosure.
4. Output is strictly separate from price matching and mandate technical verification.
"""

from typing import List, Tuple
from backend.schemas import (
    ExtractedTerms,
    AuditFinding,
    ScoreCategory,
    TransparencyScorecard
)
from backend.regulatory_kb import get_regulatory_reference

def evaluate_disclosures(terms: ExtractedTerms, source_url: str) -> Tuple[List[AuditFinding], int, str, int, TransparencyScorecard]:
    """
    Evaluates extracted subscription terms.
    Returns: (findings, transparency_score [0-100], transparency_grade, coverage_pct, scorecard)
    """
    findings: List[AuditFinding] = []
    categories: List[ScoreCategory] = []
    
    total_earned = 0
    fields_checked = 8
    fields_verified = 0

    # =========================================================================
    # CATEGORY 1: Price Clarity (Weight: 20 pts)
    # =========================================================================
    ref1 = get_regulatory_reference("NPCI-AUTOPAY-MANDATE-LIMITS")
    sub_amt = terms.subscription_amount
    curr = terms.currency.value or "₹"
    cat1_max = 20

    if sub_amt.verification_status == "VERIFIED" and sub_amt.value:
        cat1_earned = 20
        cat1_status = "PASS"
        cat1_applicability = "APPLICABLE"
        cat1_deduction = None
        cat1_corrective = None
        fields_verified += 1
        f_title = "Subscription Price Clearly Disclosed"
        f_exp = f"Explicit recurring subscription pricing of {curr} {sub_amt.value} is visibly disclosed to the consumer prior to payment authorization."
        f_sev = "INFO"
    elif sub_amt.verification_status in ("MISSING_FROM_STATIC_HTML", "NOT_VERIFIABLE", "MISSING_FROM_RENDERED_PAGE"):
        # Extraction Limitation: Dynamic DOM / Client-side rendering
        # Merchants are NOT penalized for scraper DOM limits as if it were a proven disclosure failure
        cat1_earned = 20
        cat1_status = "NOT_VERIFIABLE"
        cat1_applicability = "NOT_VERIFIABLE"
        cat1_deduction = None
        cat1_corrective = "Interactive subscription page renders pricing via client scripts. Review final checkout price in rendered DOM."
        fields_verified += 1
        f_title = "Subscription Price Not Verifiable from Static Markup"
        f_exp = "Numeric pricing is rendered dynamically or requires client interaction. Not verifiable from inspected static server HTML markup; not penalized as a proven disclosure failure."
        f_sev = "INFO"
    elif sub_amt.verification_status == "AMBIGUOUS":
        cat1_earned = 10
        cat1_status = "PARTIAL"
        cat1_applicability = "APPLICABLE"
        cat1_deduction = "A numeric value was detected, but the exact commitment amount remains contingent on undisclosed factors or tier ambiguity (-10 pts)."
        cat1_corrective = "State the exact fixed or capped recurring debit amount adjacent to the primary action button."
        f_title = "Subscription Price Disclosure Ambiguous"
        f_exp = "A numeric figure was detected, but commitment liability is unclear."
        f_sev = "MEDIUM"
    else:
        cat1_earned = 0
        cat1_status = "MISSING"
        cat1_applicability = "APPLICABLE"
        cat1_deduction = "No explicit recurring subscription price was detected on the journey page (-20 pts)."
        cat1_corrective = f"Display: 'Subscription price: {curr}X per billing cycle inclusive of all taxes.'"
        f_title = "Missing Explicit Subscription Price"
        f_exp = "No explicit numeric recurring price was found on the subscription page."
        f_sev = "HIGH"

    total_earned += cat1_earned
    categories.append(ScoreCategory(
        category_id="RULE-01-PRICE",
        title="Price Clarity",
        max_points=cat1_max,
        points_earned=cat1_earned,
        points_deducted=cat1_max - cat1_earned,
        criterion_applicability=cat1_applicability,
        assessment_area="MERCHANT_DISCLOSURE",
        status=cat1_status,
        reason_for_deduction=cat1_deduction,
        evidence_used=sub_amt.supporting_text,
        confidence_status=sub_amt.verification_status,
        suggested_corrective_disclosure=cat1_corrective,
        customer_impact="Customers can accurately budget their immediate recurring payment liability.",
        regulatory_reference_id=ref1.id if ref1 else None,
        regulatory_authority=ref1.authority if ref1 else "NPCI"
    ))
    findings.append(AuditFinding(
        id="FINDING-RULE-01",
        rule_id="RULE-01-PRICE",
        title=f_title,
        status=cat1_status if cat1_status != "PARTIAL" else "REVIEW",
        severity=f_sev,
        explanation=f_exp,
        evidence_snippet=sub_amt.supporting_text,
        source_url=source_url,
        applicable_reference_id=ref1.id if ref1 else None,
        applicable_reference_title=ref1.document_title if ref1 else None,
        applicable_authority=ref1.authority if ref1 else None,
        customer_impact="Customers risk entering into recurring payment authorization without verified liability.",
        suggested_corrective_disclosure=cat1_corrective
    ))

    # =========================================================================
    # CATEGORY 2: Billing Frequency & Cadence Clarity (Weight: 15 pts)
    # =========================================================================
    ref2 = get_regulatory_reference("PAYTM-SUBSCRIPTION-DISCLOSURE")
    freq = terms.billing_frequency
    cat2_max = 15

    if freq.verification_status == "VERIFIED" and freq.value:
        cat2_earned = 15
        cat2_status = "PASS"
        cat2_deduction = None
        cat2_corrective = None
        fields_verified += 1
        f2_title = "Billing Cadence Unambiguously Disclosed"
        f2_exp = f"Billing cadence is explicitly disclosed as '{freq.value}'."
        f2_sev = "INFO"
    elif freq.verification_status == "AMBIGUOUS":
        cat2_earned = 8
        cat2_status = "PARTIAL"
        cat2_deduction = "Billing intervals are referenced ambiguously without clear calendar cycle boundaries (-7 pts)."
        cat2_corrective = "Explicitly specify whether the charge recurs monthly (e.g. 30 days vs 1st of month) or annually."
        f2_title = "Billing Cadence Ambiguous"
        f2_exp = "The recurring cycle interval is not stated with sufficient precision."
        f2_sev = "MEDIUM"
    else:
        cat2_earned = 0
        cat2_status = "MISSING"
        cat2_deduction = "The recurring billing frequency is completely missing from the disclosure page (-15 pts)."
        cat2_corrective = "Add an explicit billing frequency descriptor: 'Billed every month / every year automatically.'"
        f2_title = "Missing Recurring Cadence Disclosure"
        f2_exp = "The customer is not informed of how frequently automated debits will occur."
        f2_sev = "HIGH"

    total_earned += cat2_earned
    categories.append(ScoreCategory(
        category_id="RULE-02-FREQUENCY",
        title="Billing Frequency",
        max_points=cat2_max,
        points_earned=cat2_earned,
        points_deducted=cat2_max - cat2_earned,
        criterion_applicability="APPLICABLE",
        assessment_area="MERCHANT_DISCLOSURE",
        status=cat2_status,
        reason_for_deduction=cat2_deduction,
        evidence_used=freq.supporting_text,
        confidence_status=freq.verification_status,
        suggested_corrective_disclosure=cat2_corrective,
        customer_impact="Customer knows precisely on what schedule recurring debits will trigger.",
        regulatory_reference_id=ref2.id if ref2 else None,
        regulatory_authority=ref2.authority if ref2 else "Paytm / RBI"
    ))
    findings.append(AuditFinding(
        id="FINDING-RULE-02",
        rule_id="RULE-02-FREQUENCY",
        title=f2_title,
        status=cat2_status if cat2_status != "PARTIAL" else "REVIEW",
        severity=f2_sev,
        explanation=f2_exp,
        evidence_snippet=freq.supporting_text,
        source_url=source_url,
        applicable_reference_id=ref2.id if ref2 else None,
        applicable_reference_title=ref2.document_title if ref2 else None,
        applicable_authority=ref2.authority if ref2 else None,
        customer_impact="Unclear cadence leads to unexpected overdrafts or mandate trigger timing surprises.",
        suggested_corrective_disclosure=cat2_corrective
    ))

    # =========================================================================
    # CATEGORY 3: Free Trial & Auto-Conversion Terms (Weight: 15 pts)
    # =========================================================================
    ref3 = get_regulatory_reference("ASCI-DARK-PATTERNS-2023")
    trial_avail = terms.free_trial_available
    trial_days = terms.trial_duration_days
    has_trial = trial_avail.value is True or (isinstance(trial_days.value, (int, float)) and trial_days.value > 0)
    cat3_max = 15

    if not has_trial and trial_avail.verification_status != "MISSING":
        # Straightforward direct paid subscription: Full points granted (no hidden trial bait)
        cat3_earned = 15
        cat3_status = "PASS"
        cat3_deduction = None
        cat3_corrective = None
        fields_verified += 1
        f3_title = "Direct Paid Subscription (No Trial Traps)"
        f3_exp = "No introductory trial gimmicks detected; user is enrolled directly into standard disclosed terms."
        f3_sev = "INFO"
    elif has_trial:
        if trial_days.verification_status == "VERIFIED" and trial_days.value:
            cat3_earned = 15
            cat3_status = "PASS"
            cat3_deduction = None
            cat3_corrective = None
            fields_verified += 1
            f3_title = "Trial Window & Conversion Fully Disclosed"
            f3_exp = f"Free trial duration of {trial_days.value} days and post-trial conversion rules are explicitly disclosed."
            f3_sev = "INFO"
        elif trial_days.verification_status == "AMBIGUOUS":
            cat3_earned = 8
            cat3_status = "PARTIAL"
            cat3_deduction = "Trial is advertised, but exact trial duration in calendar days is ambiguous (-7 pts)."
            cat3_corrective = "Disclose the exact duration in days: 'Try free for 7/14/30 days, then ₹X/mo automatically.'"
            f3_title = "Trial Duration Ambiguous"
            f3_exp = "A trial is promised, but exact duration in days is not specified."
            f3_sev = "MEDIUM"
        else:
            cat3_earned = 0
            cat3_status = "MISSING"
            cat3_deduction = "Free trial advertised without explicit duration or post-trial conversion rules (-15 pts)."
            cat3_corrective = "Prominently state the post-trial conversion date and exact recurring charge before signup."
            f3_title = "Unspecified Trial Conversion Terms"
            f3_exp = "Trial conversion conditions fail ASCI Guidelines on Dark Patterns (Subscription Traps)."
            f3_sev = "HIGH"
    else:
        cat3_earned = 15
        cat3_status = "PASS"
        cat3_deduction = None
        cat3_corrective = None
        fields_verified += 1
        f3_title = "No Trial Conversion Exposure"
        f3_exp = "No deceptive free-to-paid conversion mechanics found."
        f3_sev = "INFO"

    total_earned += cat3_earned
    categories.append(ScoreCategory(
        category_id="RULE-03-TRIAL-CONVERSION",
        title="Trial & Conversion Clarity",
        max_points=cat3_max,
        points_earned=cat3_earned,
        points_deducted=cat3_max - cat3_earned,
        criterion_applicability="APPLICABLE" if has_trial else "NOT_APPLICABLE",
        assessment_area="MERCHANT_DISCLOSURE",
        status=cat3_status,
        reason_for_deduction=cat3_deduction,
        evidence_used=trial_days.supporting_text or trial_avail.supporting_text,
        confidence_status=trial_days.verification_status if has_trial else "VERIFIED",
        suggested_corrective_disclosure=cat3_corrective,
        customer_impact="Prevents involuntary post-trial billing conversion surprises (Dark Pattern compliance).",
        regulatory_reference_id=ref3.id if ref3 else None,
        regulatory_authority=ref3.authority if ref3 else "ASCI / CCPA"
    ))
    findings.append(AuditFinding(
        id="FINDING-RULE-03",
        rule_id="RULE-03-TRIAL-CONVERSION",
        title=f3_title,
        status=cat3_status if cat3_status != "PARTIAL" else "REVIEW",
        severity=f3_sev,
        explanation=f3_exp,
        evidence_snippet=trial_days.supporting_text or trial_avail.supporting_text,
        source_url=source_url,
        applicable_reference_id=ref3.id if ref3 else None,
        applicable_reference_title=ref3.document_title if ref3 else None,
        applicable_authority=ref3.authority if ref3 else None,
        customer_impact="Subscription traps lead to unexpected charges after initial free access.",
        suggested_corrective_disclosure=cat3_corrective
    ))

    # =========================================================================
    # CATEGORY 4: Renewal Disclosure & Ongoing Rates (Weight: 15 pts)
    # =========================================================================
    ref4 = get_regulatory_reference("RBI-EMANDATE-RECURRING-2019")
    ren_amt = terms.renewal_amount
    cat4_max = 15

    if ren_amt.verification_status == "VERIFIED" and ren_amt.value:
        cat4_earned = 15
        cat4_status = "PASS"
        cat4_deduction = None
        cat4_corrective = None
        fields_verified += 1
        f4_title = "Renewal Pricing Explicitly Disclosed"
        f4_exp = f"Subsequent regular renewal price of {curr} {ren_amt.value} is explicitly stated."
        f4_sev = "INFO"
    elif ren_amt.verification_status == "AMBIGUOUS":
        cat4_earned = 8
        cat4_status = "PARTIAL"
        cat4_deduction = "Ongoing renewal rate is referenced but exact subsequent price is ambiguous (-7 pts)."
        cat4_corrective = "Clarify subsequent billing price: 'Renews at standard price of ₹X per billing cycle.'"
        f4_title = "Renewal Pricing Ambiguous"
        f4_exp = "The customer is not given guaranteed transparency on subsequent billing amounts."
        f4_sev = "MEDIUM"
    else:
        cat4_earned = 0
        cat4_status = "MISSING"
        cat4_deduction = "Merchant does not disclose the post-introductory renewal amount on the page (-15 pts)."
        cat4_corrective = "Explicitly specify: 'Renews at ₹X / month thereafter until cancelled.'"
        f4_title = "Missing Renewal Price Disclosure"
        f4_exp = "No explicit regular renewal price found; customers cannot ascertain ongoing cost after introductory period."
        f4_sev = "HIGH"

    total_earned += cat4_earned
    categories.append(ScoreCategory(
        category_id="RULE-04-RENEWAL",
        title="Renewal Disclosure",
        max_points=cat4_max,
        points_earned=cat4_earned,
        points_deducted=cat4_max - cat4_earned,
        criterion_applicability="APPLICABLE",
        assessment_area="MERCHANT_DISCLOSURE",
        status=cat4_status,
        reason_for_deduction=cat4_deduction,
        evidence_used=ren_amt.supporting_text,
        confidence_status=ren_amt.verification_status,
        suggested_corrective_disclosure=cat4_corrective,
        customer_impact="Customer knows whether subsequent cycles jump in price after initial discounts.",
        regulatory_reference_id=ref4.id if ref4 else None,
        regulatory_authority=ref4.authority if ref4 else "RBI"
    ))
    findings.append(AuditFinding(
        id="FINDING-RULE-04",
        rule_id="RULE-04-RENEWAL",
        title=f4_title,
        status=cat4_status if cat4_status != "PARTIAL" else "REVIEW",
        severity=f4_sev,
        explanation=f4_exp,
        evidence_snippet=ren_amt.supporting_text,
        source_url=source_url,
        applicable_reference_id=ref4.id if ref4 else None,
        applicable_reference_title=ref4.document_title if ref4 else None,
        applicable_authority=ref4.authority if ref4 else None,
        customer_impact="Price shock on subsequent billing cycles without prior disclosure.",
        suggested_corrective_disclosure=cat4_corrective
    ))

    # =========================================================================
    # CATEGORY 5: Cancellation & Revocation Conditions (Weight: 15 pts)
    # =========================================================================
    ref5 = get_regulatory_reference("RBI-EMANDATE-REVOCATION-RIGHTS")
    canc = terms.cancellation_policy
    cat5_max = 15

    if canc.verification_status == "VERIFIED" and canc.value:
        cat5_earned = 15
        cat5_status = "PASS"
        cat5_deduction = None
        cat5_corrective = None
        fields_verified += 1
        f5_title = "Clear Cancellation Terms & Rights"
        f5_exp = f"Consumer is provided clear, unhindered cancellation procedure: '{canc.value}'."
        f5_sev = "INFO"
    elif canc.verification_status == "AMBIGUOUS":
        cat5_earned = 8
        cat5_status = "PARTIAL"
        cat5_deduction = "Cancellation is mentioned but cutoff deadlines or procedural hurdles remain ambiguous (-7 pts)."
        cat5_corrective = "Clarify: 'Cancel anytime in account settings at least 24 hours prior to next billing date.'"
        f5_title = "Vague Cancellation Conditions"
        f5_exp = "Cancellation conditions do not provide precise timing cutoff or actionable instructions."
        f5_sev = "MEDIUM"
    else:
        cat5_earned = 0
        cat5_status = "MISSING"
        cat5_deduction = "No cancellation instructions or revocation terms disclosed on the subscription page (-15 pts)."
        cat5_corrective = "Include explicit link: 'Cancel subscription anytime with zero penalty from Account Settings.'"
        f5_title = "Missing Cancellation Policy"
        f5_exp = "Lack of cancellation terms violates RBI Mandate Revocation Directives & Consumer Protection Rules."
        f5_sev = "HIGH"

    total_earned += cat5_earned
    categories.append(ScoreCategory(
        category_id="RULE-05-CANCELLATION",
        title="Cancellation & Revocation Clarity",
        max_points=cat5_max,
        points_earned=cat5_earned,
        points_deducted=cat5_max - cat5_earned,
        criterion_applicability="APPLICABLE",
        assessment_area="MERCHANT_DISCLOSURE",
        status=cat5_status,
        reason_for_deduction=cat5_deduction,
        evidence_used=canc.supporting_text,
        confidence_status=canc.verification_status,
        suggested_corrective_disclosure=cat5_corrective,
        customer_impact="Customer understands how to cancel easily without forced retention loops.",
        regulatory_reference_id=ref5.id if ref5 else None,
        regulatory_authority=ref5.authority if ref5 else "RBI"
    ))
    findings.append(AuditFinding(
        id="FINDING-RULE-05",
        rule_id="RULE-05-CANCELLATION",
        title=f5_title,
        status=cat5_status if cat5_status != "PARTIAL" else "REVIEW",
        severity=f5_sev,
        explanation=f5_exp,
        evidence_snippet=canc.supporting_text,
        source_url=source_url,
        applicable_reference_id=ref5.id if ref5 else None,
        applicable_reference_title=ref5.document_title if ref5 else None,
        applicable_authority=ref5.authority if ref5 else None,
        customer_impact="Customers find it difficult to stop automatic debits when procedures are withheld.",
        suggested_corrective_disclosure=cat5_corrective
    ))

    # =========================================================================
    # CATEGORY 6: Pre-Debit Notification Safeguard (Weight: 10 pts)
    # Payment-System / Issuer Obligation under RBI/2019-20/47 & NPCI AutoPay OC-96
    # =========================================================================
    ref6 = get_regulatory_reference("NPCI-AUTOPAY-PREDEBIT-NOTIFICATION")
    predeb = terms.pre_debit_notification
    cat6_max = 10

    if predeb.verification_status == "VERIFIED" and predeb.value:
        cat6_earned = 10
        cat6_status = "PASS"
        cat6_deduction = None
        cat6_corrective = None
        fields_verified += 1
        f6_title = "Statutory Pre-Debit Alert Disclosed"
        f6_exp = "Merchant explicitly guarantees advance notification prior to recurring debit execution."
        f6_sev = "INFO"
    else:
        # Statutory 24-hour pre-debit alert is an issuer bank and payment system safeguard under RBI e-mandate rules.
        # Merchants are NOT penalized on product transparency scores for issuer notifications.
        cat6_earned = 10
        cat6_status = "PASS"
        cat6_deduction = None
        cat6_corrective = None
        fields_verified += 1
        f6_title = "Payment-System Pre-Debit Safeguard (Issuer Obligation)"
        f6_exp = (
            "Under RBI e-mandate framework (RBI/2019-20/47) and NPCI UPI AutoPay OC-96, "
            "the statutory obligation to send pre-debit intimations at least 24 hours prior to debit rests with the "
            "card/account-issuing bank and payment system. This is a payment-system safeguard, not a merchant disclosure defect. "
            "Zero points deducted. Actual pre-debit delivery is assessed when payment/mandate transaction logs are provided."
        )
        f6_sev = "INFO"

    total_earned += cat6_earned
    categories.append(ScoreCategory(
        category_id="RULE-06-PRE-DEBIT",
        title="Pre-Debit Notification Safeguard",
        max_points=cat6_max,
        points_earned=cat6_earned,
        points_deducted=cat6_max - cat6_earned,
        criterion_applicability="PAYMENT_SYSTEM_SAFEGUARD",
        assessment_area="PAYMENT_SYSTEM_SAFEGUARD",
        status=cat6_status,
        reason_for_deduction=cat6_deduction,
        evidence_used=predeb.supporting_text or "RBI/2019-20/47 & NPCI UPI AutoPay statutory framework",
        confidence_status="VERIFIED" if (predeb.verification_status == "VERIFIED" and predeb.value) else "PAYMENT_SYSTEM_SAFEGUARD",
        suggested_corrective_disclosure=cat6_corrective,
        customer_impact="Ensures consumers are reminded by their bank/UPI app before recurring debits execute.",
        regulatory_reference_id=ref6.id if ref6 else None,
        regulatory_authority=ref6.authority if ref6 else "NPCI / RBI"
    ))
    findings.append(AuditFinding(
        id="FINDING-RULE-06",
        rule_id="RULE-06-PRE-DEBIT",
        title=f6_title,
        status=cat6_status if cat6_status != "PARTIAL" else "REVIEW",
        severity=f6_sev,
        explanation=f6_exp,
        evidence_snippet=predeb.supporting_text or "Statutory obligation on card/account-issuing bank.",
        source_url=source_url,
        applicable_reference_id=ref6.id if ref6 else None,
        applicable_reference_title=ref6.document_title if ref6 else None,
        applicable_authority=ref6.authority if ref6 else None,
        customer_impact="Advance intimation sent by issuer bank enables consumer to review upcoming recurring charge.",
        suggested_corrective_disclosure=cat6_corrective
    ))

    # =========================================================================
    # CATEGORY 7: Refund & Recourse Clarity (Weight: 5 pts)
    # =========================================================================
    ref7 = get_regulatory_reference("CONSUMER-PROTECTION-E-COMM-2020")
    ref_pol = terms.refund_policy
    cat7_max = 5

    if ref_pol.verification_status == "VERIFIED" and ref_pol.value:
        cat7_earned = 5
        cat7_status = "PASS"
        cat7_deduction = None
        cat7_corrective = None
        fields_verified += 1
        f7_title = "Clear Refund & Recourse Disclosure"
        f7_exp = f"Consumer refund terms are explicitly defined: '{ref_pol.value}'."
        f7_sev = "INFO"
    elif ref_pol.verification_status == "AMBIGUOUS":
        cat7_earned = 3
        cat7_status = "PARTIAL"
        cat7_deduction = "Refund policy is mentioned vaguely without concrete timelines or conditions (-2 pts)."
        cat7_corrective = "Clarify: 'Refunds processed within 5-7 business days for eligible unutilized periods.'"
        f7_title = "Ambiguous Refund Terms"
        f7_exp = "Refund terms lack specific timelines or eligibility clarity."
        f7_sev = "LOW"
    else:
        cat7_earned = 0
        cat7_status = "MISSING"
        cat7_deduction = "No refund policy or dispute recourse is disclosed on the page (-5 pts)."
        cat7_corrective = "Provide unambiguous refund policy statement (or explicit 'Non-refundable' notice)."
        f7_title = "Missing Refund Policy"
        f7_exp = "Consumer Protection (E-Commerce) Rules require explicit disclosure of refund terms."
        f7_sev = "MEDIUM"

    total_earned += cat7_earned
    categories.append(ScoreCategory(
        category_id="RULE-07-REFUND",
        title="Refund & Recourse Clarity",
        max_points=cat7_max,
        points_earned=cat7_earned,
        points_deducted=cat7_max - cat7_earned,
        criterion_applicability="APPLICABLE",
        assessment_area="MERCHANT_DISCLOSURE",
        status=cat7_status,
        reason_for_deduction=cat7_deduction,
        evidence_used=ref_pol.supporting_text,
        confidence_status=ref_pol.verification_status,
        suggested_corrective_disclosure=cat7_corrective,
        customer_impact="Protects consumers in cases of unauthorized debits or service dissatisfaction.",
        regulatory_reference_id=ref7.id if ref7 else None,
        regulatory_authority=ref7.authority if ref7 else "CCPA"
    ))
    findings.append(AuditFinding(
        id="FINDING-RULE-07",
        rule_id="RULE-07-REFUND",
        title=f7_title,
        status=cat7_status if cat7_status != "PARTIAL" else "REVIEW",
        severity=f7_sev,
        explanation=f7_exp,
        evidence_snippet=ref_pol.supporting_text,
        source_url=source_url,
        applicable_reference_id=ref7.id if ref7 else None,
        applicable_reference_title=ref7.document_title if ref7 else None,
        applicable_authority=ref7.authority if ref7 else None,
        customer_impact="Customer is unaware if fees paid can be returned if charged erroneously.",
        suggested_corrective_disclosure=cat7_corrective
    ))

    # =========================================================================
    # CATEGORY 8: Mandate / Payment Method Disclosure (Weight: 5 pts)
    # =========================================================================
    pay_m = terms.payment_method
    cat8_max = 5

    if pay_m.verification_status == "VERIFIED" and pay_m.value:
        cat8_earned = 5
        cat8_status = "PASS"
        cat8_deduction = None
        cat8_corrective = None
        fields_verified += 1
        f8_title = "Recurring Payment Instrument Disclosed"
        f8_exp = f"Payment instruments (UPI AutoPay / Cards / e-Mandate) explicitly identified: '{pay_m.value}'."
        f8_sev = "INFO"
    elif pay_m.verification_status == "AMBIGUOUS":
        cat8_earned = 3
        cat8_status = "PARTIAL"
        cat8_deduction = "Generic recurring billing mentioned without specifying the payment mechanism (-2 pts)."
        cat8_corrective = "Clarify supported mandate methods: 'UPI AutoPay (Paytm / BHIM) or Credit/Debit Card e-mandate.'"
        f8_title = "Payment Instrument Unspecified"
        f8_exp = "The recurring debit mechanism is not explicitly identified."
        f8_sev = "LOW"
    else:
        cat8_earned = 0
        cat8_status = "MISSING"
        cat8_deduction = "No payment instrument or mandate configuration disclosure found on the page (-5 pts)."
        cat8_corrective = "Display supported recurring instruments: 'Supports UPI AutoPay, NetBanking, and Card e-Mandates.'"
        f8_title = "Missing Payment Instrument Disclosure"
        f8_exp = "Consumers are not informed of how the recurring authorization will be executed."
        f8_sev = "LOW"

    total_earned += cat8_earned
    categories.append(ScoreCategory(
        category_id="RULE-08-MANDATE-DISCLOSURE",
        title="Mandate-Related Disclosure",
        max_points=cat8_max,
        points_earned=cat8_earned,
        points_deducted=cat8_max - cat8_earned,
        criterion_applicability="APPLICABLE",
        assessment_area="MERCHANT_DISCLOSURE",
        status=cat8_status,
        reason_for_deduction=cat8_deduction,
        evidence_used=pay_m.supporting_text,
        confidence_status=pay_m.verification_status,
        suggested_corrective_disclosure=cat8_corrective,
        customer_impact="Customer knows whether recurring debit will bind their UPI VPA, bank account, or card.",
        regulatory_reference_id="NPCI-AUTOPAY-MANDATE-LIMITS",
        regulatory_authority="NPCI"
    ))
    findings.append(AuditFinding(
        id="FINDING-RULE-08",
        rule_id="RULE-08-MANDATE-DISCLOSURE",
        title=f8_title,
        status=cat8_status if cat8_status != "PARTIAL" else "REVIEW",
        severity=f8_sev,
        explanation=f8_exp,
        evidence_snippet=pay_m.supporting_text,
        source_url=source_url,
        applicable_reference_id="NPCI-AUTOPAY-MANDATE-LIMITS",
        applicable_reference_title="NPCI UPI AutoPay Operating Circular",
        applicable_authority="NPCI",
        customer_impact="Uncertainty regarding which bank account or card instrument is subject to recurring debits.",
        suggested_corrective_disclosure=cat8_corrective
    ))

    # Grade Calculation
    transparency_score = max(0, min(100, total_earned))
    if transparency_score >= 90:
        transparency_grade = "A+"
    elif transparency_score >= 80:
        transparency_grade = "A"
    elif transparency_score >= 70:
        transparency_grade = "B"
    elif transparency_score >= 60:
        transparency_grade = "C"
    else:
        transparency_grade = "D"

    coverage_pct = int((fields_verified / fields_checked) * 100)

    scorecard = TransparencyScorecard(
        total_score=transparency_score,
        max_possible_score=100,
        grade=transparency_grade,
        summary=(
            f"Product Transparency Rating: {transparency_score}/100 ({transparency_grade}) across 8 consumer disclosure and payment safeguard categories. "
            f"Evaluates upfront disclosure clarity against authentic NPCI/RBI consumer standards (not a statutory compliance certification)."
        ),
        categories=categories
    )

    return findings, transparency_score, transparency_grade, coverage_pct, scorecard

    return findings, transparency_score, transparency_grade, coverage_pct, scorecard
