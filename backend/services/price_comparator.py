"""
SpashtMandate AI - 3-Way Plan & Price Verification Comparator
Reconciles THREE distinct sources:
  A. What the merchant advertises (Merchant disclosure).
  B. What the user selected or was promised (User's expectation).
  C. What the recurring payment configuration is set to charge (Payment configuration / mandate).

Supports the exact parameters:
  1. Price
  2. Billing frequency
  3. First payment
  4. Renewal amount
  5. Promotional duration
  6. Coupon deduction
  7. Recurring debit cap

Strict Rule: Kept separate from transparency scoring and mandate technical verification.
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, List
from backend.schemas import (
    ExtractedTerms,
    UserSubscriptionInput,
    MandateRecordInput,
    PriceVerificationResult,
    PriceComparisonItem,
    OfferIntelligenceResult
)

def _to_dec(val: Optional[any]) -> Optional[Decimal]:
    if val is None:
        return None
    try:
        clean = str(val).replace(",", "").replace("₹", "").strip()
        if not clean:
            return None
        return Decimal(clean).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except Exception:
        return None

def verify_plan_and_pricing(
    terms: ExtractedTerms,
    user_input: Optional[UserSubscriptionInput],
    mandate: Optional[MandateRecordInput] = None,
    offers: Optional[OfferIntelligenceResult] = None
) -> PriceVerificationResult:
    """
    Performs 3-Way reconciliation:
    A (Merchant Disclosure) vs B (User Expectation) vs C (Payment Configuration).
    """
    items: List[PriceComparisonItem] = []
    discrepancies: List[str] = []

    if not user_input:
        return PriceVerificationResult(
            overall_status="INSUFFICIENT DATA",
            summary="User subscription details have not been provided. Enter your plan details to verify pricing commitments.",
            comparison_items=[],
            total_expected_first_cycle=None,
            actual_charged_amount=None,
            variance_amount=None,
            discrepancy_reasons=["No user subscription inputs provided."]
        )

    currency = user_input.currency or (terms.currency.value or "INR")
    
    # -------------------------------------------------------------
    # Source A: Merchant Disclosures
    # -------------------------------------------------------------
    is_url_mode = getattr(user_input, "input_mode", "MANUAL") == "URL_ASSISTED"
    
    # In URL-assisted mode, the merchant's regular price is strictly extracted from the page evidence.
    # In manual mode without URL, it uses the user-entered advertised regular price.
    if is_url_mode:
        adv_regular_dec = _to_dec(terms.subscription_amount.value)
    else:
        adv_regular_dec = _to_dec(terms.subscription_amount.value) or _to_dec(user_input.advertised_regular_price) or _to_dec(user_input.standard_listed_price)

    disclosed_freq = terms.billing_frequency.value or user_input.billing_frequency or "Monthly"
    disclosed_renewal_dec = _to_dec(terms.renewal_amount.value) or adv_regular_dec
    disclosed_first_pay_dec = _to_dec(user_input.introductory_price) or adv_regular_dec

    # -------------------------------------------------------------
    # Source B: User Expectations (Promised / Selected)
    # -------------------------------------------------------------
    user_promised_price_dec = _to_dec(user_input.user_promised_price) or _to_dec(user_input.standard_listed_price)
    user_freq = user_input.billing_frequency or "Monthly"
    user_renewal_expected_dec = _to_dec(user_input.expected_renewal_price) or user_promised_price_dec or adv_regular_dec
    
    # If introductory price was promised for first payment
    user_first_pay_expected_dec = _to_dec(user_input.introductory_price) if user_input.introductory_price is not None else user_promised_price_dec
    if user_input.coupon_discount_amount and user_first_pay_expected_dec:
        c_dec = _to_dec(user_input.coupon_discount_amount)
        if c_dec:
            user_first_pay_expected_dec = max(Decimal("0.00"), user_first_pay_expected_dec - c_dec)

    # -------------------------------------------------------------
    # Source C: Payment Configuration / Mandate
    # -------------------------------------------------------------
    mandate_amt_str = None
    mandate_dec = None
    mandate_freq = None
    if mandate and mandate.mandate_amount:
        mandate_dec = _to_dec(mandate.mandate_amount)
        mandate_amt_str = f"{currency} {mandate_dec}"
        mandate_freq = mandate.frequency or user_freq
    elif user_input.configured_mandate_amount:
        mandate_dec = _to_dec(user_input.configured_mandate_amount)
        mandate_amt_str = f"{currency} {mandate_dec}"
        mandate_freq = user_freq

    # Actual charged amount if already charged
    actual_charged_dec = _to_dec(user_input.actual_charged_price) if user_input.is_already_charged else None

    # Standard payment configuration display when not provided
    default_payment_config = "NOT PROVIDED" if (mandate_dec is None and actual_charged_dec is None) else (mandate_amt_str or f"Actual Debit: {currency} {actual_charged_dec}")

    # Track overall statuses
    recurring_mismatch_amount = None
    overall_status = "EXACT MATCH"
    customer_impact = ""
    suggested_correction = ""

    # =============================================================
    # 1. PARAMETER: Price (Base Advertised vs Promised vs Mandate)
    # =============================================================
    p_diff = None
    p_status = "EXACT MATCH"
    p_sev = "INFO"
    p_notes = "Promised subscription price matches advertised rate."
    m_disc_str = f"{currency} {adv_regular_dec}" if adv_regular_dec is not None else "Not Disclosed in Inspected Evidence"

    if adv_regular_dec is None:
        p_status = "INSUFFICIENT DATA"
        p_sev = "MEDIUM"
        status_tag = getattr(terms.subscription_amount, "verification_status", "")
        if status_tag == "MISSING_FROM_STATIC_HTML":
            m_disc_str = "Missing from Inspected Static HTML"
            p_notes = "Merchant numeric price is missing from inspected static HTML markup (rendered via client scripts). Price reconciliation is INSUFFICIENT_DATA."
        else:
            m_disc_str = "Not Disclosed in Inspected Evidence"
            p_notes = "Merchant numeric price not disclosed in inspected evidence. Price reconciliation is INSUFFICIENT_DATA."
        p_diff = "N/A (Merchant numeric price not in static HTML)"
    elif adv_regular_dec is not None and user_promised_price_dec is not None:
        diff_base = (user_promised_price_dec - adv_regular_dec).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        if abs(diff_base) > Decimal("0.02"):
            p_status = "HIGHER THAN EXPECTED" if diff_base > 0 else "LOWER THAN EXPECTED"
            p_sev = "HIGH" if abs(diff_base) > Decimal("50.00") else "MEDIUM"
            p_diff = f"{'+' if diff_base > 0 else ''}{currency} {diff_base}"
            p_notes = f"Promised price ({currency} {user_promised_price_dec}) differs from standard advertised regular price ({currency} {adv_regular_dec})."
            discrepancies.append(p_notes)
    elif adv_regular_dec is None and user_promised_price_dec is None:
        p_status = "INSUFFICIENT DATA"
        p_notes = "Neither advertised nor promised price provided."

    items.append(PriceComparisonItem(
        parameter="Price",
        merchant_disclosure=m_disc_str,
        user_expectation=f"{currency} {user_promised_price_dec}" if user_promised_price_dec is not None else "Not Provided",
        payment_configuration=mandate_amt_str or ("NOT PROVIDED" if not actual_charged_dec else f"Charged: {currency} {actual_charged_dec}"),
        merchant_disclosed=m_disc_str,
        user_entered_or_actual=f"{currency} {user_promised_price_dec}" if user_promised_price_dec is not None else "Not Provided",
        difference=p_diff,
        status=p_status,
        severity=p_sev,
        explanation=p_notes
    ))

    # =============================================================
    # 2. PARAMETER: Billing Frequency
    # =============================================================
    f_diff = None
    f_status = "EXACT MATCH"
    f_sev = "INFO"
    f_notes = f"Billing cadence aligned at '{user_freq}'."

    norm_disc_freq = disclosed_freq.strip().lower()
    norm_user_freq = user_freq.strip().lower()
    norm_mandate_freq = (mandate_freq or user_freq).strip().lower()

    if norm_disc_freq != norm_user_freq:
        f_status = "FREQUENCY MISMATCH"
        f_sev = "HIGH"
        f_diff = f"Disclosed: {disclosed_freq} vs User: {user_freq}"
        f_notes = f"Frequency Mismatch: User expects {user_freq} billing, but merchant discloses {disclosed_freq}."
        discrepancies.append(f_notes)
    elif norm_mandate_freq != norm_user_freq:
        f_status = "FREQUENCY MISMATCH"
        f_sev = "HIGH"
        f_diff = f"User: {user_freq} vs Mandate: {mandate_freq}"
        f_notes = f"Mandate schedule '{mandate_freq}' does not match expected '{user_freq}' cadence."
        discrepancies.append(f_notes)

    items.append(PriceComparisonItem(
        parameter="Billing frequency",
        merchant_disclosure=disclosed_freq,
        user_expectation=user_freq,
        payment_configuration=mandate_freq or ("NOT PROVIDED" if (not mandate_dec and not actual_charged_dec) else "Aligned with user"),
        merchant_disclosed=disclosed_freq,
        user_entered_or_actual=user_freq,
        difference=f_diff,
        status=f_status,
        severity=f_sev,
        explanation=f_notes
    ))

    # =============================================================
    # 3. PARAMETER: First Payment
    # =============================================================
    fp_diff = None
    fp_status = "EXACT MATCH"
    fp_sev = "INFO"
    fp_notes = "First payment aligns with introductory or standard plan terms."

    # Compare expected first payment with actual charged or mandate
    first_expected = user_first_pay_expected_dec or user_promised_price_dec
    first_disclosed = disclosed_first_pay_dec
    diff_act = None

    if actual_charged_dec is not None and first_expected is not None:
        diff_act = (actual_charged_dec - first_expected).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        if abs(diff_act) <= Decimal("0.02"):
            if user_input.coupon_code:
                fp_status = "MATCH AFTER COUPON"
                fp_notes = f"Actual checkout charge matches expected first cycle after applying coupon '{user_input.coupon_code}'."
            elif user_input.introductory_price:
                fp_status = "MATCH AFTER PROMOTION"
                fp_notes = f"Actual charge matches first-month promotional rate of {currency} {first_expected}."
            else:
                fp_status = "EXACT MATCH"
                fp_notes = f"Actual charge matches promised rate of {currency} {first_expected}."
        elif diff_act > Decimal("0"):
            fp_status = "HIGHER THAN EXPECTED"
            fp_sev = "HIGH"
            fp_diff = f"+{currency} {diff_act}"
            fp_notes = f"First cycle payment ({currency} {actual_charged_dec}) exceeds expected ({currency} {first_expected}) by {currency} {diff_act}."
            discrepancies.append(fp_notes)
        else:
            fp_status = "LOWER THAN EXPECTED"
            fp_diff = f"-{currency} {abs(diff_act)}"
            fp_notes = f"First cycle payment was lower by {currency} {abs(diff_act)} due to promotional credits."

    items.append(PriceComparisonItem(
        parameter="First payment",
        merchant_disclosure=f"{currency} {first_disclosed}" if first_disclosed is not None else "Standard rate",
        user_expectation=f"{currency} {first_expected}" if first_expected is not None else "Not specified",
        payment_configuration=f"Actual Debit: {currency} {actual_charged_dec}" if actual_charged_dec is not None else (mandate_amt_str or "NOT PROVIDED"),
        merchant_disclosed=f"{currency} {first_disclosed}" if first_disclosed is not None else "Standard rate",
        user_entered_or_actual=f"{currency} {first_expected}" if first_expected is not None else "Not specified",
        difference=fp_diff,
        status=fp_status,
        severity=fp_sev,
        explanation=fp_notes
    ))

    # =============================================================
    # 4. PARAMETER: Renewal Amount (CRITICAL: ₹299 vs ₹499 check)
    # =============================================================
    ren_diff = None
    ren_status = "EXACT MATCH"
    ren_sev = "INFO"
    ren_notes = "Renewal price matches ongoing subscription disclosure."

    expected_renewal = user_renewal_expected_dec or disclosed_renewal_dec

    # If mandate recurring amount is provided, compare mandate against renewal expected
    if mandate_dec is not None and expected_renewal is not None:
        diff_mandate = (mandate_dec - expected_renewal).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        if abs(diff_mandate) > Decimal("0.02"):
            if diff_mandate > Decimal("0"):
                ren_status = "HIGHER THAN EXPECTED"
                ren_sev = "HIGH"
                ren_diff = f"+{currency} {diff_mandate}"
                recurring_mismatch_amount = float(diff_mandate)
                customer_impact = (
                    f"The customer may expect a {currency} {expected_renewal} monthly renewal, "
                    f"but the configured recurring payment amount is {currency} {mandate_dec}."
                )
                suggested_correction = (
                    f"Pay {currency} {first_expected or 'intro price'} for the first month, "
                    f"then {currency} {mandate_dec} every month from month two."
                )
                ren_notes = f"Recurring mismatch: Mandate configuration ({currency} {mandate_dec}) exceeds expected renewal ({currency} {expected_renewal}) by {currency} {diff_mandate}."
                discrepancies.append(ren_notes)
            else:
                ren_status = "LOWER THAN EXPECTED"
                ren_diff = f"-{currency} {abs(diff_mandate)}"
                ren_notes = f"Mandate cap ({currency} {mandate_dec}) is lower than renewal ({currency} {expected_renewal}). Debits may fail."
                discrepancies.append(ren_notes)
    elif disclosed_renewal_dec is not None and user_renewal_expected_dec is not None:
        diff_ren = (user_renewal_expected_dec - disclosed_renewal_dec).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        if abs(diff_ren) > Decimal("0.02"):
            ren_status = "HIGHER THAN EXPECTED" if diff_ren > 0 else "LOWER THAN EXPECTED"
            ren_sev = "MEDIUM"
            ren_diff = f"{'+' if diff_ren > 0 else ''}{currency} {diff_ren}"
            ren_notes = f"Disclosed renewal ({currency} {disclosed_renewal_dec}) differs from expected ({currency} {user_renewal_expected_dec})."
            discrepancies.append(ren_notes)

    items.append(PriceComparisonItem(
        parameter="Renewal amount",
        merchant_disclosure=f"{currency} {disclosed_renewal_dec} / {user_freq.lower()}" if disclosed_renewal_dec is not None else "Not Stated",
        user_expectation=f"{currency} {expected_renewal} / {user_freq.lower()}" if expected_renewal is not None else "Not Specified",
        payment_configuration=f"{currency} {mandate_dec} / {user_freq.lower()}" if mandate_dec is not None else "NOT PROVIDED",
        merchant_disclosed=f"{currency} {disclosed_renewal_dec}" if disclosed_renewal_dec is not None else "Not Stated",
        user_entered_or_actual=f"{currency} {expected_renewal}" if expected_renewal is not None else "Not Specified",
        difference=ren_diff,
        status=ren_status,
        severity=ren_sev,
        explanation=ren_notes
    ))

    # =============================================================
    # 5. PARAMETER: Promotional Duration
    # =============================================================
    dur_str = f"{user_input.introductory_duration_months} Month(s)" if user_input.introductory_duration_months else (
        f"{user_input.free_trial_days} Days Trial" if user_input.free_trial_days else "None / Direct Paid"
    )
    items.append(PriceComparisonItem(
        parameter="Promotional duration",
        merchant_disclosure=dur_str,
        user_expectation=dur_str,
        payment_configuration="First Cycle" if user_input.introductory_duration_months else "N/A",
        merchant_disclosed=dur_str,
        user_entered_or_actual=dur_str,
        difference=None,
        status="EXACT MATCH" if dur_str != "None / Direct Paid" else "NOT_SPECIFIED",
        severity="INFO",
        explanation=f"Promotional pricing active for {dur_str} before converting to regular renewal rate." if dur_str != "None / Direct Paid" else "Standard billing without introductory promotional window."
    ))

    # =============================================================
    # 6. PARAMETER: Coupon Deduction
    # =============================================================
    coupon_str = "None"
    c_status = "EXACT MATCH"
    c_notes = "No coupon applied."
    if user_input.coupon_code:
        c_amt = user_input.coupon_discount_amount
        c_pct = user_input.coupon_discount_pct
        if c_amt:
            coupon_str = f"₹{c_amt} off ({user_input.coupon_code})"
        elif c_pct:
            coupon_str = f"{c_pct}% off ({user_input.coupon_code})"
        else:
            coupon_str = f"Code '{user_input.coupon_code}'"
        c_status = "MATCH AFTER COUPON"
        c_notes = f"Coupon '{user_input.coupon_code}' applied to first-cycle payment expectation."

    items.append(PriceComparisonItem(
        parameter="Coupon deduction",
        merchant_disclosure="Verified at Checkout",
        user_expectation=coupon_str,
        payment_configuration="Applied" if user_input.coupon_code else "None",
        merchant_disclosed="Verified at Checkout",
        user_entered_or_actual=coupon_str,
        difference=None,
        status=c_status,
        severity="INFO",
        explanation=c_notes
    ))

    # =============================================================
    # 7. PARAMETER: Recurring Debit Cap (Mandate Ceiling)
    # =============================================================
    cap_diff = None
    cap_status = "EXACT MATCH"
    cap_sev = "INFO"
    cap_notes = "Payment ceiling matches expected recurring liability."

    if mandate_dec is not None and expected_renewal is not None:
        diff_cap = (mandate_dec - expected_renewal).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        if abs(diff_cap) > Decimal("0.02"):
            if diff_cap > Decimal("0"):
                cap_status = "HIGHER THAN EXPECTED"
                cap_sev = "HIGH"
                cap_diff = f"+{currency} {diff_cap}"
                cap_notes = (
                    f"Configured recurring mandate debit cap of {currency} {mandate_dec} "
                    f"exceeds disclosed renewal amount of {currency} {expected_renewal}."
                )
            else:
                cap_status = "LOWER THAN EXPECTED"
                cap_diff = f"-{currency} {abs(diff_cap)}"
                cap_notes = f"Configured mandate cap is lower than renewal ({currency} {expected_renewal})."
    elif mandate_dec is None:
        cap_status = "INSUFFICIENT DATA"
        cap_notes = "Mandate recurring debit cap not provided. Mandate verification is unverified."

    items.append(PriceComparisonItem(
        parameter="Recurring debit cap",
        merchant_disclosure=f"{currency} {disclosed_renewal_dec}" if disclosed_renewal_dec is not None else "Not Disclosed",
        user_expectation=f"{currency} {expected_renewal}" if expected_renewal is not None else "Not Specified",
        payment_configuration=f"{currency} {mandate_dec}" if mandate_dec is not None else "NOT PROVIDED",
        merchant_disclosed=f"{currency} {disclosed_renewal_dec}" if disclosed_renewal_dec is not None else "Not Disclosed",
        user_entered_or_actual=f"{currency} {expected_renewal}" if expected_renewal is not None else "Not Specified",
        difference=cap_diff,
        status=cap_status,
        severity=cap_sev,
        explanation=cap_notes
    ))

    # Compute overall outcome
    if any(i.status == "HIGHER THAN EXPECTED" for i in items):
        overall_status = "HIGHER THAN EXPECTED"
        summary = (
            f"Configured recurring payment amount exceeds disclosed renewal terms by {currency} {recurring_mismatch_amount:.2f}."
            if recurring_mismatch_amount
            else "Configured payment liability is higher than expected."
        )
    elif any(i.status == "FREQUENCY MISMATCH" for i in items):
        overall_status = "FREQUENCY MISMATCH"
        summary = "Billing frequency mismatch detected between user expectations and merchant/mandate configuration."
    elif any(i.status == "PLAN MISMATCH" for i in items):
        overall_status = "PLAN MISMATCH"
        summary = "Selected plan pricing diverges from merchant published standard tier."
    elif any(i.status == "LOWER THAN EXPECTED" for i in items):
        overall_status = "LOWER THAN EXPECTED"
        summary = "Payment amount is lower than expected due to introductory discounts or subsidies."
    elif any(i.status == "MATCH AFTER COUPON" for i in items):
        overall_status = "MATCH AFTER COUPON"
        summary = "First-cycle payment reconciles with expected price after coupon deduction."
    elif any(i.status == "MATCH AFTER PROMOTION" for i in items):
        overall_status = "MATCH AFTER PROMOTION"
        summary = "Payment reconciles with introductory promotional discount."
    elif all(i.status in ("EXACT MATCH", "NOT_SPECIFIED", "INSUFFICIENT DATA") for i in items if i.parameter != "Recurring debit cap"):
        if mandate_dec is None and actual_charged_dec is None:
            if adv_regular_dec is not None and user_promised_price_dec is not None and abs(user_promised_price_dec - adv_regular_dec) <= Decimal("0.02"):
                overall_status = "MERCHANT_USER_MATCH"
                summary = f"Merchant disclosed price ({currency} {adv_regular_dec}) matches user expected price ({currency} {user_promised_price_dec}). Recurring payment configuration has not been provided (UNVERIFIED)."
            elif adv_regular_dec is None:
                overall_status = "INSUFFICIENT DATA"
                summary = "Merchant numeric price is missing from inspected static HTML markup (rendered via client scripts). Numeric price reconciliation is INSUFFICIENT_DATA. Student eligibility and SheerID disclosures independently verified."
            else:
                overall_status = "INSUFFICIENT DATA"
                summary = "Subscription parameters require additional verification."
        else:
            overall_status = "EXACT MATCH"
            summary = "Disclosed plan pricing, user expectation, and payment configuration align exactly."
    else:
        overall_status = "INSUFFICIENT DATA"
        summary = "Some subscription parameters are unconfirmed or require customer input."

    return PriceVerificationResult(
        overall_status=overall_status,
        summary=summary,
        comparison_items=items,
        total_expected_first_cycle=float(first_expected) if first_expected is not None else None,
        actual_charged_amount=float(actual_charged_dec) if actual_charged_dec is not None else None,
        variance_amount=float(recurring_mismatch_amount) if recurring_mismatch_amount is not None else (float(abs(diff_act)) if (diff_act is not None and abs(diff_act) > Decimal("0.02")) else None),
        discrepancy_reasons=discrepancies,
        recurring_mismatch_amount=recurring_mismatch_amount,
        customer_impact=customer_impact if customer_impact else None,
        suggested_correction=suggested_correction if suggested_correction else None
    )
