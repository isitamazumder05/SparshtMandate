"""
SpashtMandate AI - Real-World Merchant Testing & Validation Suite
Validates the complete product workflow on 3 authentic, live merchant pages:
  TEST CASE 1: Google AI Plus (https://gemini.google/in/subscriptions/?hl=en-IN)
  TEST CASE 2: Spotify Premium Standard (https://www.spotify.com/in-en/premium/)
  TEST CASE 3: Spotify Premium Student (https://www.spotify.com/in-en/student/)

Strict Rules:
- Live retrieval and extraction through the actual application engine.
- No synthetic mockups or hardcoded demonstrations.
- Honest unverified mandate handling and zero fabrication.
- Validates identical values across Overview, Plan Checker, Offers, Timeline, Mandate Check, Scorecard, and PDF.
"""

import asyncio
import sys
import uuid
import json
from pathlib import Path
from datetime import datetime

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Ensure UTF-8 output on Windows console
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from backend.database import SessionLocal, init_db
from backend.models import UserModel, AnalysisModel
from backend.services.scraper import fetch_webpage
from backend.services.extractor import extract_terms_with_llm
from backend.services.offers_engine import compute_offers_intelligence
from backend.services.price_comparator import verify_plan_and_pricing
from backend.services.timeline_generator import generate_subscription_timeline
from backend.services.rule_engine import evaluate_disclosures
from backend.services.mandate_comparator import compare_mandate_with_disclosure
from backend.main import generate_ai_recommendations
from backend.services.pdf_generator import generate_pdf_report
from backend.schemas import (
    UserSubscriptionInput,
    AnalysisResponse,
    ExtractedTerms
)

