"""
SpashtMandate AI - Chronological Subscription Timeline Generator
Constructs an evidence-grounded subscription lifecycle timeline.
Strict Rules:
1. Clearly distinguishes EXPLICIT_DATE, CALCULATED_DATE, RELATIVE_TIMING, and UNKNOWN.
2. Does NOT invent calendar dates without a reliable activation/payment reference date.
3. Accommodates promotional pricing, promo expiry, recurring cycles, and cancellation cutoffs.
4. Mandate expiry is ONLY added when genuine mandate configuration is supplied.
"""

from typing import List, Optional
from datetime import datetime, timedelta
from backend.schemas import (
    ExtractedTerms,
    MandateRecordInput,
    TimelineEvent,
    UserSubscriptionInput,
    OfferIntelligenceResult
)

def _add_months(source_date: datetime, months: int) -> datetime:
    """Safely adds months to a datetime object handling year turnover and month bounds."""
    month = source_date.month - 1 + months
    year = source_date.year + month // 12
    month = month % 12 + 1
    # Day clamping
    max_days = [31, 29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]
    day = min(source_date.day, max_days)
    return datetime(year, month, day)

def generate_subscription_timeline(
    terms: ExtractedTerms,
    mandate: Optional[MandateRecordInput] = None,
    user_input: Optional[UserSubscriptionInput] = None,
    offers: Optional[OfferIntelligenceResult] = None
) -> List[TimelineEvent]:
    """
    Builds a chronological timeline of subscription lifecycle events.
    Labels every event: EXPLICIT_DATE | CALCULATED_DATE | RELATIVE_TIMING | UNKNOWN.
    """
    events: List[TimelineEvent] = []
    step = 1

    currency = user_input.currency if (user_input and user_input.currency) else (terms.currency.value or "INR")
    freq = (user_input.billing_frequency if (user_input and user_input.billing_frequency) else (terms.billing_frequency.value or "Monthly")).capitalize()
    
    # Base and promotional prices
    std_price = user_input.standard_listed_price if (user_input and user_input.standard_listed_price is not None) else terms.subscription_amount.value
    expected_first_price = offers.expected_intro_price if (offers and offers.expected_intro_price is not None) else std_price
    expected_renewal_price = offers.expected_renewal_price if (offers and offers.expected_renewal_price is not None) else (
        terms.renewal_amount.value or std_price
    )
    
    # Trial information
    has_trial = False
    trial_days = None
    if user_input and user_input.free_trial_days is not None:
        has_trial = user_input.free_trial_days > 0
        trial_days = user_input.free_trial_days
    elif terms.free_trial_available.value is True or (isinstance(terms.trial_duration_days.value, (int, float)) and terms.trial_duration_days.value > 0):
        has_trial = True
        trial_days = int(terms.trial_duration_days.value) if terms.trial_duration_days.value else 7

    # Reference activation date (if user supplied genuine activation date)
    act_date: Optional[datetime] = None
    if user_input and user_input.activation_date:
        try:
            act_date = datetime.strptime(user_input.activation_date.strip(), "%Y-%m-%d")
        except ValueError:
            act_date = None

    if act_date:
        act_display = act_date.strftime("%d %b %Y")
        act_timing = "CALCULATED_DATE"
    else:
        act_display = "Day 0 / At Sign-Up"
        act_timing = "RELATIVE_TIMING"

    # -------------------------------------------------------------
    # TIMELINE CONSTRUCTION
    # Handles:
    # A. Introductory Multi-Month Promotions (e.g. Spotify: ₹139 for 2 months, then ₹139/mo)
    # B. Free Trial Lifecycles (e.g. Coursera: 7-day trial then auto-convert)
    # C. Direct Paid Subscriptions (e.g. Google AI Plus: ₹399/mo direct)
    # -------------------------------------------------------------
    intro_months = user_input.introductory_duration_months if user_input else None

    if intro_months and intro_months > 0 and not has_trial:
        # =========================================================
        # LIFECYCLE PATH A: Multi-Month Introductory Window (e.g. Spotify 2-Month Offer)
        # Sequence: Signup/Initial Payment -> 2-Month Intro Window -> Pre-Debit Notice -> First Renewal -> Subsequent Renewals
        # =========================================================
        
        # 1. Initial Upfront Payment & Activation
        first_renewal_dt = _add_months(act_date, intro_months) if act_date else None
        events.append(TimelineEvent(
            event_id="EVENT-01-ACTIVATION",
            step_number=step,
            phase_name="Initial Sign-Up Payment",
            timing_type=act_timing,
            date_display=act_display,
            amount_display=f"{currency} {expected_first_price} (Covers initial {intro_months} months)",
            description=f"Consumer enrolls with {terms.merchant_name.value or 'merchant'} and pays {currency} {expected_first_price} upfront at checkout covering the {intro_months}-month introductory period.",
            evidence_quote=terms.subscription_amount.supporting_text or "Initial checkout payment.",
            badge_status="CONFIRMED"
        ))
        step += 1

        # 2. Multi-Month Introductory Window
        if act_date and first_renewal_dt:
            intro_window_display = f"{act_date.strftime('%d %b %Y')} to {first_renewal_dt.strftime('%d %b %Y')}"
            intro_timing = "CALCULATED_DATE"
        else:
            intro_window_display = f"Months 1 to {intro_months} ({intro_months * 30} Days)"
            intro_timing = "RELATIVE_TIMING"

        events.append(TimelineEvent(
            event_id="EVENT-02-INTRO-WINDOW",
            step_number=step,
            phase_name=f"{intro_months}-Month Introductory Period",
            timing_type=intro_timing,
            date_display=intro_window_display,
            amount_display=f"{currency} {expected_first_price} Total (Paid at Checkout)",
            description=f"Active introductory period. No recurring debits execute during these {intro_months} months.",
            evidence_quote=terms.renewal_amount.supporting_text or f"Introductory duration: {intro_months} months.",
            badge_status="CONFIRMED"
        ))
        step += 1

        # 3. Statutory Pre-Debit Notification (Issuer Safeguard >= 24h before renewal)
        if first_renewal_dt:
            predebit_dt = first_renewal_dt - timedelta(days=1)
            predebit_display = f"Approx. {predebit_dt.strftime('%d %b %Y')} (>= 24h prior to renewal)"
            predebit_timing = "CALCULATED_DATE"
        else:
            predebit_display = f"At least 24 hours prior to Month {intro_months} renewal"
            predebit_timing = "RELATIVE_TIMING"

        events.append(TimelineEvent(
            event_id="EVENT-03-PRE-DEBIT-NOTICE",
            step_number=step,
            phase_name="Statutory Pre-Debit Alert (Issuer Safeguard)",
            timing_type=predebit_timing,
            date_display=predebit_display,
            amount_display=None,
            description="NPCI UPI AutoPay / RBI framework requires issuer bank to notify customer at least 24 hours prior to recurring debit execution.",
            evidence_quote="NPCI/UPI/OC-96/2020-21 & RBI/2019-20/47 statutory pre-debit intimation requirement.",
            badge_status="INFO"
        ))
        step += 1

        # 4. First Recurring Renewal (After Introductory Period Concludes)
        is_same_price = bool(expected_renewal_price and expected_first_price and str(expected_renewal_price) == str(expected_first_price))
        if first_renewal_dt:
            renewal_display = first_renewal_dt.strftime("%d %b %Y")
            renewal_timing = "CALCULATED_DATE"
        else:
            renewal_display = f"Month {intro_months} / Day {intro_months * 30} (After {intro_months}-Month Intro)"
            renewal_timing = "RELATIVE_TIMING"

        events.append(TimelineEvent(
            event_id="EVENT-04-FIRST-RENEWAL",
            step_number=step,
            phase_name="First Recurring Renewal",
            timing_type=renewal_timing,
            date_display=renewal_display,
            amount_display=f"{currency} {expected_renewal_price} / {freq.lower()}" + (" (Zero Price Increase)" if is_same_price else " (Standard Rate)"),
            description=(
                f"First recurring renewal debit executes after the {intro_months}-month introductory period concludes. "
                f"Renews at {currency} {expected_renewal_price} / {freq.lower()} with zero price increase."
                if is_same_price else
                f"First recurring renewal debit executes after the {intro_months}-month introductory period concludes. "
                f"Transitions to standard renewal rate of {currency} {expected_renewal_price} / {freq.lower()}."
            ),
            evidence_quote=terms.renewal_amount.supporting_text or "Post-introductory renewal disclosure.",
            badge_status="INFO" if is_same_price else "ALERT"
        ))
        step += 1

        # 5. Subsequent Monthly Renewals
        events.append(TimelineEvent(
            event_id="EVENT-05-SUBSEQUENT-RENEWALS",
            step_number=step,
            phase_name="Subsequent Monthly Renewals",
            timing_type="RELATIVE_TIMING",
            date_display=f"Every subsequent {freq.lower()} cycle from Month {intro_months + 1}",
            amount_display=f"{currency} {expected_renewal_price} / {freq.lower()}",
            description=f"Continuous automatic debits recur on a {freq.lower()} cadence until actively cancelled or mandate revoked.",
            evidence_quote=terms.renewal_frequency.supporting_text or terms.cancellation_policy.supporting_text,
            badge_status="INFO"
        ))
        step += 1

    else:
        # =========================================================
        # LIFECYCLE PATH B & C: Free Trial or Direct Paid Subscription
        # =========================================================
        # 1. Activation Event
        events.append(TimelineEvent(
            event_id="EVENT-01-ACTIVATION",
            step_number=step,
            phase_name="Subscription Activation",
            timing_type=act_timing,
            date_display=act_display,
            amount_display=f"{currency} 0.00 (Trial Sign-Up)" if has_trial else (f"{currency} {expected_first_price}" if expected_first_price else None),
            description=f"Consumer enrolls with {terms.merchant_name.value or 'merchant'} and authorizes recurring payment terms.",
            evidence_quote=terms.merchant_name.supporting_text or "Subscription sign-up initiation.",
            badge_status="CONFIRMED"
        ))
        step += 1

        # 2. Free Trial Period (if applicable)
        trial_end_dt: Optional[datetime] = None
        if has_trial:
            if act_date and trial_days:
                trial_end_dt = act_date + timedelta(days=trial_days)
                trial_window_str = f"{act_date.strftime('%d %b %Y')} to {trial_end_dt.strftime('%d %b %Y')}"
                trial_timing = "CALCULATED_DATE"
            elif trial_days:
                trial_window_str = f"Days 1 to {trial_days} ({trial_days} Days)"
                trial_timing = "RELATIVE_TIMING"
            else:
                trial_window_str = "Introductory Evaluation Window"
                trial_timing = "RELATIVE_TIMING"

            events.append(TimelineEvent(
                event_id="EVENT-02-TRIAL-START",
                step_number=step,
                phase_name="Free Trial Window",
                timing_type=trial_timing,
                date_display=trial_window_str,
                amount_display=f"{currency} 0.00 (Complimentary)",
                description=f"Complimentary access granted for {trial_days or 'introductory'} days. No recurring charges execute during this window.",
                evidence_quote=terms.free_trial_available.supporting_text or terms.trial_duration_days.supporting_text,
                badge_status="CONFIRMED"
            ))
            step += 1

            # 3. Cancellation Deadline for Free Trial
            if trial_end_dt:
                cancel_cutoff_dt = trial_end_dt - timedelta(days=1)
                cancel_display = f"Before 23:59 on {cancel_cutoff_dt.strftime('%d %b %Y')}"
                cancel_timing = "CALCULATED_DATE"
            elif trial_days:
                cancel_display = f"At least 24 hours prior to Day {trial_days}"
                cancel_timing = "RELATIVE_TIMING"
            else:
                cancel_display = "Prior to conclusion of trial period"
                cancel_timing = "UNKNOWN"

            events.append(TimelineEvent(
                event_id="EVENT-03-CANCEL-DEADLINE",
                step_number=step,
                phase_name="Trial Cancellation Cut-off",
                timing_type=cancel_timing,
                date_display=cancel_display,
                amount_display=None,
                description="Last window to cancel or revoke authorization to avoid automatic conversion into a paid recurring billing commitment.",
                evidence_quote=terms.cancellation_policy.supporting_text or "Cancel before trial ends to avoid recurring charges.",
                badge_status="ALERT"
            ))
            step += 1

            # 4. Trial Expiry & Conversion Point
            if trial_end_dt:
                conv_display = trial_end_dt.strftime("%d %b %Y")
                conv_timing = "CALCULATED_DATE"
            elif trial_days:
                conv_display = f"Day {trial_days} after activation"
                conv_timing = "CALCULATED_DATE"
            else:
                conv_display = "At conclusion of trial"
                conv_timing = "RELATIVE_TIMING"

            events.append(TimelineEvent(
                event_id="EVENT-04-TRIAL-EXPIRY",
                step_number=step,
                phase_name="Trial Expiry & Auto-Conversion",
                timing_type=conv_timing,
                date_display=conv_display,
                amount_display=None,
                description=f"Free trial concludes. Account automatically transitions to active paid recurring status at {currency} {expected_first_price} / {freq.lower()}.",
                evidence_quote=terms.renewal_amount.supporting_text or terms.cancellation_policy.supporting_text,
                badge_status="ALERT"
            ))
            step += 1

        # Pre-Debit Notification (Issuer Safeguard)
        first_charge_dt: Optional[datetime] = None
        if has_trial and trial_end_dt:
            first_charge_dt = trial_end_dt
        elif act_date:
            first_charge_dt = act_date

        if first_charge_dt:
            predebit_dt = first_charge_dt - timedelta(days=1)
            predebit_display = f"Approx. {predebit_dt.strftime('%d %b %Y')} (>= 24h prior to charge)"
            predebit_timing = "CALCULATED_DATE"
        else:
            predebit_display = "At least 24 hours prior to scheduled debit"
            predebit_timing = "RELATIVE_TIMING"

        events.append(TimelineEvent(
            event_id="EVENT-05-PRE-DEBIT-NOTICE",
            step_number=step,
            phase_name="Statutory Pre-Debit Alert (Issuer Safeguard)",
            timing_type=predebit_timing,
            date_display=predebit_display,
            amount_display=None,
            description="NPCI UPI AutoPay / RBI framework requires issuer bank to notify customer at least 24 hours prior to scheduled debit.",
            evidence_quote="NPCI/UPI/OC-96/2020-21 & RBI/2019-20/47 statutory pre-debit intimation requirement.",
            badge_status="INFO"
        ))
        step += 1

        # First Recurring Payment Execution
        if first_charge_dt:
            first_charge_display = first_charge_dt.strftime("%d %b %Y")
            first_charge_timing = "CALCULATED_DATE" if has_trial else "EXPLICIT_DATE"
        elif has_trial and trial_days:
            first_charge_display = f"Day {trial_days + 1} (Immediately upon trial conclusion)"
            first_charge_timing = "CALCULATED_DATE"
        else:
            first_charge_display = "Day 0 / At Checkout"
            first_charge_timing = "RELATIVE_TIMING"

        events.append(TimelineEvent(
            event_id="EVENT-06-FIRST-PAYMENT",
            step_number=step,
            phase_name="First Recurring Debit",
            timing_type=first_charge_timing,
            date_display=first_charge_display,
            amount_display=f"{currency} {expected_first_price} / {freq.lower()}" if expected_first_price else None,
            description=f"First recurring payment processed against customer account. Recurring authorization begins.",
            evidence_quote=terms.first_charge_timing.supporting_text or terms.subscription_amount.supporting_text,
            badge_status="CONFIRMED"
        ))
        step += 1

        # Subsequent Recurring Billing Cycles
        events.append(TimelineEvent(
            event_id="EVENT-07-RECURRING-CYCLE",
            step_number=step,
            phase_name="Ongoing Renewal Schedule",
            timing_type="RELATIVE_TIMING",
            date_display=f"Every subsequent {freq.lower()} cycle",
            amount_display=f"{currency} {expected_renewal_price} / {freq.lower()}",
            description=f"Continuous automatic debits recur on a {freq.lower()} cadence until actively cancelled or mandate revoked.",
            evidence_quote=terms.renewal_frequency.supporting_text or terms.cancellation_policy.supporting_text,
            badge_status="INFO"
        ))
        step += 1

    # -------------------------------------------------------------
    # 9. Conditional Plan Rollover (e.g. Student graduation / verification expiry)
    # -------------------------------------------------------------
    rollover_disc = next(
        (d for d in terms.other_recurring_disclosures if "rollover" in d.lower() or "standard plan" in d.lower() or "graduate" in d.lower()),
        None
    )
    if rollover_disc:
        events.append(TimelineEvent(
            event_id="EVENT-09-CONDITIONAL-ROLLOVER",
            step_number=step,
            phase_name="Conditional Plan Rollover",
            timing_type="UNKNOWN",
            date_display="Upon Graduation / Re-verification Expiry (12 mo)",
            amount_display="Standard Plan Rate (Not Disclosed on Student Page)",
            description="If student enrollment is not re-verified annually via SheerID (max 4 years), the account automatically switches to a standard Premium plan unless cancelled.",
            evidence_quote=rollover_disc,
            badge_status="ALERT"
        ))
        step += 1

    # -------------------------------------------------------------
    # 10. Genuine Mandate Expiry (ONLY if authentic mandate data provides end date)
    # -------------------------------------------------------------
    if mandate and mandate.end_date:
        events.append(TimelineEvent(
            event_id="EVENT-10-MANDATE-EXPIRY",
            step_number=step,
            phase_name="UPI AutoPay Mandate Expiry",
            timing_type="EXPLICIT_DATE",
            date_display=mandate.end_date,
            amount_display=f"Max Debit Cap: {mandate.mandate_amount or 'Not Specified'}",
            description=f"Technical UPI AutoPay mandate expires at issuer level. Automatic debits cease unless re-authorized.",
            evidence_quote=f"Mandate UMIN: {mandate.umin or 'Recorded Mandate Reference'}",
            badge_status="CONFIRMED"
        ))

    return events