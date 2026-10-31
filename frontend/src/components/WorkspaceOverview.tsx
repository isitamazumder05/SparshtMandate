import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ExternalLink,
  Tag,
  Clock,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { AnalysisResponse } from '../types';

interface WorkspaceOverviewProps {
  analysis: AnalysisResponse;
  onNavigateTab: (tabId: string) => void;
  onOpenRegulatoryDocs: () => void;
}

export const WorkspaceOverview: React.FC<WorkspaceOverviewProps> = ({
  analysis,
  onNavigateTab,
  onOpenRegulatoryDocs
}) => {
  const {
    merchant_name,
    source_url,
    analyzed_at,
    transparency_score,
    transparency_grade,
    verification_coverage_pct,
    extracted_terms,
    findings,
    timeline,
    mandate_verification,
    price_verification,
    offer_intelligence,
    scorecard,
    ai_recommendations,
    user_subscription
  } = analysis;

  const passCount = findings.filter((f) => f.status === 'PASS').length;
  const reviewCount = findings.filter((f) => f.status === 'REVIEW').length;
  const missingCount = findings.filter((f) => f.status === 'MISSING').length;

  const priceStatus = price_verification?.overall_status || 'INSUFFICIENT_DATA';
  const hasMismatch =
    priceStatus === 'HIGHER THAN EXPECTED' ||
    priceStatus === 'DISCREPANCY' ||
    (price_verification?.recurring_mismatch_amount && price_verification.recurring_mismatch_amount > 0);

  // Mandate status resolution (UNVERIFIED vs SIMULATED vs VERIFIED)
  const mandateStatus = mandate_verification?.verification_status || 'UNVERIFIED';
  const isSimulatedMandate = mandateStatus === 'SIMULATED';
  const isVerifiedMandate = mandateStatus === 'VERIFIED';

  // Key pricing numbers
  const currencySymbol = user_subscription?.currency === 'INR' ? '₹' : user_subscription?.currency || '₹';
  const expectedPrice =
    user_subscription?.user_promised_price !== undefined
      ? user_subscription.user_promised_price
      : user_subscription?.standard_listed_price;
  const disclosedPrice = extracted_terms?.subscription_amount?.value || '—';
  const mandateAmt = mandate_verification?.mandate_record?.mandate_amount || '—';

  // Next expected payment from timeline
  const nextPaymentEvent = timeline.find(
    (e) => e.amount_display && !e.amount_display.toLowerCase().includes('free')
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Primary Executive Summary Card */}
      <div className="metallic-card rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Merchant Identity & Plan Context */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] px-2.5 py-0.5 rounded bg-[#85543A]/30 text-[#E8C78E] font-mono font-bold uppercase tracking-wider">
                Audited Subscription
              </span>
              <span className="text-xs text-[#A77E5C] font-mono">
                {new Date(analyzed_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
              {user_subscription?.plan_name && (
                <span className="text-xs px-2 py-0.5 rounded bg-[#2B211D] text-[#E8C78E] font-mono border border-[#C28B3D]/30">
                  Plan: {user_subscription.plan_name}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5EBDD] tracking-tight mb-2">
              {merchant_name}
            </h1>

            {source_url && !source_url.startsWith('manual://') ? (
              <a
                href={source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#C28B3D] hover:text-[#E8C78E] transition-colors truncate max-w-md font-mono"
              >
                <span className="truncate">{source_url}</span>
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
              </a>
            ) : (
              <span className="text-xs text-[#A77E5C] font-mono">
                Manual Subscription Analysis — Evaluated from User Commitments
              </span>
            )}

            <p className="mt-4 text-xs text-[#A77E5C] max-w-2xl leading-relaxed">
              {scorecard?.summary ||
                `Subscription terms evaluated across 8 regulatory consumer protection parameters against authentic NPCI UPI AutoPay Operating Circulars and RBI E-Mandate Master Directions.`}
            </p>
          </div>

          {/* Quick Metrics & Score Pill */}
          <div className="flex items-center gap-6 sm:gap-8 bg-[#211611]/60 p-5 rounded-xl border border-[#C28B3D]/20">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#E8C78E] font-mono">
                {transparency_score}
                <span className="text-sm font-normal text-[#A77E5C]">/100</span>
              </div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-[#A77E5C] mt-1">
                Transparency Score
              </div>
            </div>

            <div className="h-12 w-px bg-[#C28B3D]/20" />

            <div className="text-center">
              <div
                className={`text-3xl sm:text-4xl font-extrabold font-mono ${
                  transparency_grade.startsWith('A')
                    ? 'text-[#75836B]'
                    : transparency_grade === 'B'
                    ? 'text-[#E8C78E]'
                    : 'text-[#85543A]'
                }`}
              >
                {transparency_grade}
              </div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-[#A77E5C] mt-1">
                Transparency Grade
              </div>
            </div>

            <div className="h-12 w-px bg-[#C28B3D]/20" />

            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#F5EBDD] font-mono">
                {verification_coverage_pct}%
              </div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-[#A77E5C] mt-1">
                Verified Coverage
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Critical Mismatch Alert Callout (Hackathon PPT Mismatch Banner) */}
      {price_verification?.recurring_mismatch_amount && price_verification.recurring_mismatch_amount > 0 && (
        <div className="p-5 rounded-2xl bg-rose-950/30 border-2 border-rose-500/40 shadow-lg space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400 font-mono font-bold text-xs uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>High Severity Discrepancy Detected: Recurring Mandate Overcharge</span>
            </div>
            <span className="px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold">
              +₹{price_verification.recurring_mismatch_amount.toFixed(2)} Recurring Mismatch
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs py-2 border-t border-b border-rose-500/20">
            <div>
              <span className="text-[10px] text-[#A77E5C] block">Agreed Renewal Commitment:</span>
              <span className="text-[#F5EBDD] font-bold">
                {currencySymbol} {expectedPrice !== undefined ? expectedPrice.toFixed(2) : '299.00'} / mo
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#A77E5C] block">Mandate Execution Ceiling:</span>
              <span className="text-amber-300 font-bold">
                {currencySymbol} {mandateAmt} / mo
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#A77E5C] block">Customer Impact:</span>
              <span className="text-rose-300 font-bold">
                Exceeds promised commitment by ₹{price_verification.recurring_mismatch_amount.toFixed(2)} every cycle
              </span>
            </div>
          </div>

          <p className="text-xs text-[#F5EBDD]/90 font-mono leading-relaxed">
            {price_verification.customer_impact ||
              'The payment configuration mandates an execution ceiling higher than the user commitment.'}
          </p>

          {price_verification.suggested_correction && (
            <div className="text-[11px] text-[#E8C78E] font-mono">
              <strong>Suggested Correction:</strong> {price_verification.suggested_correction}
            </div>
          )}
        </div>
      )}

      {/* 3. Core Multi-Source Subscription Parameter Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="metallic-card rounded-xl p-4">
          <span className="text-[10px] font-mono uppercase text-[#A77E5C] block">
            Selected Plan
          </span>
          <span className="text-sm font-bold text-[#F5EBDD] mt-1 block truncate">
            {user_subscription?.plan_name || 'Standard Plan'}
          </span>
          <span className="text-[10px] font-mono text-[#A77E5C] block mt-0.5">
            Frequency: {user_subscription?.billing_frequency || 'Monthly'}
          </span>
        </div>

        <div className="metallic-card rounded-xl p-4">
          <span className="text-[10px] font-mono uppercase text-[#A77E5C] block">
            Expected / Promised Price
          </span>
          <span className="text-sm font-bold text-[#E8C78E] mt-1 block font-mono">
            {expectedPrice !== undefined ? `${currencySymbol} ${expectedPrice.toFixed(2)}` : '—'}
          </span>
          <span className="text-[10px] font-mono text-[#A77E5C] block mt-0.5">
            User Commitment (B)
          </span>
        </div>

        <div className="metallic-card rounded-xl p-4">
          <span className="text-[10px] font-mono uppercase text-[#A77E5C] block">
            Merchant Disclosed
          </span>
          <span className="text-sm font-bold text-[#F5EBDD] mt-1 block font-mono">
            {disclosedPrice !== '—' ? `${currencySymbol} ${disclosedPrice}` : 'Unspecified'}
          </span>
          <span className="text-[10px] font-mono text-[#A77E5C] block mt-0.5">
            Advertised Terms (A)
          </span>
        </div>

        <div className="metallic-card rounded-xl p-4">
          <span className="text-[10px] font-mono uppercase text-[#A77E5C] block">
            Configured Mandate
          </span>
          <span
            className={`text-sm font-bold mt-1 block font-mono ${
              hasMismatch ? 'text-amber-300' : 'text-[#F5EBDD]'
            }`}
          >
            {mandateAmt !== '—' ? `${currencySymbol} ${mandateAmt}` : 'No Mandate'}
          </span>
          <span className="text-[10px] font-mono text-[#A77E5C] block mt-0.5">
            Debit Rule (C)
          </span>
        </div>
      </div>

      {/* 4. Critical Intelligence Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Price Verification Card */}
        <div
          onClick={() => onNavigateTab('PLAN_CHECKER')}
          className="metallic-card rounded-xl p-5 cursor-pointer hover:border-[#C28B3D] transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#A77E5C]">
              Price Reconciliation
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                hasMismatch
                  ? 'bg-rose-500/20 text-rose-300'
                  : priceStatus === 'EXACT MATCH' || priceStatus === 'MATCH' || priceStatus === 'MERCHANT_USER_MATCH'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-[#85543A]/30 text-[#E8C78E]'
              }`}
            >
              {priceStatus}
            </span>
          </div>
          <h3 className="text-sm font-bold text-[#F5EBDD] group-hover:text-[#E8C78E] transition-colors mb-1.5 flex items-center justify-between">
            <span>{price_verification?.summary || 'Plan reconciliation complete'}</span>
            <ArrowRight className="w-4 h-4 text-[#C28B3D] group-hover:translate-x-1 transition-transform" />
          </h3>
          <p className="text-xs text-[#A77E5C]">
            {price_verification?.discrepancy_reasons?.length
              ? price_verification.discrepancy_reasons[0]
              : 'Reconciles advertised merchant disclosures against accepted customer commitments.'}
          </p>
        </div>

        {/* Offers & Discounts Trajectory Card */}
        <div
          onClick={() => onNavigateTab('OFFERS')}
          className="metallic-card rounded-xl p-5 cursor-pointer hover:border-[#C28B3D] transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#A77E5C]">
              Offers & Trajectory
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#C28B3D]/20 text-[#E8C78E]">
              {offer_intelligence?.stages?.length || 2} Stages
            </span>
          </div>
          <h3 className="text-sm font-bold text-[#F5EBDD] group-hover:text-[#E8C78E] transition-colors mb-1.5 flex items-center justify-between">
            <span>
              {offer_intelligence?.comparison_outcome === 'MATCH_AFTER_COUPON'
                ? 'Coupon Applied'
                : offer_intelligence?.comparison_outcome === 'MATCH_AFTER_PROMO'
                ? 'Introductory Pricing Active'
                : 'Multi-Stage Trajectory'}
            </span>
            <ArrowRight className="w-4 h-4 text-[#C28B3D] group-hover:translate-x-1 transition-transform" />
          </h3>
          <p className="text-xs text-[#A77E5C]">
            {offer_intelligence?.comparison_notes ||
              'Inspect multi-stage pricing from free trial to promotional duration and full renewal.'}
          </p>
        </div>

        {/* UPI AutoPay Mandate Status Card (Honest State) */}
        <div
          onClick={() => onNavigateTab('MANDATE_CHECK')}
          className="metallic-card rounded-xl p-5 cursor-pointer hover:border-[#C28B3D] transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#A77E5C]">
              UPI AutoPay Mandate
            </span>
            {isVerifiedMandate ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300">
                VERIFIED
              </span>
            ) : isSimulatedMandate ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300">
                SIMULATED
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#85543A]/30 text-[#A77E5C]">
                UNVERIFIED
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-[#F5EBDD] group-hover:text-[#E8C78E] transition-colors mb-1.5 flex items-center justify-between">
            <span>
              {isVerifiedMandate
                ? 'Authorized Mandate Configuration'
                : isSimulatedMandate
                ? 'Simulated Mandate Test Data'
                : 'Mandate Not Provided (Unverified)'}
            </span>
            <ArrowRight className="w-4 h-4 text-[#C28B3D] group-hover:translate-x-1 transition-transform" />
          </h3>
          <p className="text-xs text-[#A77E5C]">
            {isSimulatedMandate
              ? 'SIMULATED TEST DATA — NO REAL PAYMENT OR BANK MANDATE ACCESSED.'
              : isVerifiedMandate
              ? 'Debit cap and validity verified against authentic mandate configuration.'
              : 'Public web pages do not hold bank mandate records. Mandate verification is unavailable.'}
          </p>
        </div>
      </div>

      {/* 5. Disclosures & Corrective Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Core Disclosed Terms Snapshot */}
        <div className="metallic-card rounded-xl p-6">
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#E8C78E] mb-4 flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#C28B3D]" />
            <span>Extracted Terms Disclosures</span>
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-[#C28B3D]/10">
              <span className="text-xs text-[#A77E5C]">Subscription Price</span>
              <span className="text-xs font-bold text-[#F5EBDD]">
                {extracted_terms.currency.value || '₹'} {extracted_terms.subscription_amount.value || 'Missing'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-[#C28B3D]/10">
              <span className="text-xs text-[#A77E5C]">Billing Frequency</span>
              <span className="text-xs font-bold text-[#F5EBDD]">
                {extracted_terms.billing_frequency.value || 'Unstated'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-[#C28B3D]/10">
              <span className="text-xs text-[#A77E5C]">Free Trial Window</span>
              <span className="text-xs font-bold text-[#F5EBDD]">
                {extracted_terms.free_trial_available.value
                  ? `${extracted_terms.trial_duration_days.value || 'Yes (Days unstated)'}`
                  : 'No Trial Offered'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-[#C28B3D]/10">
              <span className="text-xs text-[#A77E5C]">Regular Renewal Rate</span>
              <span className="text-xs font-bold text-[#F5EBDD]">
                {extracted_terms.renewal_amount.value
                  ? `${extracted_terms.currency.value || '₹'} ${extracted_terms.renewal_amount.value}`
                  : 'Same as base rate'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-[#C28B3D]/10">
              <span className="text-xs text-[#A77E5C]">Cancellation Terms</span>
              <span className="text-xs font-bold text-[#F5EBDD] truncate max-w-[220px]">
                {extracted_terms.cancellation_policy.value || 'Missing explicit procedure'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-[#A77E5C]">Pre-Debit Notification</span>
              <span className="text-xs font-bold text-[#F5EBDD] truncate max-w-[220px]">
                {extracted_terms.pre_debit_notification?.value || 'Omitted from page'}
              </span>
            </div>
          </div>
        </div>

        {/* Actionable Recommendations & Guidance */}
        <div className="metallic-card rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#E8C78E] mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C28B3D]" />
              <span>Recommended Consumer Actions</span>
            </h3>

            <div className="space-y-3">
              {ai_recommendations.slice(0, 3).map((rec, i) => (
                <div key={i} className="p-3 rounded-lg bg-[#211611]/60 border border-[#C28B3D]/20 text-xs text-[#F5EBDD]/90">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#85543A]/30 text-[#E8C78E] flex items-center justify-center font-mono font-bold text-[10px] flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="leading-relaxed">{rec}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#C28B3D]/10 flex items-center justify-between">
            <button
              onClick={() => onNavigateTab('AI_ASSISTANT')}
              className="text-xs font-mono font-bold text-[#C28B3D] hover:text-[#E8C78E] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Ask AI Assistant for Guidance</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onOpenRegulatoryDocs}
              className="text-xs font-mono text-[#A77E5C] hover:text-[#F5EBDD] transition-colors cursor-pointer"
            >
              NPCI / RBI Circulars
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
