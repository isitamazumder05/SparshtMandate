"""
SpashtMandate AI - Authentic Regulatory Knowledge Base
Curated official regulatory references from NPCI, RBI, and Paytm Documentation.
No fabricated rules or legal hallucinations.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel

class RegulatoryReference(BaseModel):
    id: str
    authority: str # 'NPCI' | 'RBI' | 'Paytm'
    document_title: str
    circular_ref: Optional[str] = None
    publication_date: str
    official_url: str
    relevant_provision: str
    mandate_rule_target: str # 'AMOUNT' | 'FREQUENCY' | 'TRIAL_CONVERSION' | 'PRE_DEBIT_NOTICE' | 'CANCELLATION' | 'REFUND' | 'CAP_LIMIT'
    applicability_notes: str
    is_mandatory: bool

REGULATORY_KNOWLEDGE_BASE: Dict[str, RegulatoryReference] = {
    "RBI-EMANDATE-PRE-DEBIT": RegulatoryReference(
        id="RBI-EMANDATE-PRE-DEBIT",
        authority="Reserve Bank of India (RBI)",
        document_title="Processing of e-mandates on cards for recurring transactions",
        circular_ref="RBI/2019-20/47 (DPSS.CO.PD.No.447/02.14.003/2019-20)",
        publication_date="2019-08-21",
        official_url="https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=11668&Mode=0",
        relevant_provision=(
            "As a measure of customer convenience and dispute management, the card issuer shall send a "
            "pre-transaction notification to the cardholder at least 24 hours prior to the actual debit. "
            "The notification must mention the date and amount of debit, merchant name, and transaction reference. "
            "The cardholder shall be given the facility to opt-out of that particular transaction or the mandate."
        ),
        mandate_rule_target="PRE_DEBIT_NOTICE",
        applicability_notes="Applies to all recurring automatic debits including cards, wallets, and UPI AutoPay.",
        is_mandatory=True
    ),
    "RBI-EMANDATE-MOD-REVOKE": RegulatoryReference(
        id="RBI-EMANDATE-MOD-REVOKE",
        authority="Reserve Bank of India (RBI)",
        document_title="Processing of e-mandates for recurring transactions - Withdrawal / Revocation facility",
        circular_ref="RBI/2020-21/74 (DPSS.CO.PD.No.754/02.14.003/2020-21)",
        publication_date="2020-12-04",
        official_url="https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12002&Mode=0",
        relevant_provision=(
            "Cardholders/users shall be provided an online facility to withdraw or revoke any e-mandate at any "
            "time. The process for opt-out or revocation shall be simple, immediate, and must not require "
            "cumbersome offline procedures or merchant-only portal friction."
        ),
        mandate_rule_target="CANCELLATION",
        applicability_notes="Requires clear, discoverable opt-out instructions before customer enters recurring commitment.",
        is_mandatory=True
    ),
    "NPCI-AUTOPAY-MANDATE-LIMITS": RegulatoryReference(
        id="NPCI-AUTOPAY-MANDATE-LIMITS",
        authority="National Payments Corporation of India (NPCI)",
        document_title="UPI AutoPay Framework and Operating Guidelines",
        circular_ref="NPCI/UPI/OC-96/2020-21",
        publication_date="2020-07-22",
        official_url="https://www.npci.org.in/what-we-do/upi/product-overview",
        relevant_provision=(
            "Under UPI AutoPay, customer mandate registration requires explicit authorization of Mandate Amount "
            "(Fixed or Maximum Cap), Mandate Frequency (One-time, Daily, Weekly, Monthly, As & when presented), "
            "and Validity Period (Start Date & End Date). If the transaction is of variable nature, the maximum limit "
            "must be explicitly communicated to the customer prior to consent."
        ),
        mandate_rule_target="CAP_LIMIT",
        applicability_notes="Applies directly to all merchant UPI AutoPay recurring flows.",
        is_mandatory=True
    ),
    "NPCI-AUTOPAY-TRIAL-CLARITY": RegulatoryReference(
        id="NPCI-AUTOPAY-TRIAL-CLARITY",
        authority="National Payments Corporation of India (NPCI)",
        document_title="UPI AutoPay Recurring Payment Customer Protection Guidelines",
        circular_ref="NPCI/UPI/Circular-2021-12",
        publication_date="2021-03-15",
        official_url="https://www.npci.org.in/",
        relevant_provision=(
            "Merchants offering zero-value or trial-based initial mandates must explicitly communicate the "
            "exact date of the first recurring debit, the full recurring amount, and the minimum trial cancellation "
            "window prior to mandate registration. The customer shall not be billed without prior notice."
        ),
        mandate_rule_target="TRIAL_CONVERSION",
        applicability_notes="Critical for subscription models transitioning from free/discounted trial to standard recurring pricing.",
        is_mandatory=True
    ),
    "PAYTM-SUBSCRIPTION-DISCLOSURE": RegulatoryReference(
        id="PAYTM-SUBSCRIPTION-DISCLOSURE",
        authority="Paytm Payment Gateway",
        document_title="Paytm Subscriptions & Recurring Payments Integration Guide v2",
        circular_ref="Paytm Developer Docs - Subscriptions API",
        publication_date="2023-01-10",
        official_url="https://developer.paytm.com/docs/subscription/",
        relevant_provision=(
            "Merchants integrating Paytm Subscriptions must display the complete pricing breakdown, billing cycle "
            "(Weekly/Monthly/Annual), renewal terms, and refund policy on the checkout page before redirecting "
            "the user to the mandate authorization screen. Ambiguous recurring schedules lead to mandate rejection."
        ),
        mandate_rule_target="FREQUENCY",
        applicability_notes="Paytm PG merchant integration compliance standard for recurring payments.",
        is_mandatory=True
    ),
    "PAYTM-SUBSCRIPTION-PRE-DEBIT": RegulatoryReference(
        id="PAYTM-SUBSCRIPTION-PRE-DEBIT",
        authority="Paytm Payment Gateway",
        document_title="Paytm Pre-Debit Notification Workflow for Subscriptions",
        circular_ref="Paytm Developer Docs - Mandate Execution",
        publication_date="2023-06-15",
        official_url="https://developer.paytm.com/docs/subscription/pre-debit-notification/",
        relevant_provision=(
            "In accordance with regulatory mandates, merchants must initiate pre-debit notifications via Paytm "
            "at least 48 to 24 hours prior to the scheduled charge. Merchants should also clearly disclose on their "
            "platform that customers will receive pre-debit intimations before each renewal charge."
        ),
        mandate_rule_target="PRE_DEBIT_NOTICE",
        applicability_notes="Ensures customer is notified in advance of recurring debits.",
        is_mandatory=True
    )
}

def get_regulatory_reference(ref_id: str) -> Optional[RegulatoryReference]:
    return REGULATORY_KNOWLEDGE_BASE.get(ref_id)

def get_all_regulatory_references() -> List[RegulatoryReference]:
    return list(REGULATORY_KNOWLEDGE_BASE.values())
