"""
SpashtMandate AI - Offers & Discounts Intelligence Engine
Evaluates standard vs introductory vs promotional vs coupon discounts deterministically.
Computes multi-stage pricing trajectories using Python Decimal arithmetic (zero float errors).
Calculates each stage independently:
  1. Trial price
  2. Promotional price
  3. Coupon-adjusted price
  4. Regular renewal price
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, List, Tuple
from backend.schemas import (
    ExtractedTerms,
    UserSubscriptionInput,
    OfferIntelligenceResult,
    OfferStage
)

def _to_decimal(val: Optional[any]) -> Optional[Decimal]:
    if val is None:
        return None
    try:
        clean = str(val).replace(",", "").replace("₹", "").strip()
        if not clean:
            return None
        return Decimal(clean).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except Exception:
        return None

def compute_offers_intelligence(
    terms: ExtractedTerms,
    user_input: Optional[UserSubscriptionInput]
) -> OfferIntelligenceResult:
    """
    Evaluates promotional pricing, discount duration, coupons, eligibility, and multi-stage pricing.
    """
    currency = user_input.currency if (user_input and user_input.currency) else (terms.currency.value or "INR")
    billing_freq = user_input.billing_frequency if (user_input and user_input.billing_frequency) else (terms.billing_frequency.value or "Monthly")
    
    # 1. Base / Regular Advertised Price
    disclosed_std_dec = _to_decimal(terms.subscription_amount.value)
    user_std_dec = _to_decimal(user_input.standard_listed_price) or _to_decimal(user_input.advertised_regular_price) if user_input else None
    effective_std_dec = user_std_dec if user_std_dec is not None else disclosed_std_dec

    # 2. Free Trial Details (Stage 1: Trial Price)
    has_trial = False
    trial_days = None
    if user_input and user_input.free_trial_days is not None:
        has_trial = user_input.free_trial_days > 0
        trial_days = user_input.free_trial_days
    elif terms.free_trial_available.value is True or (isinstance(terms.trial_duration_days.value, (int, float)) and terms.trial_duration_days.value > 0):
        has_trial = True
        trial_days = int(terms.trial_duration_days.value) if terms.trial_duration_days.value else 7

    # 3. Introductory & Promotional Discount Details (Stage 2: Promotional Price)
    intro_price_dec = _to_decimal(user_input.introductory_price) if (user_input and user_input.introductory_price is not None) else None
    intro_duration = user_input.introductory_duration_months if (user_input and user_input.introductory_duration_months is not None) else None
    promo_pct = _to_decimal(user_input.promotional_discount_pct) if (user_input and user_input.promotional_discount_pct is not None) else None
    promo_amt = _to_decimal(user_input.promotional_discount_amount) if (user_input and user_input.promotional_discount_amount is not None) else None

    # Calculate promo price independently
    expected_promo_dec = intro_price_dec
    if expected_promo_dec is None and effective_std_dec is not None:
        if promo_pct is not None and promo_pct > Decimal("0"):
            discount_val = (effective_std_dec * (promo_pct / Decimal("100"))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            expected_promo_dec = max(Decimal("0.00"), effective_std_dec - discount_val)
        elif promo_amt is not None and promo_amt > Decimal("0"):
            expected_promo_dec = max(Decimal("0.00"), effective_std_dec - promo_amt)

    # 4. Coupon Code & Coupon Discount (Stage 3: Coupon-Adjusted Price)
    coupon_code = user_input.coupon_code.strip() if (user_input and user_input.coupon_code) else None
    coupon_amt_dec = _to_decimal(user_input.coupon_discount_amount) if (user_input and user_input.coupon_discount_amount is not None) else None
    coupon_pct_dec = _to_decimal(user_input.coupon_discount_pct) if (user_input and user_input.coupon_discount_pct is not None) else None

    # Calculate coupon reduction
    base_for_coupon = expected_promo_dec if expected_promo_dec is not None else effective_std_dec
    coupon_adjusted_dec = base_for_coupon

    if coupon_code and base_for_coupon is not None:
        if coupon_amt_dec is not None and coupon_amt_dec > Decimal("0"):
            coupon_adjusted_dec = max(Decimal("0.00"), base_for_coupon - coupon_amt_dec)
        elif coupon_pct_dec is not None and coupon_pct_dec > Decimal("0"):
            c_val = (base_for_coupon * (coupon_pct_dec / Decimal("100"))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            coupon_adjusted_dec = max(Decimal("0.00"), base_for_coupon - c_val)
            coupon_amt_dec = c_val

    # 5. Regular Renewal Price (Stage 4: Subsequent Regular Renewal Price)
    user_renewal_dec = _to_decimal(user_input.expected_renewal_price) if (user_input and user_input.expected_renewal_price is not None) else None
    disclosed_renewal_dec = _to_decimal(terms.renewal_amount.value)
    expected_renewal_dec = user_renewal_dec if user_renewal_dec is not None else (disclosed_renewal_dec if disclosed_renewal_dec is not None else effective_std_dec)

    # 6. Construct Multi-Stage Pricing Trajectory
    stages: List[OfferStage] = []
    
    # Stage 1: Free Trial (if offered)
    if has_trial:
        stages.append(OfferStage(
            stage_name="Stage 1: Free Trial",
            duration_display=f"{trial_days} Days" if trial_days else "Introductory Window",
            price_display=f"{currency} 0.00",
            unit_price=0.0,
            currency=currency,
            billing_frequency=billing_freq,
            is_recurring=False,
            notes="Complimentary evaluation period. No recurring charges execute during this window."
        ))

    # Stage 2: Promotional Offer Price
    if expected_promo_dec is not None and (intro_duration or promo_pct or promo_amt or intro_price_dec):
        dur_str = f"First {intro_duration} Months" if intro_duration else "Introductory Window"
        if expected_promo_dec == expected_renewal_dec:
            notes_str = f"Introductory rate of {currency} {expected_promo_dec} for {dur_str}. Renews at identical rate of {currency} {expected_renewal_dec} / {billing_freq.lower()} with zero price increase."
        else:
            promo_desc = f"{promo_pct}% introductory discount" if promo_pct else (f"{currency} {promo_amt} promotional off" if promo_amt else "Special introductory rate")
            notes_str = f"{promo_desc}. Applies before transitioning to regular ongoing renewal."
        stages.append(OfferStage(
            stage_name=f"Stage {len(stages) + 1}: Promotional Rate",
            duration_display=dur_str,
            price_display=f"{currency} {expected_promo_dec} / {billing_freq.lower()}",
            unit_price=float(expected_promo_dec),
            currency=currency,
            billing_frequency=billing_freq,
            is_recurring=True,
            notes=notes_str
        ))

    # Stage 3: Coupon Deduction (if applicable on initial cycle)
    if coupon_code and coupon_adjusted_dec is not None and coupon_adjusted_dec != expected_promo_dec:
        stages.append(OfferStage(
            stage_name=f"Stage {len(stages) + 1}: Coupon-Adjusted First Payment",
            duration_display="Initial Checkout Cycle",
            price_display=f"{currency} {coupon_adjusted_dec}",
            unit_price=float(coupon_adjusted_dec),
            currency=currency,
            billing_frequency=billing_freq,
            is_recurring=False,
            notes=f"Includes coupon deduction '{coupon_code}' of {currency} {coupon_amt_dec or 'discount'}."
        ))

    # Stage 4: Regular Renewal Rate
    if expected_renewal_dec is not None:
        if expected_promo_dec is not None and expected_promo_dec == expected_renewal_dec:
            renewal_notes = f"Standard ongoing subscription rate at {currency} {expected_renewal_dec} / {billing_freq.lower()} with zero price increase after introductory period."
            renewal_dur_str = f"From Month {(intro_duration or 1) + 1} / Post-Introductory"
        else:
            renewal_notes = "Standard ongoing subscription fee after all introductory discounts and coupons expire."
            renewal_dur_str = f"From Month {(intro_duration or 1) + 1} / Post-Promotion" if intro_duration else "From Month 2 / Post-Promotion"

        stages.append(OfferStage(
            stage_name=f"Stage {len(stages) + 1}: Regular Ongoing Renewal",
            duration_display=renewal_dur_str,
            price_display=f"{currency} {expected_renewal_dec} / {billing_freq.lower()}",
            unit_price=float(expected_renewal_dec),
            currency=currency,
            billing_frequency=billing_freq,
            is_recurring=True,
            notes=renewal_notes
        ))

    # 7. Customer Eligibility Analysis
    customer_type = user_input.customer_type if (user_input and user_input.customer_type) else "NEW_CUSTOMER"
    promotional_eligibility = user_input.promotional_eligibility if (user_input and user_input.promotional_eligibility) else "UNCLEAR"

    has_sheerid = any("sheerid" in d.lower() for d in (terms.other_recurring_disclosures or []))
    has_new_user_restriction = any(
        "haven't tried premium before" in d.lower() or "haven’t tried premium before" in d.lower() or "new customers only" in d.lower()
        for d in (terms.other_recurring_disclosures or [])
    )

    eligibility_notes = ""
    if has_sheerid:
        eligibility_status = "UNVERIFIED"
        eligibility_notes = "Requires third-party student verification via SheerID (must be enrolled at an accredited higher education institution, age 18+). Third-party verification is currently unverified."
    elif has_new_user_restriction:
        eligibility_status = "UNCLEAR"
        eligibility_notes = "Offer only available if subscriber has not tried Premium before (new subscribers only). Account history is unverified without merchant session authentication."
    elif customer_type == "NEW_CUSTOMER":
        if promotional_eligibility == "ELIGIBLE":
            eligibility_status = "ELIGIBLE"
            eligibility_notes = "User qualifies as a first-time subscriber for new-customer promotional pricing."
        elif promotional_eligibility == "INELIGIBLE":
            eligibility_status = "INELIGIBLE"
            eligibility_notes = "Disclosed terms exclude prior or returning accounts from this promotional tier."
        else:
            eligibility_status = "UNCLEAR"
            eligibility_notes = "Promotion is marked for new customers, but merchant checkout verification has not confirmed account status."
    elif customer_type == "EXISTING_CUSTOMER":
        if promo_pct or promo_amt or intro_price_dec:
            eligibility_status = "UNCLEAR"
            eligibility_notes = "Existing customer enrolled in a promotion typically reserved for new subscriptions. Verify terms apply to renewals."
        else:
            eligibility_status = "ELIGIBLE"
            eligibility_notes = "Standard recurring rates apply to active subscriber renewal."
    else:
        eligibility_status = "UNCLEAR"
        eligibility_notes = "Customer account standing (new vs returning) cannot be determined without authenticated merchant session."

    # 8. Comparison Against Actual Checkout / Charged Amount
    actual_charged_dec = _to_decimal(user_input.actual_charged_price) if (user_input and user_input.actual_charged_price is not None) else None

    comparison_outcome = "INSUFFICIENT_EVIDENCE"
    comparison_notes = "Subscription terms modeled across multiple stages."
    discrepancy_amount = None

    # Expected first cycle price after all promotions and coupons
    first_expected_dec = coupon_adjusted_dec if coupon_adjusted_dec is not None else (expected_promo_dec if expected_promo_dec is not None else effective_std_dec)

    if actual_charged_dec is not None:
        tol = Decimal("0.02")
        if first_expected_dec is not None:
            diff = (actual_charged_dec - first_expected_dec).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            discrepancy_amount = float(diff)

            if abs(diff) <= tol:
                if coupon_amt_dec and coupon_amt_dec > 0:
                    comparison_outcome = "MATCH_AFTER_COUPON"
                    comparison_notes = f"Actual checkout amount of {currency} {actual_charged_dec} matches the expected price after applying coupon '{coupon_code}'."
                elif expected_promo_dec is not None and effective_std_dec is not None and expected_promo_dec < effective_std_dec:
                    comparison_outcome = "MATCH_AFTER_PROMO"
                    comparison_notes = f"Actual checkout amount of {currency} {actual_charged_dec} matches the expected discounted promotional price."
                else:
                    comparison_outcome = "EXACT_MATCH"
                    comparison_notes = f"Actual checkout amount of {currency} {actual_charged_dec} matches the standard disclosed plan price exactly."
            elif diff > Decimal("0.00"):
                comparison_outcome = "HIGHER_THAN_EXPECTED"
                comparison_notes = (
                    f"Actual charge ({currency} {actual_charged_dec}) is {currency} {abs(diff)} higher than expected "
                    f"({currency} {first_expected_dec}). Check for unbundled GST/taxes, convenience charges, or unapplied coupons."
                )
            else:
                comparison_outcome = "LOWER_THAN_EXPECTED"
                comparison_notes = (
                    f"Actual charge ({currency} {actual_charged_dec}) is {currency} {abs(diff)} lower than expected "
                    f"({currency} {first_expected_dec}). An additional promotional credit or tax deduction may have applied."
                )
    else:
        if eligibility_status == "UNCLEAR" and (intro_price_dec or promo_pct or promo_amt):
            comparison_outcome = "ELIGIBILITY_UNCLEAR"
            comparison_notes = "Promotional offer eligibility is unconfirmed (new vs returning customer standing unknown)."
        elif coupon_code and coupon_amt_dec:
            comparison_outcome = "MATCH_AFTER_COUPON"
            comparison_notes = f"Expected first payment of {currency} {first_expected_dec} accounts for coupon '{coupon_code}'. Payment not yet executed."
        elif expected_promo_dec is not None and effective_std_dec is not None and expected_promo_dec < effective_std_dec:
            comparison_outcome = "MATCH_AFTER_PROMO"
            comparison_notes = f"Expected initial rate of {currency} {first_expected_dec} accounts for promotional discount. Renewal expected at {currency} {expected_renewal_dec}."
        elif effective_std_dec is not None:
            comparison_outcome = "EXACT_MATCH"
            comparison_notes = f"Expected ongoing rate of {currency} {effective_std_dec} / {billing_freq.lower()}."

    return OfferIntelligenceResult(
        standard_price=float(effective_std_dec) if effective_std_dec is not None else None,
        introductory_price=float(expected_promo_dec) if expected_promo_dec is not None else None,
        introductory_duration_months=intro_duration,
        coupon_code=coupon_code,
        coupon_discount=float(coupon_amt_dec) if coupon_amt_dec is not None else None,
        expected_intro_price=float(first_expected_dec) if first_expected_dec is not None else None,
        expected_renewal_price=float(expected_renewal_dec) if expected_renewal_dec is not None else None,
        stages=stages,
        eligibility_status=eligibility_status,
        eligibility_notes=eligibility_notes,
        comparison_outcome=comparison_outcome,
        comparison_notes=comparison_notes,
        discrepancy_amount=discrepancy_amount
    )
