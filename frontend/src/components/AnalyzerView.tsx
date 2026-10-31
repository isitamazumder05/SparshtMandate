import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Loader2,
  CheckCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Tag,
  DollarSign,
  Calendar,
  Layers,
  HelpCircle
} from 'lucide-react';
import { analyzeSubscriptionUrl, fetchPresets } from '../services/api';
import {
  AnalysisResponse,
  PresetItem,
  MandateRecordInput,
  UserSubscriptionInput
} from '../types';

interface AnalyzerViewProps {
  onAnalysisComplete: (result: AnalysisResponse) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
}

export const AnalyzerView: React.FC<AnalyzerViewProps> = ({
  onAnalysisComplete,
  isLoading,
  setIsLoading
}) => {
  // Mode selection: MODE A (URL_ASSISTED) vs MODE B (MANUAL)
  const [inputMode, setInputMode] = useState<'URL_ASSISTED' | 'MANUAL'>('URL_ASSISTED');

  // Input states
  const [urlInput, setUrlInput] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [planName, setPlanName] = useState('');
  const [subscriptionTier, setSubscriptionTier] = useState('');
  const [advertisedRegularPrice, setAdvertisedRegularPrice] = useState<string>('');
  const [userPromisedPrice, setUserPromisedPrice] = useState<string>('');
  const [billingFrequency, setBillingFrequency] = useState('Monthly');
  const [currency, setCurrency] = useState('INR');

  // Trial & Introductory Offer
  const [hasIntroOffer, setHasIntroOffer] = useState(false);
  const [introPrice, setIntroPrice] = useState<string>('');
  const [introMonths, setIntroMonths] = useState<string>('1');
  const [freeTrialDays, setFreeTrialDays] = useState<string>('');

  // Coupon
  const [hasCoupon, setHasCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState<string>('');
  const [couponDiscountPct, setCouponDiscountPct] = useState<string>('');

  // Actual Charge
  const [isNotYetCharged, setIsNotYetCharged] = useState(true);
  const [actualChargedPrice, setActualChargedPrice] = useState<string>('');

  // Mandate configuration
  const [hasMandateConfig, setHasMandateConfig] = useState(false);
  const [mandateAmount, setMandateAmount] = useState<string>('');
  const [mandateFrequency, setMandateFrequency] = useState('Monthly');
  const [mandateUmin, setMandateUmin] = useState('');
  const [isSimulatedMandate, setIsSimulatedMandate] = useState(true);

  // Status & Error
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [presets, setPresets] = useState<PresetItem[]>([]);
  const [progressStage, setProgressStage] = useState<number>(0);

  const stages = [
    'Connecting & Validating Security Bounds (SSRF & Input Shield)',
    'Extracting Terms & Resolving User Commitment Baseline',
    '3-Way Reconciliation (Merchant Disclosure vs User Expectation vs Mandate)',
    'Constructing Chronological Multi-Stage Payment Timeline',
    'Auditing Regulatory Transparency (NPCI UPI AutoPay & RBI Rules)',
    'Compiling Verification Scorecard & Findings Matrix'
  ];

  useEffect(() => {
    fetchPresets()
      .then(setPresets)
      .catch((err) => console.log('Could not load presets:', err));
  }, []);

  // Progress cycle animation when loading
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setProgressStage(0);
      interval = setInterval(() => {
        setProgressStage((prev) => {
          if (prev < stages.length - 1) return prev + 1;
          return prev;
        });
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Load Preset
  const handleSelectPreset = (preset: PresetItem) => {
    setErrorMessage(null);
    if (preset.url && preset.url.trim().length > 0) {
      setInputMode('URL_ASSISTED');
      setUrlInput(preset.url);
    } else {
      setInputMode('MANUAL');
      setUrlInput('');
    }

    const sub = preset.user_subscription;
    if (sub) {
      setMerchantName(sub.merchant_name || '');
      setPlanName(sub.plan_name || '');
      setSubscriptionTier(sub.subscription_tier || '');
      setAdvertisedRegularPrice(sub.advertised_regular_price !== undefined ? String(sub.advertised_regular_price) : '');
      setUserPromisedPrice(
        sub.user_promised_price !== undefined
          ? String(sub.user_promised_price)
          : sub.standard_listed_price !== undefined
          ? String(sub.standard_listed_price)
          : ''
      );
      setBillingFrequency(sub.billing_frequency || 'Monthly');
      setCurrency(sub.currency || 'INR');

      if (sub.introductory_price !== undefined || (sub.free_trial_days && sub.free_trial_days > 0)) {
        setHasIntroOffer(true);
        setIntroPrice(sub.introductory_price !== undefined ? String(sub.introductory_price) : '');
        setIntroMonths(sub.introductory_duration_months !== undefined ? String(sub.introductory_duration_months) : '1');
        setFreeTrialDays(sub.free_trial_days ? String(sub.free_trial_days) : '');
      } else {
        setHasIntroOffer(false);
      }

      if (sub.coupon_code || sub.coupon_discount_amount) {
        setHasCoupon(true);
        setCouponCode(sub.coupon_code || '');
        setCouponDiscount(sub.coupon_discount_amount ? String(sub.coupon_discount_amount) : '');
      } else {
        setHasCoupon(false);
      }

      setIsNotYetCharged(!sub.is_already_charged);
      setActualChargedPrice(sub.actual_charged_price ? String(sub.actual_charged_price) : '');
    }

    const mandate = preset.mandate_record;
    if (mandate) {
      setHasMandateConfig(true);
      setMandateAmount(mandate.mandate_amount || '');
      setMandateFrequency(mandate.frequency || 'Monthly');
      setMandateUmin(mandate.umin || '');
      setIsSimulatedMandate(mandate.is_simulated ?? true);
    } else {
      setHasMandateConfig(false);
    }
  };

  // One-click Benchmark Runner: "⭐ Test Original ₹299 vs ₹499 Mismatch"
  const handleRunOriginalBenchmark = async () => {
    setErrorMessage(null);
    setInputMode('MANUAL');
    setUrlInput('');
    setMerchantName('OTT Entertainment Stream');
    setPlanName('Standard Monthly Subscription');
    setAdvertisedRegularPrice('299');
    setUserPromisedPrice('299');
    setBillingFrequency('Monthly');
    setCurrency('INR');
    setHasIntroOffer(true);
    setIntroPrice('99');
    setIntroMonths('1');
    setFreeTrialDays('');
    setHasCoupon(false);
    setIsNotYetCharged(true);
    setHasMandateConfig(true);
    setMandateAmount('499.00');
    setMandateFrequency('Monthly');
    setMandateUmin('AUTOPAY-SIM-299VS499@paytm');
    setIsSimulatedMandate(true);

    const subInput: UserSubscriptionInput = {
      merchant_name: 'OTT Entertainment Stream',
      plan_name: 'Standard Monthly Subscription',
      user_promised_price: 299.0,
      advertised_regular_price: 299.0,
      standard_listed_price: 299.0,
      billing_frequency: 'Monthly',
      introductory_price: 99.0,
      introductory_duration_months: 1,
      expected_renewal_price: 299.0,
      currency: 'INR',
      is_already_charged: false,
      customer_type: 'NEW_CUSTOMER',
      promotional_eligibility: 'ELIGIBLE',
      input_mode: 'MANUAL'
    };

    const mandateInput: MandateRecordInput = {
      merchant_name: 'OTT Entertainment Stream',
      mandate_amount: '499.00',
      frequency: 'Monthly',
      umin: 'AUTOPAY-SIM-299VS499@paytm',
      is_simulated: true
    };

    setIsLoading(true);
    try {
      const res = await analyzeSubscriptionUrl(null, mandateInput, subInput, 'MANUAL');
      onAnalysisComplete(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to run benchmark audit.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation: Plan Details are NEVER optional
    const cleanPlan = planName.trim();
    if (!cleanPlan) {
      setErrorMessage('Plan name/tier is required. Please specify the subscription plan.');
      return;
    }

    const promisedNum = parseFloat(userPromisedPrice);
    if (isNaN(promisedNum) || promisedNum < 0) {
      setErrorMessage('A valid subscription price promised or selected is required (must be a positive number).');
      return;
    }

    if (inputMode === 'MANUAL') {
      const cleanMerchant = merchantName.trim();
      if (!cleanMerchant) {
        setErrorMessage('Merchant name is required in Manual mode.');
        return;
      }
      const advNum = parseFloat(advertisedRegularPrice || userPromisedPrice);
      if (isNaN(advNum) || advNum < 0) {
        setErrorMessage('Advertised regular price is required in Manual mode.');
        return;
      }
    }

    if (inputMode === 'URL_ASSISTED' && urlInput.trim()) {
      const trimmedUrl = urlInput.trim();
      if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
        setErrorMessage('Merchant URL must begin with http:// or https://');
        return;
      }
    }

    // Build payload
    const subInput: UserSubscriptionInput = {
      merchant_name: merchantName.trim() || undefined,
      source_url: inputMode === 'URL_ASSISTED' && urlInput.trim() ? urlInput.trim() : undefined,
      plan_name: cleanPlan,
      user_promised_price: promisedNum,
      standard_listed_price: promisedNum,
      advertised_regular_price: advertisedRegularPrice ? parseFloat(advertisedRegularPrice) : promisedNum,
      currency: currency || 'INR',
      billing_frequency: billingFrequency || 'Monthly',
      subscription_tier: subscriptionTier.trim() || undefined,
      introductory_price: hasIntroOffer && introPrice ? parseFloat(introPrice) : undefined,
      introductory_duration_months: hasIntroOffer && introMonths ? parseInt(introMonths) : undefined,
      free_trial_days: hasIntroOffer && freeTrialDays ? parseInt(freeTrialDays) : undefined,
      coupon_code: hasCoupon && couponCode.trim() ? couponCode.trim() : undefined,
      coupon_discount_amount: hasCoupon && couponDiscount ? parseFloat(couponDiscount) : undefined,
      coupon_discount_pct: hasCoupon && couponDiscountPct ? parseFloat(couponDiscountPct) : undefined,
      is_already_charged: !isNotYetCharged,
      actual_charged_price: !isNotYetCharged && actualChargedPrice ? parseFloat(actualChargedPrice) : undefined,
      expected_renewal_price: advertisedRegularPrice ? parseFloat(advertisedRegularPrice) : promisedNum,
      input_mode: inputMode
    };

    let mandatePayload: MandateRecordInput | undefined = undefined;
    if (hasMandateConfig && mandateAmount) {
      mandatePayload = {
        merchant_name: merchantName.trim() || cleanPlan,
        mandate_amount: mandateAmount.trim(),
        frequency: mandateFrequency,
        umin: mandateUmin.trim() || undefined,
        is_simulated: isSimulatedMandate
      };
    }

    setIsLoading(true);
    try {
      const res = await analyzeSubscriptionUrl(
        inputMode === 'URL_ASSISTED' && urlInput.trim() ? urlInput.trim() : null,
        mandatePayload,
        subInput,
        inputMode
      );
      onAnalysisComplete(res);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Audit failed. Please verify your subscription parameters.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="analyzer" className="relative py-12 px-4 sm:px-6 lg:px-8 bg-[#211611]">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Section Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#2B211D] border border-[#C28B3D]/30 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#E8C78E]" />
            <span className="text-[11px] uppercase tracking-widest font-bold text-[#E8C78E]">
              Subscription Intelligence Workspace
            </span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl text-[#F5EBDD] font-bold mb-3">
            Verify what was promised against what gets charged.
          </h2>

          <p className="text-xs sm:text-sm text-[#F5EBDD]/70 max-w-2xl mx-auto font-sans leading-relaxed">
            Reconcile advertised merchant offers, your accepted checkout commitments, and actual UPI AutoPay debit rules.
            No more hidden post-trial price hikes or unannounced mandate ceilings.
          </p>
        </div>

        {/* 1-Click Working Benchmark Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#2B211D] via-[#35251C] to-[#2B211D] border-2 border-[#C28B3D]/40 shadow-[0_4px_20px_rgba(194,139,61,0.15)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="px-2 py-0.5 rounded bg-[#C28B3D] text-[#211611] font-mono text-[10px] font-extrabold uppercase">
                Hackathon Benchmark
              </span>
              <span className="text-xs font-bold text-[#E8C78E]">
                Original ₹299 vs ₹499 Discrepancy Scenario
              </span>
            </div>
            <p className="text-[11px] text-[#F5EBDD]/70">
              Checkout promised: <strong className="text-[#F5EBDD]">₹99 intro</strong>, then <strong className="text-[#F5EBDD]">₹299/mo</strong> renewal. AutoPay Mandate configured: <strong className="text-amber-400">₹499/mo</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRunOriginalBenchmark}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#85543A] via-[#C28B3D] to-[#E8C78E] text-[#211611] font-bold text-xs font-mono uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#211611]" />
            <span>⭐ Test Original ₹299 vs ₹499 Mismatch</span>
          </button>
        </div>

        {/* Main Input Workspace Card */}
        <div className="metallic-card rounded-2xl p-6 sm:p-8 relative">
          {/* macOS-Inspired Segmented Mode Toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1.5 rounded-2xl bg-[#1A110D] border border-[#C28B3D]/30 shadow-inner">
              <button
                type="button"
                onClick={() => setInputMode('URL_ASSISTED')}
                className={`px-5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  inputMode === 'URL_ASSISTED'
                    ? 'bg-gradient-to-r from-[#85543A] to-[#C28B3D] text-[#F5EBDD] shadow-md'
                    : 'text-[#A77E5C] hover:text-[#F5EBDD]'
                }`}
              >
                <span>MODE A — Analyse Merchant URL</span>
                <span className="text-[10px] opacity-70">(URL + Details)</span>
              </button>

              <button
                type="button"
                onClick={() => setInputMode('MANUAL')}
                className={`px-5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  inputMode === 'MANUAL'
                    ? 'bg-gradient-to-r from-[#85543A] to-[#C28B3D] text-[#F5EBDD] shadow-md'
                    : 'text-[#A77E5C] hover:text-[#F5EBDD]'
                }`}
              >
                <span>MODE B — Enter Subscription Manually</span>
                <span className="text-[10px] opacity-70">(No URL required)</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mode A: Optional URL input */}
            {inputMode === 'URL_ASSISTED' && (
              <div className="p-4 rounded-xl bg-[#211611]/80 border border-[#C28B3D]/30 space-y-2">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#E8C78E] flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-[#C28B3D]" />
                    <span>Merchant Subscription or Checkout URL</span>
                  </span>
                  <span className="text-[10px] text-[#A77E5C] font-normal">Optional / Disclosures Enrichment</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/pricing or checkout link..."
                    className="w-full pl-3 pr-4 py-3 rounded-lg bg-[#2B211D] border border-[#C28B3D]/40 text-[#F5EBDD] text-xs font-mono placeholder-[#F5EBDD]/30 focus:outline-none focus:border-[#E8C78E]"
                  />
                </div>
                <p className="text-[11px] text-[#A77E5C]">
                  If provided, our AI crawler ingests the live webpage DOM to extract verbatim regulatory disclosures.
                </p>
              </div>
            )}

            {/* Core User Subscription Parameters (MANDATORY in both modes) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#C28B3D]/20 pb-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8C78E] flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#C28B3D]" />
                  <span>Mandatory Subscription Parameters (Your Selection)</span>
                </span>
                <span className="text-[10px] text-[#A77E5C] font-mono">* Required for Plan Reconciliation</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono text-[#A77E5C] mb-1">
                    Merchant / Provider Name {inputMode === 'MANUAL' && <span className="text-rose-400">*</span>}
                  </label>
                  <input
                    type="text"
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    placeholder="e.g. Netflix, Spotify, StreamFlix"
                    className="w-full px-3 py-2.5 rounded-lg bg-[#211611] border border-[#C28B3D]/30 text-xs text-[#F5EBDD] focus:outline-none focus:border-[#C28B3D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#A77E5C] mb-1">
                    Selected Plan Name / Tier <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder="e.g. Premium HD, Individual, Family"
                    className="w-full px-3 py-2.5 rounded-lg bg-[#211611] border border-[#C28B3D]/30 text-xs text-[#F5EBDD] focus:outline-none focus:border-[#C28B3D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-mono text-[#A77E5C] mb-1">
                    Price Promised or Selected (₹) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={userPromisedPrice}
                    onChange={(e) => setUserPromisedPrice(e.target.value)}
                    placeholder="e.g. 299.00"
                    className="w-full px-3 py-2.5 rounded-lg bg-[#211611] border border-[#C28B3D]/40 text-xs text-[#E8C78E] font-bold focus:outline-none focus:border-[#E8C78E]"
                  />
                  <span className="text-[10px] text-[#A77E5C] mt-0.5 block">What you expect to pay</span>
                </div>

                {inputMode === 'MANUAL' && (
                  <div>
                    <label className="block text-[11px] font-mono text-[#A77E5C] mb-1">
                      Advertised Regular Price (₹) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={advertisedRegularPrice}
                      onChange={(e) => setAdvertisedRegularPrice(e.target.value)}
                      placeholder="e.g. 299.00"
                      className="w-full px-3 py-2.5 rounded-lg bg-[#211611] border border-[#C28B3D]/30 text-xs text-[#F5EBDD] focus:outline-none focus:border-[#C28B3D]"
                    />
                    <span className="text-[10px] text-[#A77E5C] mt-0.5 block">Standard listed rate</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-mono text-[#A77E5C] mb-1">
                    Billing Frequency <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={billingFrequency}
                    onChange={(e) => setBillingFrequency(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#211611] border border-[#C28B3D]/30 text-xs text-[#F5EBDD] focus:outline-none focus:border-[#C28B3D]"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Semi-Annual">Semi-Annual</option>
                    <option value="Annual">Annual</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Actual Debit / Charging Status */}
            <div className="p-4 rounded-xl bg-[#211611]/60 border border-[#C28B3D]/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#F5EBDD]">
                  Payment Debit Verification
                </span>
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-mono text-[#E8C78E]">
                  <input
                    type="checkbox"
                    checked={isNotYetCharged}
                    onChange={(e) => setIsNotYetCharged(e.target.checked)}
                    className="rounded bg-[#2B211D] border-[#C28B3D]/40 text-[#C28B3D] focus:ring-0 cursor-pointer"
                  />
                  <span>Not yet charged / evaluating subscription</span>
                </label>
              </div>

              {!isNotYetCharged && (
                <div className="pt-2 animate-fadeIn grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono text-[#A77E5C] mb-1">
                      Actual Amount Debited or Shown at Checkout (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={actualChargedPrice}
                      onChange={(e) => setActualChargedPrice(e.target.value)}
                      placeholder="e.g. 299.00 or 499.00"
                      className="w-full px-3 py-2 rounded-lg bg-[#2B211D] border border-[#C28B3D]/40 text-xs text-[#F5EBDD] font-bold focus:outline-none focus:border-[#E8C78E]"
                    />
                  </div>
                  <div className="text-[11px] text-[#A77E5C] flex items-center">
                    Enter the exact figure debited from your bank account or payment notification.
                  </div>
                </div>
              )}
            </div>

            {/* Introductory Offer & Trial Accordion */}
            <div className="p-4 rounded-xl bg-[#211611]/60 border border-[#C28B3D]/20 space-y-3">
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-mono font-bold text-[#F5EBDD]">
                  <input
                    type="checkbox"
                    checked={hasIntroOffer}
                    onChange={(e) => setHasIntroOffer(e.target.checked)}
                    className="rounded bg-[#2B211D] border-[#C28B3D]/40 text-[#C28B3D] focus:ring-0 cursor-pointer"
                  />
                  <span>Include Introductory Offer / Free Trial</span>
                </label>
                <span className="text-[10px] text-[#A77E5C] font-mono">Optional</span>
              </div>

              {hasIntroOffer && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 animate-fadeIn">
                  <div>
                    <label className="block text-[11px] font-mono text-[#A77E5C] mb-1">
                      Introductory Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={introPrice}
                      onChange={(e) => setIntroPrice(e.target.value)}
                      placeholder="e.g. 99.00"
                      className="w-full px-3 py-2 rounded-lg bg-[#2B211D] border border-[#C28B3D]/30 text-xs text-[#F5EBDD] focus:outline-none focus:border-[#C28B3D]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#A77E5C] mb-1">
                      Intro Duration (Months)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={introMonths}
                      onChange={(e) => setIntroMonths(e.target.value)}
                      placeholder="e.g. 1, 3"
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
                      value={freeTrialDays}
                      onChange={(e) => setFreeTrialDays(e.target.value)}
                      placeholder="e.g. 7, 14, 30"
                      className="w-full px-3 py-2 rounded-lg bg-[#2B211D] border border-[#C28B3D]/30 text-xs text-[#F5EBDD] focus:outline-none focus:border-[#C28B3D]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Coupon Code Accordion */}
            <div className="p-4 rounded-xl bg-[#211611]/60 border border-[#C28B3D]/20 space-y-3">
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-mono font-bold text-[#F5EBDD]">
                  <input
                    type="checkbox"
                    checked={hasCoupon}
                    onChange={(e) => setHasCoupon(e.target.checked)}
                    className="rounded bg-[#2B211D] border-[#C28B3D]/40 text-[#C28B3D] focus:ring-0 cursor-pointer"
                  />
                  <span>Apply Promotional Coupon Code</span>
                </label>
                <span className="text-[10px] text-[#A77E5C] font-mono">Optional</span>
              </div>

              {hasCoupon && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 animate-fadeIn">
                  <div>
                    <label className="block text-[11px] font-mono text-[#A77E5C] mb-1">Coupon Code</label>
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="e.g. SAVE50, WELCOME"
                      className="w-full px-3 py-2 rounded-lg bg-[#2B211D] border border-[#C28B3D]/30 text-xs text-[#F5EBDD] focus:outline-none focus:border-[#C28B3D]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#A77E5C] mb-1">Fixed Off (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={couponDiscount}
                      onChange={(e) => setCouponDiscount(e.target.value)}
                      placeholder="e.g. 50.00"
                      className="w-full px-3 py-2 rounded-lg bg-[#2B211D] border border-[#C28B3D]/30 text-xs text-[#F5EBDD] focus:outline-none focus:border-[#C28B3D]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#A77E5C] mb-1">Percentage Off (%)</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={couponDiscountPct}
                      onChange={(e) => setCouponDiscountPct(e.target.value)}
                      placeholder="e.g. 20"
                      className="w-full px-3 py-2 rounded-lg bg-[#2B211D] border border-[#C28B3D]/30 text-xs text-[#F5EBDD] focus:outline-none focus:border-[#C28B3D]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Recurring Mandate Configuration (Source C) */}
            <div className="p-4 rounded-xl bg-[#211611]/60 border border-[#C28B3D]/20 space-y-3">
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-mono font-bold text-[#F5EBDD]">
                  <input
                    type="checkbox"
                    checked={hasMandateConfig}
                    onChange={(e) => setHasMandateConfig(e.target.checked)}
                    className="rounded bg-[#2B211D] border-[#C28B3D]/40 text-[#C28B3D] focus:ring-0 cursor-pointer"
                  />
                  <span>Configure Recurring Payment Mandate (Source C)</span>
                </label>
                <span className="text-[10px] text-[#A77E5C] font-mono">AutoPay Execution Rule</span>
              </div>

              {hasMandateConfig && (
                <div className="pt-2 animate-fadeIn space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-[#A77E5C] mb-1">
                        Mandate Recurring Cap (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={mandateAmount}
                        onChange={(e) => setMandateAmount(e.target.value)}
                        placeholder="e.g. 499.00"
                        className="w-full px-3 py-2 rounded-lg bg-[#2B211D] border border-[#C28B3D]/30 text-xs text-[#E8C78E] font-bold focus:outline-none focus:border-[#E8C78E]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-[#A77E5C] mb-1">
                        Mandate Frequency
                      </label>
                      <select
                        value={mandateFrequency}
                        onChange={(e) => setMandateFrequency(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#2B211D] border border-[#C28B3D]/30 text-xs text-[#F5EBDD] focus:outline-none focus:border-[#C28B3D]"
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="Annual">Annual</option>
                        <option value="Weekly">Weekly</option>
                        <option value="As & when presented">As & when presented</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-[#A77E5C] mb-1">
                        Mandate UMIN (Optional)
                      </label>
                      <input
                        type="text"
                        value={mandateUmin}
                        onChange={(e) => setMandateUmin(e.target.value)}
                        placeholder="e.g. UMIN123456@npci"
                        className="w-full px-3 py-2 rounded-lg bg-[#2B211D] border border-[#C28B3D]/30 text-xs text-[#F5EBDD] focus:outline-none focus:border-[#C28B3D]"
                      />
                    </div>
                  </div>

                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-mono text-[#A77E5C]">
                    <input
                      type="checkbox"
                      checked={isSimulatedMandate}
                      onChange={(e) => setIsSimulatedMandate(e.target.checked)}
                      className="rounded bg-[#2B211D] border-[#C28B3D]/40 text-[#C28B3D] focus:ring-0 cursor-pointer"
                    />
                    <span>Mark as Simulated Test Mandate (Adds honest non-bank disclaimer)</span>
                  </label>
                </div>
              )}
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-[#85543A]/25 border border-[#85543A] flex items-start gap-3 text-xs sm:text-sm text-[#F5EBDD]">
                <AlertCircle className="w-5 h-5 text-[#E8C78E] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold text-[#E8C78E] block mb-0.5">Input Validation Notice</span>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#85543A] via-[#C28B3D] to-[#E8C78E] text-[#211611] font-bold text-sm tracking-widest uppercase shadow-[0_8px_25px_rgba(194,139,61,0.3)] hover:shadow-[0_12px_35px_rgba(194,139,61,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-[#211611]" />
                  <span>Auditing Disclosures & Reconciling Commitments...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#211611]" />
                  <span>Execute 3-Way Subscription Audit</span>
                  <ArrowRight className="w-4 h-4 text-[#211611]" />
                </>
              )}
            </button>
          </form>

          {/* Real-Time Analysis Progress Steps */}
          {isLoading && (
            <div className="mt-8 pt-6 border-t border-[#C28B3D]/20 animate-fade-in">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8C78E] mb-4 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#C28B3D]" />
                <span>Deterministic Execution Pipeline:</span>
              </h4>
              <div className="flex flex-col gap-3">
                {stages.map((stage, idx) => {
                  const isDone = idx < progressStage;
                  const isCurrent = idx === progressStage;
                  return (
                    <div
                      key={stage}
                      className={`flex items-center gap-3 text-xs font-mono transition-all ${
                        isDone
                          ? 'text-[#75836B]'
                          : isCurrent
                          ? 'text-[#E8C78E] font-bold'
                          : 'text-[#F5EBDD]/30'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle className="w-4 h-4 text-[#75836B] shrink-0" />
                      ) : isCurrent ? (
                        <div className="w-4 h-4 rounded-full border-2 border-[#E8C78E] border-t-transparent animate-spin shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-[#C28B3D]/30 shrink-0" />
                      )}
                      <span>{stage}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Curated Sample Presets */}
          {!isLoading && presets.length > 0 && (
            <div className="mt-8 pt-6 border-t border-[#C28B3D]/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#A77E5C] font-semibold">
                  Or Load Verified Test Drive Presets:
                </span>
                <span className="text-[10px] text-[#F5EBDD]/50 font-mono">1-Click Auto-Fill</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="p-3 rounded-xl bg-[#211611]/80 hover:bg-[#2B211D] border border-[#C28B3D]/20 hover:border-[#C28B3D]/60 text-left transition-all group flex items-start justify-between cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#F5EBDD] group-hover:text-[#E8C78E] transition-colors">
                          {preset.name}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#85543A]/30 text-[#E8C78E] font-mono">
                          {preset.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#F5EBDD]/60 mt-1 line-clamp-1">
                        {preset.description}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#C28B3D] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
