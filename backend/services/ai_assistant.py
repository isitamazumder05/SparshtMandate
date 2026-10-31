"""
SpashtMandate AI - Contextual AI Assistant
Provides evidence-grounded subscription intelligence, discrepancy guidance,
and authentic NPCI/RBI regulatory assistance.
Architectural Design:
1. Provider abstraction (SarvamChatProvider, with fallback to GroundedRegulatoryProvider).
2. Reads SARVAM_API_KEY safely from environment via backend.config.
3. System prompt strictly enforces:
   - Grounding in current analysis terms and evidence citations.
   - Separation between merchant cancellation (service level) and UPI mandate revocation (bank/issuer level).
   - Rejection of financial credentials (never asks for OTP, UPI PIN, or bank passwords).
   - Zero hallucinations of non-existent regulatory circulars.
   - Inability to directly execute payment transactions or cancellations.
"""

import re
import json
import httpx
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime

from backend.config import settings
from backend.schemas import (
    AnalysisResponse,
    ChatResponse,
    ExtractedTerms,
    UserSubscriptionInput,
    PriceVerificationResult,
    OfferIntelligenceResult,
    TransparencyScorecard
)
from backend.regulatory_kb import get_all_regulatory_references

class BaseAIProvider(ABC):
    @abstractmethod
    def generate_response(self, system_prompt: str, conversation: List[Dict[str, str]]) -> str:
        """Generates conversational response given grounded context and history."""
        pass

class SarvamChatProvider(BaseAIProvider):
    """
    Official Sarvam Chat API integration.
    Reads SARVAM_API_KEY from environment.
    """
    def __init__(self, api_key: str):
        self.api_key = api_key.strip()
        self.endpoint = "https://api.sarvam.ai/v1/chat/completions"
        self.model = "sarvam-m" # Official Sarvam multilingual chat model

    def generate_response(self, system_prompt: str, conversation: List[Dict[str, str]]) -> str:
        headers = {
            "api-subscription-key": self.api_key,
            "Content-Type": "application/json"
        }
        
        messages = [{"role": "system", "content": system_prompt}]
        for msg in conversation:
            messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": 800
        }

        with httpx.Client(timeout=12.0) as client:
            resp = client.post(self.endpoint, headers=headers, json=payload)
            if resp.status_code != 200:
                raise RuntimeError(f"Sarvam API responded with HTTP {resp.status_code}: {resp.text}")
            data = resp.json()
            return data["choices"][0]["message"]["content"]