async def run_live_merchant_analysis(
    url: str,
    user_sub: UserSubscriptionInput,
    db_session
) -> AnalysisResponse:
    """Executes the exact end-to-end backend pipeline and persists the result to SQLite."""
    # 1. Live Fetch
    page_text, page_title, meta = await fetch_webpage(url)
    assert page_text and len(page_text.strip()) > 50, f"Insufficient text from {url}"

    # 2. Plan-Aware Extraction
    terms, mode = await extract_terms_with_llm(page_text, url, page_title, target_plan=user_sub.plan_name)

    # 3. Offers Intelligence
    offers = compute_offers_intelligence(terms, user_sub)

    # 4. 3-Way Plan & Price Verification
    price_ver = verify_plan_and_pricing(terms, user_sub, None, offers)

    # 5. Chronological Payment Timeline
    timeline = generate_subscription_timeline(terms, None, user_sub, offers)

    # 6. 100-Point Regulatory Transparency Audit
    findings, score, grade, coverage, scorecard = evaluate_disclosures(terms, url)

    # 7. Mandate Verification (Authentic Unverified state when no mandate supplied)
    mandate_res = compare_mandate_with_disclosure(terms, None)

    # 8. AI Recommendations
    merchant = user_sub.merchant_name or terms.merchant_name.value or "Merchant"
    recs = generate_ai_recommendations(findings, merchant)
    if price_ver.suggested_correction:
        recs.insert(0, f"[RECURRING-PAYMENT-RECONCILIATION]: {price_ver.suggested_correction}")

    # 9. Persist to SQLite
    analysis_id = str(uuid.uuid4())
    analyzed_at = datetime.utcnow().isoformat()
    text_preview = page_text[:2000]

    # Find or use test user
    user = db_session.query(UserModel).first()
    user_id = user.id if user else None

    db_record = AnalysisModel(
        id=analysis_id,
        user_id=user_id,
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
    db_session.add(db_record)
    db_session.commit()

    resp = AnalysisResponse(
        id=analysis_id,
        user_id=user_id,
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
        user_subscription=user_sub,
        price_verification=price_ver,
        offer_intelligence=offers,
        scorecard=scorecard
    )
    return resp


async def validate_real_merchants():
    print("=" * 80)
    print(" SPASHTMANDATE AI — REAL-WORLD MERCHANT TESTING & VALIDATION")
    print("=" * 80)
    init_db()
    db = SessionLocal()

    results_summary = []

    try:
        # ======================================================================
        # TEST CASE 1: Google AI Plus
        # ======================================================================
        print("\n" + "#" * 70)
        print(" [TEST CASE 1] Google AI Plus — Live Validation")
        print("#" * 70)
        url_1 = "https://gemini.google/in/subscriptions/?hl=en-IN"
        user_sub_1 = UserSubscriptionInput(
            merchant_name="Google",
            plan_name="Google AI Plus",
            user_promised_price=399.0,
            standard_listed_price=399.0,
            advertised_regular_price=399.0,
            expected_renewal_price=399.0,
            billing_frequency="Monthly",
            currency="INR",
            is_already_charged=False,
            actual_charged_price=None,
            configured_mandate_amount=None,
            input_mode="URL_ASSISTED"
        )
        resp_1 = await run_live_merchant_analysis(url_1, user_sub_1, db)
        
        # Validation checks
        ext_price_1 = resp_1.extracted_terms.subscription_amount.value
        ext_freq_1 = resp_1.extracted_terms.billing_frequency.value
        overall_status_1 = resp_1.price_verification.overall_status
        mandate_status_1 = resp_1.mandate_verification.verification_status
        is_unpaid_1 = resp_1.price_verification.actual_charged_amount is None
        payment_config_col_1 = resp_1.price_verification.comparison_items[0].payment_configuration
        pdf_1 = generate_pdf_report(resp_1)

        print(f"Extracted Plan & Price: {ext_price_1} (Status: {resp_1.extracted_terms.subscription_amount.verification_status})")
        print(f"Verbatim Quote: '{resp_1.extracted_terms.subscription_amount.supporting_text[:120]}...'")
        print(f"Billing Frequency: {ext_freq_1}")
        print(f"Reconciliation Status: {overall_status_1}")
        print(f"Payment Configuration: {payment_config_col_1}")
        print(f"Mandate Status: {mandate_status_1}")
        print(f"Transparency Score: {resp_1.transparency_score}/100 (Grade: {resp_1.transparency_grade})")
        print(f"PDF Generated: {len(pdf_1)} bytes")

        # Assertions
        assert ext_price_1 == "399", f"Expected ₹399, got {ext_price_1} (Zero-price bug detected!)"
        assert ext_price_1 != "0", "₹399 must NOT appear as ₹0!"
        assert ext_freq_1 == "Monthly", f"Expected Monthly, got {ext_freq_1}"
        assert overall_status_1 in ("MERCHANT_USER_MATCH", "EXACT MATCH"), f"Unexpected status: {overall_status_1}"
        assert payment_config_col_1 == "NOT PROVIDED", f"Expected NOT PROVIDED, got {payment_config_col_1}"
        assert mandate_status_1 == "UNVERIFIED", f"Expected UNVERIFIED, got {mandate_status_1}"
        assert is_unpaid_1 is True, "Must not report actual payment match when unpaid"
        assert len(pdf_1) > 2000, "Valid PDF report must be generated"

        results_summary.append({
            "case": "Google AI Plus",
            "url": url_1,
            "status": "PASSED",
            "extracted_price": f"₹{ext_price_1} / {ext_freq_1}",
            "reconciliation": overall_status_1,
            "payment_config": payment_config_col_1,
            "mandate": mandate_status_1,
            "score": f"{resp_1.transparency_score}/100 ({resp_1.transparency_grade})",
            "pdf_bytes": len(pdf_1)
        })
        print("--> TEST CASE 1 VALIDATION: ALL CHECKS PASSED [SUCCESS]\n")

        # ======================================================================
        # TEST CASE 2: Spotify Premium Standard
        # ======================================================================
        print("#" * 70)
        print(" [TEST CASE 2] Spotify Premium Standard — Live Validation")
        print("#" * 70)
        url_2 = "https://www.spotify.com/in-en/premium/"
        user_sub_2 = UserSubscriptionInput(
            merchant_name="Spotify",
            plan_name="Premium Standard",
            user_promised_price=139.0,
            standard_listed_price=139.0,
            advertised_regular_price=139.0,
            introductory_price=139.0,
            introductory_duration_months=2,
            expected_renewal_price=139.0,
            billing_frequency="Monthly",
            currency="INR",
            is_already_charged=False,
            actual_charged_price=None,
            configured_mandate_amount=None,
            input_mode="URL_ASSISTED"
        )
        resp_2 = await run_live_merchant_analysis(url_2, user_sub_2, db)

        ext_price_2 = resp_2.extracted_terms.subscription_amount.value
        ext_renewal_2 = resp_2.extracted_terms.renewal_amount.value
        mandate_status_2 = resp_2.mandate_verification.verification_status
        eligibility_2 = resp_2.offer_intelligence.eligibility_status
        has_new_user_disc = any("haven't tried premium before" in d.lower() or "new customers only" in d.lower() for d in resp_2.extracted_terms.other_recurring_disclosures)
        pdf_2 = generate_pdf_report(resp_2)

        print(f"Extracted Plan & Intro: {ext_price_2} (Quote: '{resp_2.extracted_terms.subscription_amount.supporting_text[:100]}...')")
        print(f"Extracted Renewal Amount: {ext_renewal_2} (Quote: '{resp_2.extracted_terms.renewal_amount.supporting_text[:100]}...')")
        print(f"New User Restriction Detected: {has_new_user_disc}")
        print(f"Eligibility Status: {eligibility_2} ({resp_2.offer_intelligence.eligibility_notes[:100]}...)")
        print(f"Mandate Status: {mandate_status_2}")
        print(f"Timeline Phases: {len(resp_2.timeline)} events")
        for ev in resp_2.timeline:
            print(f"  - [{ev.timing_type}] {ev.phase_name}: {ev.date_display} ({ev.amount_display or 'N/A'})")
        print(f"Transparency Score: {resp_2.transparency_score}/100 (Grade: {resp_2.transparency_grade})")
        print(f"PDF Generated: {len(pdf_2)} bytes")

        # Assertions
        assert ext_price_2 == "139", f"Expected introductory ₹139, got {ext_price_2}"
        assert ext_renewal_2 == "139", f"Expected renewal rate ₹139, got {ext_renewal_2} (Must NOT be ₹1390!)"
        assert has_new_user_disc is True, "Must detect new-user restriction 'Offer only available if you haven't tried Premium before'"
        assert eligibility_2 in ("UNCLEAR", "UNVERIFIED"), f"Expected eligibility UNCLEAR or UNVERIFIED, got {eligibility_2}"
        assert mandate_status_2 == "UNVERIFIED", f"Expected UNVERIFIED mandate, got {mandate_status_2}"
        assert len(resp_2.timeline) >= 4, "Timeline must model full subscription lifecycle"
        assert len(pdf_2) > 2000, "Valid PDF report must be generated"

        results_summary.append({
            "case": "Spotify Premium Standard",
            "url": url_2,
            "status": "PASSED",
            "extracted_price": f"₹{ext_price_2} (Intro) / Renewal: ₹{ext_renewal_2}",
            "reconciliation": resp_2.price_verification.overall_status,
            "payment_config": resp_2.price_verification.comparison_items[0].payment_configuration,
            "mandate": mandate_status_2,
            "score": f"{resp_2.transparency_score}/100 ({resp_2.transparency_grade})",
            "pdf_bytes": len(pdf_2)
        })
        print("--> TEST CASE 2 VALIDATION: ALL CHECKS PASSED [SUCCESS]\n")

        # ======================================================================
        # TEST CASE 3: Spotify Premium Student
        # ======================================================================
        print("#" * 70)
        print(" [TEST CASE 3] Spotify Premium Student — Live Validation")
        print("#" * 70)
        url_3 = "https://www.spotify.com/in-en/student/"
        user_sub_3 = UserSubscriptionInput(
            merchant_name="Spotify",
            plan_name="Premium Student",
            user_promised_price=69.0,
            standard_listed_price=69.0,
            advertised_regular_price=69.0,
            introductory_price=69.0,
            introductory_duration_months=2,
            expected_renewal_price=69.0,
            billing_frequency="Monthly",
            currency="INR",
            customer_type="NEW_CUSTOMER",
            promotional_eligibility="UNCLEAR",
            is_already_charged=False,
            actual_charged_price=None,
            configured_mandate_amount=None,
            invoice_notes="Student at an accredited higher education institution; SheerID verification required.",
            input_mode="URL_ASSISTED"
        )
        resp_3 = await run_live_merchant_analysis(url_3, user_sub_3, db)

        has_sheerid = any("sheerid" in d.lower() for d in resp_3.extracted_terms.other_recurring_disclosures)
        has_accredited = any("accredited" in d.lower() for d in resp_3.extracted_terms.other_recurring_disclosures)
        has_rollover = any("rollover" in d.lower() or "standard plan" in d.lower() for d in resp_3.extracted_terms.other_recurring_disclosures)
        eligibility_3 = resp_3.offer_intelligence.eligibility_status
        mandate_status_3 = resp_3.mandate_verification.verification_status
        static_price_status = resp_3.extracted_terms.subscription_amount.verification_status
        
        # Check conditional rollover event on timeline
        rollover_timeline_ev = next((ev for ev in resp_3.timeline if "rollover" in ev.phase_name.lower()), None)
        pdf_3 = generate_pdf_report(resp_3)

        print(f"Static HTML Price Status: {static_price_status} (Honest unverified/missing status without fabrication)")
        print(f"Supporting Text: '{resp_3.extracted_terms.subscription_amount.supporting_text[:110]}...'")
        print(f"SheerID Verification Identified: {has_sheerid}")
        print(f"Accredited Higher Education Requirement Identified: {has_accredited}")
        print(f"Conditional Rollover to Standard Plan Identified: {has_rollover}")
        print(f"Eligibility Status: {eligibility_3} ({resp_3.offer_intelligence.eligibility_notes[:100]}...)")
        print(f"Mandate Status: {mandate_status_3}")
        if rollover_timeline_ev:
            print(f"Conditional Rollover Event: [{rollover_timeline_ev.timing_type}] {rollover_timeline_ev.phase_name}: {rollover_timeline_ev.date_display} | {rollover_timeline_ev.amount_display}")
        print(f"Transparency Score: {resp_3.transparency_score}/100 (Grade: {resp_3.transparency_grade})")
        print(f"PDF Generated: {len(pdf_3)} bytes")

        # Assertions
        assert has_sheerid is True, "Must identify SheerID third-party verification requirement"
        assert has_rollover is True, "Must identify conditional rollover to standard plan upon graduation/leaving school"
        assert eligibility_3 == "UNVERIFIED", f"Expected UNVERIFIED eligibility, got {eligibility_3}"
        assert mandate_status_3 == "UNVERIFIED", f"Expected UNVERIFIED mandate, got {mandate_status_3}"
        assert rollover_timeline_ev is not None, "Timeline must include conditional plan rollover event"
        assert rollover_timeline_ev.timing_type == "UNKNOWN", "Conditional rollover timing must be UNKNOWN"
        assert "Not Disclosed" in rollover_timeline_ev.amount_display or "Standard Plan" in rollover_timeline_ev.amount_display, "Must not invent future standard price"
        assert static_price_status in ("MISSING_FROM_STATIC_HTML", "NOT_VERIFIABLE"), f"Must report exact static retrieval status honestly, got {static_price_status}"
        assert resp_3.price_verification.overall_status in ("INSUFFICIENT DATA", "INSUFFICIENT_DATA"), f"Expected INSUFFICIENT_DATA, got {resp_3.price_verification.overall_status}"
        assert resp_3.price_verification.overall_status != "MERCHANT_USER_MATCH", "Must NOT return MERCHANT_USER_MATCH when numeric price is missing from static HTML!"
        assert len(pdf_3) > 2000, "Valid PDF report must be generated"

        results_summary.append({
            "case": "Spotify Premium Student",
            "url": url_3,
            "status": "PASSED",
            "extracted_price": f"HTML Price: {static_price_status} (SheerID / Rollover Verified)",
            "reconciliation": resp_3.price_verification.overall_status,
            "payment_config": resp_3.price_verification.comparison_items[0].payment_configuration,
            "mandate": mandate_status_3,
            "score": f"{resp_3.transparency_score}/100 ({resp_3.transparency_grade})",
            "pdf_bytes": len(pdf_3)
        })
        print("--> TEST CASE 3 VALIDATION: ALL CHECKS PASSED [SUCCESS]\n")

        # ======================================================================
        # FINAL REPORT TABLE
        # ======================================================================
        print("\n" + "=" * 90)
        print(" REAL-WORLD MERCHANT VALIDATION RESULTS SUMMARY TABLE")
        print("=" * 90)
        print(f"{'Merchant Plan':<26} | {'Status':<7} | {'Extracted Rate':<22} | {'Reconciliation':<20} | {'Mandate':<11} | {'Score'}")
        print("-" * 90)
        for r in results_summary:
            print(f"{r['case']:<26} | {r['status']:<7} | {r['extracted_price']:<22} | {r['reconciliation']:<20} | {r['mandate']:<11} | {r['score']}")
        print("=" * 90)

    finally:
        db.close()

def run_regression_tests():
    """Runs isolated deterministic regression tests for the 6 core transparency & validation criteria."""
    print("\n" + "=" * 90)
    print(" DETERMINISTIC REGRESSION SUITE (6 CORE CRITERIA)")
    print("=" * 90)

    from backend.schemas import FieldEvidence, ExtractedTerms, MandateRecordInput

    # -------------------------------------------------------------------------
    # Regression Test A: Student price missing from static HTML but user price present
    # -------------------------------------------------------------------------
    terms_a = ExtractedTerms(
        merchant_name=FieldEvidence(value="Spotify"),
        subscription_amount=FieldEvidence(
            value=None,
            verification_status="MISSING_FROM_STATIC_HTML",
            supporting_text="Static webpage terms do not disclose explicit numeric pricing in initial HTML markup."
        ),
        billing_frequency=FieldEvidence(value="Monthly", verification_status="VERIFIED"),
        other_recurring_disclosures=["SheerID verification required.", "Enrolled at an accredited higher education institution."]
    )
    user_a = UserSubscriptionInput(
        merchant_name="Spotify",
        plan_name="Premium Student",
        user_promised_price=69.0,
        billing_frequency="Monthly",
        input_mode="URL_ASSISTED"
    )
    offers_a = compute_offers_intelligence(terms_a, user_a)
    price_ver_a = verify_plan_and_pricing(terms_a, user_a, None, offers_a)
    
    assert price_ver_a.overall_status in ("INSUFFICIENT DATA", "INSUFFICIENT_DATA"), f"Expected INSUFFICIENT_DATA, got {price_ver_a.overall_status}"
    assert price_ver_a.overall_status != "MERCHANT_USER_MATCH", "Price reconciliation must NOT match when merchant numeric price is missing!"
    print("[PASS] Regression A: Student price missing from static HTML yields INSUFFICIENT_DATA (never MERCHANT_USER_MATCH).")

    # -------------------------------------------------------------------------
    # Regression Test B: Introductory price equal to renewal price
    # -------------------------------------------------------------------------
    terms_b = ExtractedTerms(
        merchant_name=FieldEvidence(value="Spotify"),
        subscription_amount=FieldEvidence(value="139.00", verification_status="VERIFIED"),
        renewal_amount=FieldEvidence(value="139.00", verification_status="VERIFIED"),
        billing_frequency=FieldEvidence(value="Monthly", verification_status="VERIFIED")
    )
    user_b = UserSubscriptionInput(
        merchant_name="Spotify",
        plan_name="Premium Standard",
        user_promised_price=139.0,
        introductory_price=139.0,
        introductory_duration_months=2,
        expected_renewal_price=139.0,
        billing_frequency="Monthly"
    )
    offers_b = compute_offers_intelligence(terms_b, user_b)
    tl_b = generate_subscription_timeline(terms_b, None, user_b, offers_b)
    
    renewal_ev = next((e for e in tl_b if e.event_id == "EVENT-04-FIRST-RENEWAL"), None)
    assert renewal_ev is not None, "Timeline must contain first renewal event"
    assert "Zero Price Increase" in renewal_ev.amount_display, f"Expected '(Zero Price Increase)' in amount display: {renewal_ev.amount_display}"
    assert renewal_ev.badge_status == "INFO", f"Expected badge_status INFO, got {renewal_ev.badge_status} (must not be ALERT)"
    
    # Check offers intelligence stage notes
    renewal_stage = next((s for s in offers_b.stages if "Renewal" in s.stage_name), None)
    assert renewal_stage is not None and "zero price increase" in renewal_stage.notes.lower()
    print("[PASS] Regression B: Introductory price equal to renewal price explicitly displays '(Zero Price Increase)' with INFO badge.")

    # -------------------------------------------------------------------------
    # Regression Test C: First renewal occurring after introductory period
    # -------------------------------------------------------------------------
    assert renewal_ev.step_number > 1, "First renewal must occur AFTER initial payment and intro window"
    assert "Month 2" in renewal_ev.date_display or "Day 60" in renewal_ev.date_display, f"Expected Month 2 / Day 60 timing, got: {renewal_ev.date_display}"
    assert tl_b[0].phase_name == "Initial Sign-Up Payment"
    assert "Covers initial 2 months" in tl_b[0].amount_display
    print("[PASS] Regression C: First renewal occurs strictly after introductory period (Month 2 / Day 60, not Day 0).")

    # -------------------------------------------------------------------------
    # Regression Test D: Issuer notification requirement not treated as merchant disclosure
    # -------------------------------------------------------------------------
    terms_d = ExtractedTerms(
        merchant_name=FieldEvidence(value="Merchant Without PreDebit Notice"),
        subscription_amount=FieldEvidence(value="199.00", verification_status="VERIFIED"),
        billing_frequency=FieldEvidence(value="Monthly", verification_status="VERIFIED"),
        renewal_amount=FieldEvidence(value="199.00", verification_status="VERIFIED"),
        cancellation_policy=FieldEvidence(value="Cancel anytime online", verification_status="VERIFIED"),
        pre_debit_notification=FieldEvidence(value=None, verification_status="MISSING"),
        refund_policy=FieldEvidence(value="Standard refunds", verification_status="VERIFIED")
    )
    _, score_d, _, _, card_d = evaluate_disclosures(terms_d, "https://example.com")
    cat6 = next((c for c in card_d.categories if c.category_id == "RULE-06-PRE-DEBIT"), None)
    
    assert cat6 is not None
    assert cat6.assessment_area == "PAYMENT_SYSTEM_SAFEGUARD", f"Expected PAYMENT_SYSTEM_SAFEGUARD, got {cat6.assessment_area}"
    assert cat6.criterion_applicability == "PAYMENT_SYSTEM_SAFEGUARD"
    assert cat6.points_deducted == 0, f"Expected 0 points deducted, got {cat6.points_deducted}"
    assert cat6.points_earned == 10, f"Expected 10 points earned, got {cat6.points_earned}"
    print("[PASS] Regression D: RBI 24-hour pre-debit notice treated as payment-system safeguard (0 merchant points deducted).")

    # -------------------------------------------------------------------------
    # Regression Test E: Extraction failure not automatically reducing merchant score
    # -------------------------------------------------------------------------
    terms_e = ExtractedTerms(
        merchant_name=FieldEvidence(value="Dynamic Single-Page App"),
        subscription_amount=FieldEvidence(
            value=None,
            verification_status="MISSING_FROM_STATIC_HTML",
            supporting_text="Static webpage terms do not disclose explicit numeric pricing in initial HTML markup."
        ),
        billing_frequency=FieldEvidence(value="Monthly", verification_status="VERIFIED"),
        renewal_amount=FieldEvidence(value="199.00", verification_status="VERIFIED"),
        cancellation_policy=FieldEvidence(value="Cancel anytime online", verification_status="VERIFIED"),
        refund_policy=FieldEvidence(value="Standard refunds", verification_status="VERIFIED")
    )
    _, score_e, _, _, card_e = evaluate_disclosures(terms_e, "https://example.com")
    cat1 = next((c for c in card_e.categories if c.category_id == "RULE-01-PRICE"), None)
    
    assert cat1 is not None
    assert cat1.status == "NOT_VERIFIABLE", f"Expected NOT_VERIFIABLE, got {cat1.status}"
    assert cat1.criterion_applicability == "NOT_VERIFIABLE"
    assert cat1.points_deducted == 0, f"Extraction failure must NOT deduct points, got {cat1.points_deducted}"
    assert cat1.points_earned == 20, f"Expected full 20 points preserved under NOT_VERIFIABLE, got {cat1.points_earned}"
    print("[PASS] Regression E: Extraction failure (MISSING_FROM_STATIC_HTML) does not penalize merchant transparency score.")

    # -------------------------------------------------------------------------
    # Regression Test F: Missing mandate never being labelled verified
    # -------------------------------------------------------------------------
    mandate_res_f = compare_mandate_with_disclosure(terms_d, None)
    assert mandate_res_f.mandate_provided is False, "mandate_provided must be False when None"
    assert mandate_res_f.verification_status == "UNVERIFIED", f"Expected UNVERIFIED, got {mandate_res_f.verification_status}"
    assert "not been provided" in mandate_res_f.status_summary.lower() or mandate_res_f.status_summary == "MANDATE_NOT_PROVIDED"
    assert mandate_res_f.verification_status != "VERIFIED"
    assert mandate_res_f.verification_status != "MATCH"
    print("[PASS] Regression F: Missing mandate is strictly handled as UNVERIFIED (never labelled verified).")

    print("=" * 90)
    print(" ALL 6 DETERMINISTIC REGRESSION CRITERIA PASSED [100% SUCCESS]")
    print("=" * 90)

if __name__ == "__main__":
    asyncio.run(validate_real_merchants())
    run_regression_tests()
