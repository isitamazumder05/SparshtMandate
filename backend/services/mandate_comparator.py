"""
SpashtMandate AI - UPI AutoPay Mandate Comparison Engine
Implements authentic comparison between disclosed merchant terms and actual UPI AutoPay mandate records.
Strict Rule: If no genuine mandate record is supplied, NO fake data is generated.
Displays transparent 'Unavailable / Not Provided' status.
"""

from typing import Optional, List
from backend.schemas import (
    ExtractedTerms,
    MandateRecordInput,
    MandateVerificationResult,
    MandateComparisonItem
)

def compare_mandate_with_disclosure(
    terms: ExtractedTerms,
    mandate: Optional[MandateRecordInput]
) -> MandateVerificationResult:
    """
    Compares disclosed terms with an authorized mandate record.
    Strictly distinguishes:
    - VERIFIED: Genuine authorized mandate data was supplied and compared.
    - SIMULATED: User is testing with simulated mandate parameters.
    - UNVERIFIED: No genuine mandate configuration was provided.
    Never claims bank-level verification from a public merchant webpage.
    """
    if not mandate or (
        not mandate.mandate_amount and
        not mandate.frequency and
        not mandate.umin and
        not mandate.merchant_name
    ):
        return MandateVerificationResult(
            mandate_provided=False,
            verification_status="UNVERIFIED",
            status_summary="Actual UPI AutoPay mandate configuration has not been provided. Mandate verification is currently unavailable.",
            mandate_record=None,
            comparison_items=[],
            risk_indicator="UNVERIFIED"
        )

    # Genuine or test mandate provided by user/auditor
    is_sim = getattr(mandate, "is_simulated", False)
    verification_status = "SIMULATED" if is_sim else "VERIFIED"
    items: List[MandateComparisonItem] = []
    has_mismatch = False
    has_warning = False

    # 1. Compare Merchant Name
    disclosed_m = terms.merchant_name.value or "Unknown"
    mandate_m = mandate.merchant_name or "Not Specified"
    if mandate.merchant_name:
        if disclosed_m.lower() in mandate_m.lower() or mandate_m.lower() in disclosed_m.lower():
            m_status = "MATCH"
            notes = "Merchant name in mandate matches or contains disclosed merchant brand."
        else:
            m_status = "REVIEW"
            has_warning = True
            notes = f"Mandate payee ('{mandate_m}') differs from disclosed merchant name ('{disclosed_m}'). Check corporate entity."
    else:
        m_status = "NOT_VERIFIED"
        notes = "Merchant name not provided in mandate payload."
    items.append(MandateComparisonItem(
        parameter="Merchant Identity",
        disclosed_value=disclosed_m,
        actual_mandate_value=mandate_m,
        status=m_status,
        notes=notes
    ))

    # 2. Compare Amount
    disclosed_amt = terms.subscription_amount.value
    mandate_amt = mandate.mandate_amount
    if disclosed_amt and mandate_amt:
        try:
            d_val = float(str(disclosed_amt).replace(",", "").replace("₹", "").strip())
            m_val = float(str(mandate_amt).replace(",", "").replace("₹", "").strip())
            if m_val == d_val:
                a_status = "MATCH"
                notes = f"Exact match: Disclosed ₹{d_val} equals authorized mandate amount ₹{m_val}."
            elif m_val > d_val:
                a_status = "REVIEW"
                has_warning = True
                notes = (
                    f"Mandate cap (₹{m_val}) exceeds disclosed subscription price (₹{d_val}). "
                    "In UPI AutoPay, merchants often set a higher ceiling cap to allow flexibility, "
                    "but customer must be aware."
                )
            else:
                a_status = "MISMATCH"
                has_mismatch = True
                notes = f"Mandate cap (₹{m_val}) is lower than disclosed price (₹{d_val}). Mandate execution will fail."
        except ValueError:
            a_status = "REVIEW"
            notes = f"Could not perform exact numeric parse on '{disclosed_amt}' vs '{mandate_amt}'."
    elif mandate_amt:
        a_status = "NOT_VERIFIED"
        notes = "Disclosed subscription amount was missing from webpage; cannot compare."
    else:
        a_status = "NOT_VERIFIED"
        notes = "Mandate amount not provided."
    items.append(MandateComparisonItem(
        parameter="Recurring Debit Amount",
        disclosed_value=f"₹{disclosed_amt}" if disclosed_amt else "Not Disclosed",
        actual_mandate_value=f"₹{mandate_amt}" if mandate_amt else "Not Provided",
        status=a_status,
        notes=notes
    ))

    # 3. Compare Frequency
    disclosed_freq = terms.billing_frequency.value
    mandate_freq = mandate.frequency
    if disclosed_freq and mandate_freq:
        if disclosed_freq.lower() in mandate_freq.lower() or mandate_freq.lower() in disclosed_freq.lower():
            f_status = "MATCH"
            notes = f"Billing frequency '{disclosed_freq}' aligns with mandate cadence '{mandate_freq}'."
        elif "as & when presented" in mandate_freq.lower() or "as presented" in mandate_freq.lower():
            f_status = "REVIEW"
            has_warning = True
            notes = "Mandate is configured as 'As & when presented' (on-demand), allowing debits at irregular intervals."
        else:
            f_status = "MISMATCH"
            has_mismatch = True
            notes = f"Disclosed frequency '{disclosed_freq}' contradicts mandate schedule '{mandate_freq}'."
    elif mandate_freq:
        f_status = "NOT_VERIFIED"
        notes = "Disclosed billing cadence was not found on webpage."
    else:
        f_status = "NOT_VERIFIED"
        notes = "Mandate frequency not supplied."
    items.append(MandateComparisonItem(
        parameter="Billing Frequency Cadence",
        disclosed_value=disclosed_freq or "Not Disclosed",
        actual_mandate_value=mandate_freq or "Not Provided",
        status=f_status,
        notes=notes
    ))

    # 4. Mandate Validity & Identifier
    items.append(MandateComparisonItem(
        parameter="Mandate Reference (UMIN)",
        disclosed_value="Created at Checkout",
        actual_mandate_value=mandate.umin or "Not Supplied",
        status="MATCH" if mandate.umin else "REVIEW",
        notes="Unique Mandate Identifier Number (UMIN) registered with NPCI." if mandate.umin else "Mandate UMIN reference is pending registration."
    ))

    if has_mismatch:
        risk = "DANGER"
        summary = "Discrepancy Detected: Actual mandate parameters differ from merchant webpage disclosures."
    elif has_warning:
        risk = "WARNING"
        summary = "Mandate Reviewed: Parameters are functional but contain variations (e.g. maximum cap or corporate entity name)."
    else:
        risk = "SAFE"
        summary = "Mandate Aligned: Authorized UPI AutoPay parameters match disclosed subscription terms."

    if is_sim:
        summary = "SIMULATED TEST DATA — NO REAL PAYMENT OR BANK MANDATE ACCESSED."

    return MandateVerificationResult(
        mandate_provided=True,
        verification_status=verification_status,
        status_summary=summary,
        mandate_record=mandate,
        comparison_items=items,
        risk_indicator=risk
    )