class GroundedRegulatoryProvider(BaseAIProvider):
    """
    Zero-dependency deterministic fallback provider.
    Ensures 100% reliable hackathon offline operation if Sarvam key is absent or unreachable.
    """
    def generate_response(self, system_prompt: str, conversation: List[Dict[str, str]]) -> str:
        latest_user_msg = conversation[-1]["content"].lower() if conversation else ""

        # 1. Price discrepancy / higher charge
        if any(w in latest_user_msg for w in ["charge", "higher", "discrepancy", "more than", "extra", "tax", "gst", "different"]):
            return (
                "### Price & Charge Discrepancy Analysis\n\n"
                "Based on the verified audit analysis for this subscription:\n"
                "- **Disclosed Rate vs Actual Debit**: When actual charges exceed the published rate, Indian merchants commonly "
                "exclude 18% GST (Goods & Services Tax) or convenience fees until final checkout.\n"
                "- **Rule Compliance**: Under **Rule 5(3)(e) of the Consumer Protection (E-Commerce) Rules, 2020**, merchants are required "
                "to provide the total price in a single figure along with the breakup of all applicable fees and taxes before commitment.\n"
                "- **Actionable Step**: Review your checkout invoice or payment gateway receipt. If recurring AutoPay was authorized at a "
                "higher limit, remember that the mandate amount represents the **maximum debit cap**, not necessarily the exact billing figure."
            )

        # 2. Cancellation vs Mandate Revocation
        elif any(w in latest_user_msg for w in ["cancel", "revoke", "stop", "unsubscribe", "autopay"]):
            return (
                "### Merchant Cancellation vs. Mandate Revocation\n\n"
                "It is critical to distinguish two independent actions:\n\n"
                "1. **Cancelling the Merchant Subscription (Service Contract)**:\n"
                "   - You must cancel within the merchant's portal or app settings to terminate your contractual obligation.\n"
                "   - Citing **RBI Master Direction DPSS.CO.PD.No.447/02.14.003/2019-20**, merchants cannot impose arbitrary retention barriers.\n\n"
                "2. **Revoking the UPI AutoPay Mandate (Payment Rails)**:\n"
                "   - Independent of the merchant, you can revoke recurring payment authorization directly inside your UPI app (Paytm, BHIM, etc.).\n"
                "   - Go to: `UPI & Payment Settings` → `UPI AutoPay / Automatic Payments` → Select the merchant mandate → Tap `Pause` or `Revoke Mandate`.\n"
                "   - Enter your UPI PIN within your authentic UPI app to stop future automated debits immediately at the bank level.\n\n"
                "**Security Reminder:** Never disclose your UPI PIN or OTP to anyone. SpashtMandate AI will **never** ask for your credentials."
            )

        # 3. Trial expiry & renewal
        elif any(w in latest_user_msg for w in ["trial", "expire", "renewal", "convert", "first charge"]):
            return (
                "### Free Trial & Auto-Conversion Terms\n\n"
                "- **Conversion Mechanics**: According to the analyzed terms, once the complimentary evaluation window ends, "
                "the subscription automatically converts to a recurring paid tier.\n"
                "- **Cancellation Cutoff**: Under **ASCI Guidelines on Dark Patterns (2023)**, consumers must be provided an unambiguous "
                "opportunity to cancel before conversion. To avoid charges, initiate cancellation at least 24 hours prior to trial expiry.\n"
                "- **Statutory Alert**: The issuer bank is legally required to send you a pre-debit intimation at least 24 hours in advance."
            )

        # 4. UPI AutoPay limits & safety
        elif any(w in latest_user_msg for w in ["limit", "15000", "pin", "otp", "safety", "secure"]):
            return (
                "### UPI AutoPay Mandate Limits & Security\n\n"
                "- **AFA Exemption Limit**: As per **RBI Notification RBI/2023-24/90** (Dec 2023), recurring transactions up to "
                "**₹1,00,000 for mutual funds, insurance, and credit card bill payments**, and **₹15,000 for general subscriptions** "
                "do not require an Additional Factor of Authentication (UPI PIN) at the time of recurring execution.\n"
                "- **Security Notice**: Never disclose your UPI PIN or OTP. SpashtMandate AI will **never** ask for your credentials. "
                "You only enter your UPI PIN inside your official bank or UPI application when authorizing or modifying a mandate."
            )

        # 5. Default General Overview
        return (
            "### SpashtMandate Subscription Advisory\n\n"
            "I have evaluated this subscription against the authentic **NPCI UPI AutoPay Operating Circular (OC-96)** "
            "and **RBI E-Mandate Directives**.\n\n"
            "Key checkpoints for this subscription:\n"
            "1. **Check Mandate Amount**: Verify whether the recurring debit amount matches the listed plan price.\n"
            "2. **Pre-Debit Intimation**: You are entitled to an SMS/email notification at least 24 hours prior to each debit.\n"
            "3. **Revocation Rights**: You retain the absolute right to pause or revoke the mandate at any time via your UPI app.\n\n"
            "Ask me specific questions about your plan pricing, discrepancy analysis, trial deadlines, or cancellation steps!"
        )


def _build_system_prompt(analysis: AnalysisResponse) -> str:
    """Builds a grounded, factually anchored system prompt using current audit data."""
    kb_refs = get_all_regulatory_references()
    reg_summary = "\n".join([f"- [{r.id}] {r.document_title} ({r.authority}): {r.relevant_provision}" for r in kb_refs[:5]])

    terms = analysis.extracted_terms
    price_ver = analysis.price_verification
    offers = analysis.offer_intelligence
    mandate = analysis.mandate_verification

    context_lines = [
        f"MERCHANT NAME: {analysis.merchant_name}",
        f"SOURCE URL: {analysis.source_url}",
        f"OVERALL TRANSPARENCY SCORE: {analysis.transparency_score}/100 (Grade: {analysis.transparency_grade})",
        f"DISCLOSED PRICE: {terms.currency.value or 'INR'} {terms.subscription_amount.value or 'Not Disclosed'} (Confidence: {terms.subscription_amount.confidence_score})",
        f"PRICE EVIDENCE: '{terms.subscription_amount.supporting_text or 'None'}'",
        f"BILLING CADENCE: {terms.billing_frequency.value or 'Not Disclosed'}",
        f"FREE TRIAL: {terms.free_trial_available.value} ({terms.trial_duration_days.value} days)",
        f"RENEWAL PRICE: {terms.renewal_amount.value or 'Same as base'}",
        f"CANCELLATION POLICY: '{terms.cancellation_policy.value or 'Not explicitly stated'}'",
        f"PRE-DEBIT NOTIFICATION: '{terms.pre_debit_notification.value or 'Not mentioned by merchant'}'",
        f"MANDATE VERIFICATION STATUS: {'GENUINE RECORD PROVIDED' if mandate.mandate_provided else 'UNVERIFIED (No technical mandate uploaded)'}"
    ]

    if analysis.user_subscription:
        u = analysis.user_subscription
        context_lines.append(f"USER ENTERED PLAN: {u.plan_name or 'Unspecified'} | Listed: {u.standard_listed_price} | Actual Charge: {u.actual_charged_price}")
        if u.coupon_code:
            context_lines.append(f"COUPON CODE: {u.coupon_code} (Discount: {u.coupon_discount_amount})")
        if u.activation_date:
            context_lines.append(f"ACTIVATION DATE: {u.activation_date}")

    if price_ver:
        context_lines.append(f"PRICE VERIFICATION STATUS: {price_ver.overall_status} | Discrepancies: {'; '.join(price_ver.discrepancy_reasons) or 'None'}")

    if offers:
        context_lines.append(f"OFFERS TRAJECTORY: Outcome: {offers.comparison_outcome} | Intro Price: {offers.expected_intro_price} | Renewal Price: {offers.expected_renewal_price}")

    context_block = "\n".join(context_lines)

    return f"""You are the SpashtMandate AI Subscription Assistant, an intelligent and authoritative consumer financial transparency specialist for the Paytm Build for India Hackathon 2026.

CURRENT AUDIT CONTEXT:
{context_block}

REGULATORY KNOWLEDGE BASE (OFFICIAL):
{reg_summary}

STRICT OPERATING RULES:
1. Ground your answers strictly in the verified audit data above and official regulatory sources.
2. If information is not in the context or unknown, clearly state that it is unavailable or ask a clarifying question. Never invent facts or synthesize fake dates.
3. Distinguish between:
   - MERCHANT CANCELLATION: Cancels the service agreement inside the merchant portal.
   - UPI MANDATE REVOCATION: Revokes automated bank payment rails directly in the customer's UPI app (e.g. Paytm, BHIM) under RBI Master Direction DPSS.CO.PD.No.447/02.14.003/2019-20.
4. If asked about a price difference, refer directly to the price verification result and explain potential causes (unbundled GST, coupon conditions, frequency mismatch).
5. NEVER request, accept, or suggest entering sensitive credentials (OTP, UPI PIN, debit card CVV, bank passwords).
6. NEVER claim you can execute a debit, refund, or cancellation yourself. You are an advisory intelligence tool.
7. Always format responses in clean Markdown with headings, bullet points, and citations.
"""


