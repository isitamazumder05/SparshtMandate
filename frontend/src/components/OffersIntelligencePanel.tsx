import React from 'react';
import {
  Tag,
  Percent,
  TrendingUp,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Layers,
  HelpCircle
} from 'lucide-react';
import { AnalysisResponse, OfferStage } from '../types';

interface OffersIntelligencePanelProps {
  analysis: AnalysisResponse;
}

export const OffersIntelligencePanel: React.FC<OffersIntelligencePanelProps> = ({
  analysis
}) => {
  const offers = analysis.offer_intelligence;
  const curr = analysis.extracted_terms.currency.value || 'INR';

  if (!offers) {
    return (
      <div className="metallic-card rounded-2xl p-8 text-center text-[#A77E5C] text-sm animate-fadeIn">
        Offers intelligence calculation will appear here once the subscription is analyzed.
      </div>
    );
  }

  const {
    standard_price,
    introductory_price,
    introductory_duration_months,
    coupon_code,
    coupon_discount,
    expected_intro_price,
    expected_renewal_price,
    stages,
    eligibility_status,
    eligibility_notes,
    comparison_outcome,
    comparison_notes,
    discrepancy_amount
  } = offers;

  // Outcome pill coloring
  const outcomeColors: Record<string, { bg: string; text: string; border: string }> = {
    EXACT_MATCH: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    MATCH_AFTER_PROMO: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    MATCH_AFTER_COUPON: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    HIGHER_THAN_EXPECTED: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    LOWER_THAN_EXPECTED: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    FREQUENCY_MISMATCH: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
    ELIGIBILITY_UNCLEAR: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    INSUFFICIENT_EVIDENCE: { bg: 'bg-[#85543A]/20', text: 'text-[#E8C78E]', border: 'border-[#C28B3D]/30' }
  };

  const currentOutcomeStyle = outcomeColors[comparison_outcome] || outcomeColors.INSUFFICIENT_EVIDENCE;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header & Outcome Summary Banner */}
      <div className="metallic-card rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] px-2.5 py-0.5 rounded bg-[#85543A]/30 text-[#E8C78E] font-mono font-bold uppercase tracking-wider">
                Multi-Stage Pricing Intelligence
              </span>
              <span
                className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border ${currentOutcomeStyle.bg} ${currentOutcomeStyle.text} ${currentOutcomeStyle.border}`}
              >
                {comparison_outcome.replace(/_/g, ' ')}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-[#F5EBDD] flex items-center gap-2">
              <Percent className="w-5 h-5 text-[#C28B3D]" />
              <span>Offers & Promotional Trajectory</span>
            </h2>

            <p className="text-xs text-[#A77E5C] mt-2 max-w-2xl leading-relaxed">
              {comparison_notes}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-6 bg-[#211611]/60 p-4 rounded-xl border border-[#C28B3D]/20">
            <div>
              <div className="text-[10px] font-mono text-[#A77E5C] uppercase">Standard Rate</div>
              <div className="text-lg font-bold text-[#F5EBDD] font-mono">
                {standard_price !== null && standard_price !== undefined ? `₹${standard_price}` : 'Unspecified'}
              </div>
            </div>

            <div className="h-8 w-px bg-[#C28B3D]/20" />

            <div>
              <div className="text-[10px] font-mono text-[#A77E5C] uppercase">First Cycle Expected</div>
              <div className="text-lg font-bold text-[#E8C78E] font-mono">
                {expected_intro_price !== null && expected_intro_price !== undefined ? `₹${expected_intro_price}` : 'Unspecified'}
              </div>
            </div>

            <div className="h-8 w-px bg-[#C28B3D]/20" />

            <div>
              <div className="text-[10px] font-mono text-[#A77E5C] uppercase">Post-Promo Renewal</div>
              <div className="text-lg font-bold text-[#F5EBDD] font-mono">
                {expected_renewal_price !== null && expected_renewal_price !== undefined ? `₹${expected_renewal_price}` : 'Unspecified'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Multi-Stage Pricing Trajectory Pipeline */}
      <div className="metallic-card rounded-2xl p-6 sm:p-8">
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#E8C78E] mb-6 flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#C28B3D]" />
          <span>Subscription Price Trajectory by Stage</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stages.map((stage: OfferStage, index: number) => (
            <div
              key={index}
              className="p-5 rounded-xl bg-[#211611]/70 border border-[#C28B3D]/30 relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono font-bold text-[#E8C78E] uppercase tracking-wider">
                    {stage.stage_name}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#85543A]/30 text-[#F5EBDD]">
                    {stage.duration_display}
                  </span>
                </div>

                <div className="text-2xl font-extrabold text-[#F5EBDD] font-mono my-3">
                  {stage.price_display}
                </div>

                <p className="text-xs text-[#A77E5C] leading-relaxed">
                  {stage.notes}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#C28B3D]/10 flex items-center justify-between text-[10px] font-mono text-[#A77E5C]">
                <span>Recurring: {stage.is_recurring ? 'Yes' : 'No'}</span>
                <span>Interval: {stage.billing_frequency}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Promotional Conditions & Eligibility Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Standing & Eligibility */}
        <div className="metallic-card rounded-xl p-6">
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#E8C78E] mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#C28B3D]" />
            <span>Eligibility & Promotional Standing</span>
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-[#C28B3D]/10 text-xs">
              <span className="text-[#A77E5C]">Eligibility Verification Status:</span>
              <span
                className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                  eligibility_status === 'ELIGIBLE'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : eligibility_status === 'INELIGIBLE'
                    ? 'bg-red-500/20 text-red-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {eligibility_status}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-[#C28B3D]/10 text-xs">
              <span className="text-[#A77E5C]">Introductory Duration:</span>
              <span className="font-mono font-bold text-[#F5EBDD]">
                {introductory_duration_months ? `${introductory_duration_months} Month(s)` : 'None / Not Applicable'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 text-xs">
              <span className="text-[#A77E5C]">Coupon Code Applied:</span>
              <span className="font-mono font-bold text-[#E8C78E]">
                {coupon_code ? `${coupon_code} (Discount: ₹${coupon_discount || 0})` : 'No coupon applied'}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-[#211611]/60 border border-[#C28B3D]/20 text-xs text-[#A77E5C] leading-relaxed">
              <strong>Eligibility Guidance:</strong> {eligibility_notes}
            </div>
          </div>
        </div>

        {/* Price Difference & Surcharges Explanations */}
        <div className="metallic-card rounded-xl p-6">
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#E8C78E] mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#C28B3D]" />
            <span>Understanding Price Discrepancies</span>
          </h3>

          <div className="space-y-3 text-xs text-[#A77E5C] leading-relaxed">
            <p>
              Under <strong className="text-[#F5EBDD]">Consumer Protection (E-Commerce) Rules, 2020</strong>, merchants must disclose
              all mandatory taxes and fees prior to payment initiation.
            </p>

            <div className="p-3 rounded-lg bg-[#211611]/60 border border-[#C28B3D]/10 space-y-1.5">
              <div className="font-bold text-[#E8C78E]">Common causes for higher checkout charges:</div>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong className="text-[#F5EBDD]">18% GST (Tax)</strong> added separately at final payment gateway step.</li>
                <li>Payment gateway convenience fees for credit cards or international currencies.</li>
                <li>Promotional coupon code not successfully validated or expired.</li>
                <li>Selecting an annual cadence when expecting monthly billing.</li>
              </ul>
            </div>

            <p className="text-[11px] text-[#A77E5C]">
              Use the <strong className="text-[#F5EBDD]">Plan Checker</strong> tab to update your actual checkout debit to re-reconcile with exact decimal arithmetic.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

