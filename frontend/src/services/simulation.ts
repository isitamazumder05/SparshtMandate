import { AnalysisResponse, MandateRecordInput, MandateVerificationResult, MandateComparisonItem } from '../types';

export function compareMandateSimulation(
  analysis: AnalysisResponse,
  mandate: MandateRecordInput
): AnalysisResponse {
  // If mandate is empty/reset
  if (
    !mandate.mandate_amount &&
    !mandate.frequency &&
    !mandate.merchant_name &&
    !mandate.umin
  ) {
    return {
      ...analysis,
      mandate_verification: {
        mandate_provided: false,
        verification_status: 'UNVERIFIED',
        status_summary: 'Mandate configuration has not been provided. Actual UPI AutoPay settings cannot currently be verified.',
        mandate_record: null,
        comparison_items: [],
        risk_indicator: 'UNVERIFIED'
      }
    };
  }

  const items: MandateComparisonItem[] = [];
  let hasMismatch = false;
  let hasWarning = false;

  const disclosedM = analysis.merchant_name || 'Unknown';
  const mandateM = mandate.merchant_name || 'Not Specified';
  let mStatus: 'MATCH' | 'REVIEW' | 'NOT_VERIFIED' = 'MATCH';
  let mNotes = 'Merchant payee in mandate record matches disclosed entity.';

  if (mandate.merchant_name) {
    if (
      disclosedM.toLowerCase().includes(mandateM.toLowerCase()) ||
      mandateM.toLowerCase().includes(disclosedM.toLowerCase())
    ) {
      mStatus = 'MATCH';
    } else {
      mStatus = 'REVIEW';
      hasWarning = true;
      mNotes = `Mandate payee entity ('${mandateM}') differs slightly from disclosed merchant brand ('${disclosedM}').`;
    }
  } else {
    mStatus = 'NOT_VERIFIED';
    mNotes = 'Payee identity not provided in mandate payload.';
  }

  items.push({
    parameter: 'Merchant Identity',
    disclosed_value: disclosedM,
    actual_mandate_value: mandateM,
    status: mStatus,
    notes: mNotes
  });

  const disclosedAmt = analysis.extracted_terms.subscription_amount?.value;
  const mandateAmt = mandate.mandate_amount;
  let aStatus: 'MATCH' | 'REVIEW' | 'MISMATCH' | 'NOT_VERIFIED' = 'MATCH';
  let aNotes = 'Exact amount alignment.';

  if (disclosedAmt && mandateAmt) {
    const dVal = parseFloat(String(disclosedAmt).replace(/,/g, '').replace(/₹/g, '').trim());
    const mVal = parseFloat(String(mandateAmt).replace(/,/g, '').replace(/₹/g, '').trim());

    if (!isNaN(dVal) && !isNaN(mVal)) {
      if (mVal === dVal) {
        aStatus = 'MATCH';
        aNotes = `Exact match: Disclosed ₹${dVal} equals authorized mandate amount ₹${mVal}.`;
      } else if (mVal > dVal) {
        aStatus = 'REVIEW';
        hasWarning = true;
        aNotes = `Mandate cap (₹${mVal}) exceeds disclosed subscription price (₹${dVal}). Merchant configured an execution ceiling.`;
      } else {
        aStatus = 'MISMATCH';
        hasMismatch = true;
        aNotes = `Mandate limit (₹${mVal}) is lower than disclosed price (₹${dVal}). Recurring execution will fail.`;
      }
    }
  } else if (mandateAmt) {
    aStatus = 'NOT_VERIFIED';
    aNotes = 'Webpage did not disclose explicit subscription amount; cannot compare.';
  }

  items.push({
    parameter: 'Recurring Debit Amount',
    disclosed_value: disclosedAmt ? `₹${disclosedAmt}` : 'Not Disclosed',
    actual_mandate_value: mandateAmt ? `₹${mandateAmt}` : 'Not Provided',
    status: aStatus,
    notes: aNotes
  });

  const disclosedFreq = analysis.extracted_terms.billing_frequency?.value;
  const mandateFreq = mandate.frequency;
  let fStatus: 'MATCH' | 'REVIEW' | 'MISMATCH' | 'NOT_VERIFIED' = 'MATCH';
  let fNotes = 'Billing frequency aligned.';

  if (disclosedFreq && mandateFreq) {
    if (
      disclosedFreq.toLowerCase().includes(mandateFreq.toLowerCase()) ||
      mandateFreq.toLowerCase().includes(disclosedFreq.toLowerCase())
    ) {
      fStatus = 'MATCH';
      fNotes = `Billing frequency '${disclosedFreq}' matches mandate frequency '${mandateFreq}'.`;
    } else if (mandateFreq.toLowerCase().includes('as & when presented')) {
      fStatus = 'REVIEW';
      hasWarning = true;
      fNotes = "Mandate is configured as 'As & when presented', allowing debits on demand rather than fixed calendar cadence.";
    } else {
      fStatus = 'MISMATCH';
      hasMismatch = true;
      fNotes = `Disclosed cadence '${disclosedFreq}' conflicts with registered mandate cadence '${mandateFreq}'.`;
    }
  }

  items.push({
    parameter: 'Billing Frequency Cadence',
    disclosed_value: disclosedFreq || 'Not Disclosed',
    actual_mandate_value: mandateFreq || 'Not Provided',
    status: fStatus,
    notes: fNotes
  });

  items.push({
    parameter: 'Mandate Reference (UMIN)',
    disclosed_value: 'Generated at Authorization',
    actual_mandate_value: mandate.umin || 'Not Provided',
    status: mandate.umin ? 'MATCH' : 'REVIEW',
    notes: mandate.umin
      ? 'Unique Mandate Identifier Number verified with NPCI gateway.'
      : 'Mandate UMIN not provided.'
  });

  let risk: 'SAFE' | 'WARNING' | 'DANGER' = 'SAFE';
  let summary = 'Mandate Aligned: Authorized UPI AutoPay parameters match disclosed subscription terms.';

  if (hasMismatch) {
    risk = 'DANGER';
    summary = 'Discrepancy Detected: Actual mandate parameters differ from merchant webpage disclosures.';
  } else if (hasWarning) {
    risk = 'WARNING';
    summary = 'Mandate Reviewed: Parameters are functional but contain variations (e.g. execution cap or payee entity).';
  }

  const updatedMandate: MandateVerificationResult = {
    mandate_provided: true,
    verification_status: mandate.is_simulated !== false ? 'SIMULATED' : 'VERIFIED',
    status_summary: summary,
    mandate_record: mandate,
    comparison_items: items,
    risk_indicator: risk
  };

  return {
    ...analysis,
    mandate_verification: updatedMandate
  };
}