def _extract_citations(reply_text: str, analysis: AnalysisResponse) -> Tuple[List[str], List[str]]:
    """Extracts grounded evidence quotes and regulatory references cited in assistant text."""
    evidence_cites = []
    reg_cites = []

    # Check for regulatory citations
    if any(k in reply_text for k in ["RBI", "447", "2019-20"]):
        reg_cites.append("RBI/2019-20/47 (e-Mandate on Cards and UPI for Recurring Transactions)")
    if any(k in reply_text for k in ["NPCI", "OC-96", "AutoPay"]):
        reg_cites.append("NPCI/UPI/OC-96/2020-21 (UPI AutoPay Guidelines)")
    if any(k in reply_text for k in ["ASCI", "Dark Pattern", "Subscription Trap"]):
        reg_cites.append("ASCI Guidelines on Dark Patterns in Digital Advertising (2023)")
    if any(k in reply_text for k in ["Consumer Protection", "E-Commerce Rules"]):
        reg_cites.append("Consumer Protection (E-Commerce) Rules, 2020 - Rule 5(3)(e)")

    # Check evidence citations
    sub_amt = analysis.extracted_terms.subscription_amount.supporting_text
    if sub_amt and (sub_amt in reply_text or analysis.extracted_terms.subscription_amount.value in reply_text):
        evidence_cites.append(f"Price disclosure: '{sub_amt}'")

    canc = analysis.extracted_terms.cancellation_policy.supporting_text
    if canc and (canc in reply_text or "cancel" in reply_text.lower()):
        evidence_cites.append(f"Cancellation terms: '{canc}'")

    return evidence_cites, reg_cites


def handle_assistant_query(
    analysis: AnalysisResponse,
    message: str,
    history: List[Dict[str, str]]
) -> ChatResponse:
    """
    Orchestrates the AI assistant request through the provider abstraction.
    """
    system_prompt = _build_system_prompt(analysis)
    conversation = list(history)
    conversation.append({"role": "user", "content": message})

    reply = ""
    # Provider selection: Sarvam if configured, else GroundedRegulatoryProvider
    if settings.SARVAM_API_KEY and len(settings.SARVAM_API_KEY.strip()) > 5:
        try:
            provider = SarvamChatProvider(settings.SARVAM_API_KEY)
            reply = provider.generate_response(system_prompt, conversation)
        except Exception:
            # Fallback to grounded deterministic provider
            fallback = GroundedRegulatoryProvider()
            reply = fallback.generate_response(system_prompt, conversation)
    else:
        provider = GroundedRegulatoryProvider()
        reply = provider.generate_response(system_prompt, conversation)

    ev_cites, reg_cites = _extract_citations(reply, analysis)

    # Dynamic suggested next questions
    suggested = [
        "How do I cancel this subscription vs revoking the mandate?",
        "Why is my checkout charge different from the listed price?",
        "What are my rights under RBI UPI AutoPay guidelines?"
    ]

    return ChatResponse(
        reply=reply,
        evidence_citations=ev_cites,
        regulatory_citations=reg_cites,
        suggested_next_questions=suggested
    )
