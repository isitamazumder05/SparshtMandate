import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Sliders,
  DollarSign,
  Calendar,
  Tag,
  ShieldAlert,
  Save,
  ArrowRight,
  ShieldCheck,
  Info
} from 'lucide-react';
import {
  AnalysisResponse,
  UserSubscriptionInput,
  PriceVerificationResult,
  PriceComparisonItem
} from '../types';
import { verifyUserPlan } from '../services/api';

interface PlanCheckerPanelProps {
  analysis: AnalysisResponse;
  onUpdateAnalysis: (updated: AnalysisResponse) => void;
}

export const PlanCheckerPanel: React.FC<PlanCheckerPanelProps> = ({
  analysis,
  onUpdateAnalysis
}) => {
  const existingSub = analysis.user_subscription || {};
  const priceVer = analysis.price_verification;
  const mandateVer = analysis.mandate_verification;

  const [formData, setFormData] = useState<UserSubscriptionInput>({
    merchant_name: existingSub.merchant_name || analysis.merchant_name,
    plan_name: existingSub.plan_name || '',
    subscription_tier: existingSub.subscription_tier || '',
    user_promised_price:
      existingSub.user_promised_price ??
      existingSub.standard_listed_price ??
      (analysis.extracted_terms.subscription_amount.value
        ? parseFloat(analysis.extracted_terms.subscription_amount.value)
        : undefined),
    advertised_regular_price:
      existingSub.advertised_regular_price ??
      (analysis.extracted_terms.subscription_amount.value
        ? parseFloat(analysis.extracted_terms.subscription_amount.value)
        : undefined),
    standard_listed_price: existingSub.standard_listed_price,
    actual_charged_price: existingSub.actual_charged_price,
    is_already_charged: existingSub.is_already_charged ?? false,
    currency: existingSub.currency || analysis.extracted_terms.currency.value || 'INR',
    billing_frequency:
      existingSub.billing_frequency ||
      analysis.extracted_terms.billing_frequency.value ||
      'Monthly',
    free_trial_days:
      existingSub.free_trial_days ??
      (analysis.extracted_terms.trial_duration_days.value
        ? parseInt(analysis.extracted_terms.trial_duration_days.value)
        : undefined),
    introductory_price: existingSub.introductory_price,
    introductory_duration_months: existingSub.introductory_duration_months,
    promotional_discount_pct: existingSub.promotional_discount_pct,
    coupon_code: existingSub.coupon_code || '',
    coupon_discount_amount: existingSub.coupon_discount_amount,
    coupon_discount_pct: existingSub.coupon_discount_pct,
    customer_type: existingSub.customer_type || 'NEW_CUSTOMER',
    promotional_eligibility: existingSub.promotional_eligibility || 'ELIGIBLE',
    expected_renewal_price: existingSub.expected_renewal_price,
    configured_mandate_amount:
      existingSub.configured_mandate_amount ??
      (mandateVer?.mandate_record?.mandate_amount
        ? parseFloat(mandateVer.mandate_record.mandate_amount)
        : undefined),
    activation_date: existingSub.activation_date || '',
    payment_date: existingSub.payment_date || '',
    invoice_notes: existingSub.invoice_notes || '',
    input_mode: existingSub.input_mode || 'MANUAL'
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'MATRIX' | 'EDIT_INPUTS'>('MATRIX');

  const handleInputChange = (field: keyof UserSubscriptionInput, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleReconcile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (formData.user_promised_price !== undefined && formData.user_promised_price < 0) {
      setErrorMsg('Promised subscription price must be a positive number.');
      setIsSubmitting(false);
      return;
    }
    if (formData.actual_charged_price !== undefined && formData.actual_charged_price < 0) {
      setErrorMsg('Actual charged amount must be a positive number.');
      setIsSubmitting(false);
      return;
    }

    try {
      const updated = await verifyUserPlan(analysis.id, formData);
      onUpdateAnalysis(updated);
      setSuccessMsg('Plan parameters verified and 3-way reconciliation recalculated successfully!');
      setActiveTab('MATRIX');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to verify plan parameters');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status badge styling helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'EXACT MATCH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            EXACT MATCH
          </span>
        );
      case 'MATCH AFTER PROMOTION':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            PROMO MATCH
          </span>
        );
      case 'MATCH AFTER COUPON':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            COUPON MATCH
          </span>
        );
      case 'HIGHER THAN EXPECTED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
            HIGHER THAN EXPECTED
          </span>
        );
      case 'LOWER THAN EXPECTED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
            LOWER THAN EXPECTED
          </span>
        );
      case 'FREQUENCY MISMATCH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            FREQUENCY MISMATCH
          </span>
        );
      case 'PLAN MISMATCH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            PLAN MISMATCH
          </span>
        );
      case 'ELIGIBILITY UNCLEAR':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
            ELIGIBILITY UNCLEAR
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#85543A]/20 text-[#A77E5C] border border-[#C28B3D]/20">
            {status || 'INSUFFICIENT DATA'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Executive Summary & Alert Banner */}
      <div className="metallic-card rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] px-2.5 py-0.5 rounded bg-[#85543A]/30 text-[#E8C78E] font-mono font-bold uppercase tracking-wider">
                Deterministic 3-Way Plan Reconciliation
              </span>
              <span className="text-xs text-[#A77E5C] font-mono">
                Source A vs Source B vs Source C
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-[#F5EBDD] flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#C28B3D]" />
              <span>Plan Checker & Price Verification Engine</span>
            </h2>

            <p className="text-xs text-[#A77E5C] mt-2 max-w-2xl leading-relaxed">
              Public merchant URLs alone cannot determine what you individually were promised or charged.
              This engine reconciles <strong>Merchant Disclosures (A)</strong>, your <strong>Accepted Commitments (B)</strong>,
              and configured <strong>Recurring Payment Mandates (C)</strong> across 7 critical parameters.
            </p>
          </div>

          {/* Reconciliation Status Badge */}
          {priceVer && (
            <div className="flex flex-col items-end gap-2">
              <div
                className={`px-4 py-2 rounded-xl font-mono text-xs font-bold border flex items-center gap-2 ${
                  priceVer.overall_status === 'EXACT MATCH' ||
                  priceVer.overall_status === 'MATCH' ||
                  priceVer.overall_status === 'MERCHANT_USER_MATCH'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : priceVer.overall_status === 'HIGHER THAN EXPECTED'
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                <span>Reconciliation Status:</span>
                <span className="uppercase">{priceVer.overall_status}</span>
              </div>

              {priceVer.recurring_mismatch_amount && priceVer.recurring_mismatch_amount > 0 && (
                <div className="px-3 py-1 rounded-lg bg-rose-950/40 border border-rose-500/40 text-[11px] font-mono font-bold text-rose-300">
                  Recurring Mismatch: +₹{priceVer.recurring_mismatch_amount.toFixed(2)} / billing cycle
                </div>
              )}
            </div>
          )}
        </div>

        {/* Highlight Banner if Recurring Mismatch Exists (Original ₹299 vs ₹499 scenario) */}
        {priceVer?.recurring_mismatch_amount && priceVer.recurring_mismatch_amount > 0 && (
          <div className="mt-6 p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-mono font-bold uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Recurring Payment Discrepancy Alert</span>
            </div>
            <p className="text-xs text-[#F5EBDD] font-mono">
              {priceVer.customer_impact ||
                `The merchant configured an AutoPay recurring debit ceiling of ₹${formData.configured_mandate_amount || 499}, exceeding your agreed renewal commitment of ₹${formData.user_promised_price || 299} by ₹${priceVer.recurring_mismatch_amount.toFixed(2)}.`}
            </p>
            {priceVer.suggested_correction && (
              <div className="text-[11px] text-[#E8C78E] font-mono pt-1">
                <strong>Suggested Correction:</strong> {priceVer.suggested_correction}
              </div>
            )}
          </div>
        )}

        {/* View Switcher: Matrix vs Edit Inputs */}
        <div className="mt-6 pt-4 border-t border-[#C28B3D]/20 flex items-center justify-between">
          <div className="inline-flex p-1 rounded-xl bg-[#1A110D] border border-[#C28B3D]/30">
            <button
              type="button"
              onClick={() => setActiveTab('MATRIX')}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'MATRIX'
                  ? 'bg-gradient-to-r from-[#85543A] to-[#C28B3D] text-[#F5EBDD]'
                  : 'text-[#A77E5C] hover:text-[#F5EBDD]'
              }`}
            >
              3-Way Comparison Matrix
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('EDIT_INPUTS')}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'EDIT_INPUTS'
                  ? 'bg-gradient-to-r from-[#85543A] to-[#C28B3D] text-[#F5EBDD]'
                  : 'text-[#A77E5C] hover:text-[#F5EBDD]'
              }`}
            >
              Update Subscription Details
            </button>
          </div>

          <span className="text-[11px] font-mono text-[#A77E5C]">
            Plan: <strong className="text-[#F5EBDD]">{formData.plan_name || 'Standard'}</strong>
          </span>
        </div>
      </div>

      {/* 2. TAB 1: 3-WAY COMPARISON MATRIX TABLE */}
      {activeTab === 'MATRIX' && (
        <div className="metallic-card rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#E8C78E] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#C28B3D]" />
              <span>3-Way Parameter Reconciliation Matrix</span>
            </h3>
            <span className="text-[10px] font-mono text-[#A77E5C]">
              7 Core Subscription Parameters
            </span>
          </div>

          {priceVer && priceVer.comparison_items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-[#C28B3D]/30 text-[#A77E5C] text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-3">Parameter</th>
                    <th className="py-3 px-3">Merchant Disclosure (A)</th>
                    <th className="py-3 px-3">User Expectation (B)</th>
                    <th className="py-3 px-3">Payment Config / Mandate (C)</th>
                    <th className="py-3 px-3">Difference</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C28B3D]/10 text-[#F5EBDD]">
                  {priceVer.comparison_items.map((item: PriceComparisonItem, idx: number) => {
                    const isMismatch =
                      item.status === 'HIGHER THAN EXPECTED' ||
                      item.status === 'FREQUENCY MISMATCH' ||
                      item.status === 'PLAN MISMATCH';

                    return (
                      <React.Fragment key={idx}>
                        <tr
                          className={`hover:bg-[#2B211D]/50 transition-colors ${
                            isMismatch ? 'bg-rose-950/15' : ''
                          }`}
                        >
                          <td className="py-3.5 px-3 font-bold text-[#F5EBDD] whitespace-nowrap">
                            {item.parameter}
                          </td>
                          <td className="py-3.5 px-3 text-[#A77E5C]">
                            {item.merchant_disclosure || item.merchant_disclosed || (
                              <span className="italic text-[#A77E5C]/60">Not Disclosed</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-[#E8C78E] font-semibold">
                            {item.user_expectation || item.user_entered_or_actual || (
                              <span className="italic text-[#A77E5C]/60">Not Specified</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-[#F5EBDD]">
                            {item.payment_configuration ? (
                              <span className="font-semibold text-amber-300">
                                {item.payment_configuration}
                              </span>
                            ) : (
                              <span className="italic text-[#A77E5C]/60">No Mandate Config</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3">
                            {item.difference ? (
                              <span
                                className={`font-bold ${
                                  isMismatch ? 'text-rose-400' : 'text-emerald-400'
                                }`}
                              >
                                {item.difference}
                              </span>
                            ) : (
                              <span className="text-[#A77E5C]/50">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            {renderStatusBadge(item.status)}
                          </td>
                        </tr>
                        {/* Explanation Sub-row */}
                        {item.explanation && (
                          <tr className="bg-[#1A110D]/40 text-[11px] text-[#A77E5C]">
                            <td colSpan={6} className="py-2 px-3 pl-8 border-b border-[#C28B3D]/10">
                              <span className="text-[#A77E5C] font-normal leading-relaxed">
                                <strong>Reconciliation Note:</strong> {item.explanation}
                              </span>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-[#A77E5C] text-xs font-mono">
              No reconciliation items generated. Switch to "Update Subscription Details" to supply your plan values.
            </div>
          )}
        </div>
      )}

      {/* 3. TAB 2: EDIT PLAN INPUTS FORM */}
      {activeTab === 'EDIT_INPUTS' && (
        <div className="metallic-card rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#E8C78E] flex items-center gap-2">
              <Save className="w-4 h-4 text-[#C28B3D]" />
              <span>Update Subscription Commitment Details</span>
            </h3>
            <span className="text-[10px] font-mono text-[#A77E5C]">
              Deterministic Re-evaluation
            </span>
          </div>

          <form onSubmit={handleReconcile} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-[#A77E5C] mb-1">
                  Plan Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.plan_name || ''}
                  onChange={(e) => handleInputChange('plan_name', e.target.value)}
                  placeholder="e.g. Standard Monthly Subscription"
                  className="w-full px-3 py-2 rounded-lg bg-[#211611] border border-[#C28B3D]/30 text-xs text-[#F5EBDD] focus:outline-none focus:border-[#C28B3D]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#A77E5C] mb-1">
                  Subscription Tier / Option
                </label>
                <input
                  type="text"
                  value={formData.subscription_tier || ''}
                  onChange={(e) => handleInputChange('subscription_tier', e.target.value)}
                  placeholder="e.g. Individual, Family, HD"
                  className="w-full px-3 py-2 rounded-lg bg-[#211611] border border-[#C28B3D]/30 text-xs text-[#F5EBDD] focus:outline-none focus:border-[#C28B3D]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-[#A77E5C] mb-1">
                  Promised / Expected Price (₹) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.user_promised_price ?? ''}
                  onChange={(e) =>
                    handleInputChange(
                      'user_promised_price',
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  placeholder="e.g. 299.00"
                  className="w-full px-3 py-2 rounded-lg bg-[#211611] border border-[#C28B3D]/40 text-xs text-[#E8C78E] font-bold focus:outline-none focus:border-[#E8C78E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#A77E5C] mb-1">
                  Advertised Regular Price (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.advertised_regular_price ?? ''}
                  onChange={(e) =>
                    handleInputChange(
                      'advertised_regular_price',
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  placeholder="e.g. 299.00"
                  className="w-full px-3 py-2 rounded-lg bg-[#211611] border border-[#C28B3D]/30 text-xs text-[#F5EBDD] focus:outline-none focus:border-[#C28B3D]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#A77E5C] mb-1">
                  Billing Frequency
                </label>
                <select
                  value={formData.billing_frequency || 'Monthly'}
                  onChange={(e) => handleInputChange('billing_frequency', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#211611] border border-[#C28B3D]/30 text-xs text-[#F5EBDD] focus:outline-none focus:border-[#C28B3D]"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Semi-Annual">Semi-Annual</option>
                  <option value="Annual">Annual</option>
                  <option value="Weekly">Weekly</option>
                </select>
              </div>
            </div>

            {/* Introductory Offer & Trial */}
            <div className="p-4 rounded-xl bg-[#211611]/60 border border-[#C28B3D]/20 space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8C78E] block">
                Introductory Offer & Trial
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-[#A77E5C] mb-1">
                    Intro Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.introductory_price ?? ''}
                    onChange={(e) =>
                      handleInputChange(
                        'introductory_price',
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                    placeholder="e.g. 99.00"
                    className="w-full px-3 py-2 rounded-lg bg-[#2B211D] border border-[#C28B3D]/30 text-xs text-[#F5EBDD] focus:outline-none focus:border-[#C28B3D]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#A77E5C] mb-1">
                    Intro Months
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.introductory_duration_months ?? ''}
                    onChange={(e) =>
                      handleInputChange(
                        'introductory_duration_months',
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    placeholder="e.g. 1"
                    className="w-full px-3 py-2 rounded-lg bg-[#2B211D] border border-[#C28B3D]/30 text-xs text-[#F5EBDD] focus:outline-none focus:border-[#C28B3D]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#A77E5C] mb-1">
                    Free Trial (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.free_trial_days ?? ''}
                    onChange={(e) =>
                      handleInputChange(
                        'free_trial_days',
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    placeholder="e.g. 7"
                    className="w-full px-3 py-2 rounded-lg bg-[#2B211D] border border-[#C28B3D]/30 text-xs text-[#F5EBDD] focus:outline-none focus:border-[#C28B3D]"
                  />
                </div>
              </div>
            </div>

            {/* Actual Checkout Charge & Mandate Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#211611]/60 border border-[#C28B3D]/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#F5EBDD]">
                    Actual Debit Amount
                  </span>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-[10px] font-mono text-[#A77E5C]">
                    <input
                      type="checkbox"
                      checked={!formData.is_already_charged}
                      onChange={(e) => handleInputChange('is_already_charged', !e.target.checked)}
                      className="rounded bg-[#2B211D] border-[#C28B3D]/40 text-[#C28B3D] focus:ring-0 cursor-pointer"
                    />
                    <span>Not yet charged</span>
                  </label>
                </div>
                {formData.is_already_charged && (
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.actual_charged_price ?? ''}
                    onChange={(e) =>
                      handleInputChange(
                        'actual_charged_price',
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                    placeholder="Amount shown on bank SMS / UPI"
                    className="w-full px-3 py-2 rounded-lg bg-[#2B211D] border border-[#C28B3D]/40 text-xs text-[#F5EBDD] font-bold focus:outline-none focus:border-[#E8C78E]"
                  />
                )}
              </div>

              <div className="p-4 rounded-xl bg-[#211611]/60 border border-[#C28B3D]/20 space-y-2">
                <span className="text-xs font-mono font-bold text-[#F5EBDD] block">
                  Configured Mandate Amount (₹)
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.configured_mandate_amount ?? ''}
                  onChange={(e) =>
                    handleInputChange(
                      'configured_mandate_amount',
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  placeholder="e.g. 499.00"
                  className="w-full px-3 py-2 rounded-lg bg-[#2B211D] border border-[#C28B3D]/40 text-xs text-[#E8C78E] font-bold focus:outline-none focus:border-[#E8C78E]"
                />
                <span className="text-[10px] text-[#A77E5C] block">
                  The maximum execution ceiling configured on the AutoPay mandate.
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-red-200 text-xs">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#85543A] via-[#C28B3D] to-[#E8C78E] text-[#211611] font-bold text-xs font-mono uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Recalculating 3-Way Reconciliation...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Verify & Recalculate 3-Way Plan Commitments</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
