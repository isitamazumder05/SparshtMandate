import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, CheckCircle2, AlertTriangle, XCircle, Info, RefreshCw, KeyRound, Sparkles } from 'lucide-react';
import { MandateVerificationResult, MandateRecordInput } from '../types';

interface MandateVerificationPanelProps {
  mandateResult: MandateVerificationResult;
  merchantName: string;
  disclosedAmount: string | null;
  disclosedFrequency: string | null;
  onSimulateMandate: (simulatedMandate: MandateRecordInput) => void;
}

export const MandateVerificationPanel: React.FC<MandateVerificationPanelProps> = ({
  mandateResult,
  merchantName,
  disclosedAmount,
  disclosedFrequency,
  onSimulateMandate
}) => {
  const [showSimulator, setShowSimulator] = useState(false);
  const [simAmount, setSimAmount] = useState(disclosedAmount || '199');
  const [simFreq, setSimFreq] = useState(disclosedFrequency || 'Monthly');
  const [simPayee, setSimPayee] = useState(merchantName);
  const [simUmin, setSimUmin] = useState('AUTOPAY-MANDATE-789456123@npci');

  const handleTestSimulation = (presetType: 'MATCH' | 'CAP_MISMATCH' | 'FREQUENCY_MISMATCH') => {
    if (presetType === 'MATCH') {
      onSimulateMandate({
        merchant_name: merchantName,
        mandate_amount: disclosedAmount || '199',
        frequency: disclosedFrequency || 'Monthly',
        umin: 'AUTOPAY-MATCH-2026@npci',
        mandate_validity: '365 Days'
      });
    } else if (presetType === 'CAP_MISMATCH') {
      // Disclosed is low (e.g. 199), but mandate authorizes up to 5000 max execution limit
      onSimulateMandate({
        merchant_name: `${merchantName} Payments India Ltd`,
        mandate_amount: '5000',
        frequency: disclosedFrequency || 'Monthly',
        umin: 'AUTOPAY-CAP-5000@npci',
        mandate_validity: 'As Presented'
      });
    } else {
      onSimulateMandate({
        merchant_name: merchantName,
        mandate_amount: disclosedAmount || '199',
        frequency: 'As & when presented',
        umin: 'AUTOPAY-ON-DEMAND@npci',
        mandate_validity: 'Indefinite'
      });
    }
  };

  return (
    <div className="metallic-card rounded-2xl p-6 sm:p-8 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#C28B3D]/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display text-xl font-bold text-[#F5EBDD]">
              Actual UPI AutoPay Mandate Verification
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#85543A]/30 text-[#E8C78E] font-mono uppercase font-bold">
              NPCI Architecture
            </span>
          </div>
          <p className="text-xs text-[#F5EBDD]/70 font-sans">
            Compares public merchant disclosures against authorized UPI AutoPay mandate configuration records.
          </p>
        </div>

        {/* State Badge */}
        <div>
          {mandateResult.verification_status === 'VERIFIED' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#75836B]/20 border border-[#75836B] text-[#75836B] font-mono text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              VERIFIED MANDATE
            </span>
          ) : mandateResult.verification_status === 'SIMULATED' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold">
              <AlertTriangle className="w-4 h-4" />
              SIMULATED TEST DATA
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2B211D] border border-[#C28B3D]/30 text-[#A77E5C] font-mono text-xs font-medium">
              <ShieldAlert className="w-4 h-4 text-[#C28B3D]" />
              UNVERIFIED MANDATE
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {!mandateResult.mandate_provided ? (
        /* Authentically Unverified State (Section 9 Requirement) */
        <div className="py-8 text-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-[#2B211D] border border-[#C28B3D]/30 flex items-center justify-center mx-auto mb-4 text-[#C28B3D]">
            <KeyRound className="w-8 h-8" />
          </div>

          <h4 className="font-serif text-lg font-bold text-[#E8C78E] mb-2">
            "Actual UPI AutoPay mandate configuration has not been provided. Mandate verification is currently unavailable."
          </h4>

          <p className="text-xs text-[#F5EBDD]/70 font-sans leading-relaxed mb-6">
            In compliance with Paytm Hackathon guidelines and financial privacy ethics, SpashtMandate AI does not fabricate mandate records or manufacture false verification claims. Authentic mandate verification requires an authorized mandate configuration payload.
          </p>

          <div className="p-4 rounded-xl bg-[#211611]/80 border border-[#85543A]/30 text-left text-xs font-mono text-[#F5EBDD]/80 mb-6">
            <span className="text-[#E8C78E] font-bold block mb-1">Architecture Ready for Authorized Records:</span>
            <ul className="list-disc list-inside space-y-1 text-[#F5EBDD]/70 text-[11px]">
              <li>Reconciles stated plan fee vs UPI AutoPay maximum execution cap.</li>
              <li>Detects "As & when presented" cadence anomalies vs stated monthly billing.</li>
              <li>Validates NPCI Unique Mandate Identifier Number (UMIN) registration.</li>
            </ul>
          </div>

          {/* Test Mandate Verification Simulation */}
          <div className="p-5 rounded-xl bg-[#2B211D]/80 border border-[#C28B3D]/30 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8C78E] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#E8C78E]" />
                Test Drive Mandate Comparison Simulator:
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300 font-mono font-bold uppercase">
                Simulated Test Environment &bull; No Real Debits
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleTestSimulation('MATCH')}
                className="p-2.5 rounded-lg bg-[#211611] hover:bg-[#85543A]/30 border border-[#75836B]/40 text-left transition-all cursor-pointer"
              >
                <div className="text-[11px] font-bold text-[#75836B]">1. Exact Match Payload</div>
                <div className="text-[10px] text-[#F5EBDD]/60 mt-0.5">Mandate amount equals disclosed price</div>
              </button>

              <button
                type="button"
                onClick={() => handleTestSimulation('CAP_MISMATCH')}
                className="p-2.5 rounded-lg bg-[#211611] hover:bg-[#85543A]/30 border border-[#C28B3D]/40 text-left transition-all cursor-pointer"
              >
                <div className="text-[11px] font-bold text-[#E8C78E]">2. High Cap Variance (₹5,000)</div>
                <div className="text-[10px] text-[#F5EBDD]/60 mt-0.5">Disclosed ₹{disclosedAmount || '199'} vs ₹5,000 Cap</div>
              </button>

              <button
                type="button"
                onClick={() => handleTestSimulation('FREQUENCY_MISMATCH')}
                className="p-2.5 rounded-lg bg-[#211611] hover:bg-[#85543A]/30 border border-[#85543A]/60 text-left transition-all cursor-pointer"
              >
                <div className="text-[11px] font-bold text-[#F5EBDD]">3. "As Presented" Cadence</div>
                <div className="text-[10px] text-[#F5EBDD]/60 mt-0.5">On-demand debit schedule anomaly</div>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Verified Comparison Output */
        <div className="py-6">
          {mandateResult.verification_status === 'SIMULATED' && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 mb-6 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-mono font-bold text-amber-300 block uppercase tracking-wider">
                  Test Simulation Notice
                </span>
                <p className="text-xs text-[#F5EBDD] font-mono mt-0.5 font-bold">
                  SIMULATED TEST DATA — NO REAL PAYMENT OR BANK MANDATE ACCESSED.
                </p>
                <p className="text-[11px] text-[#A77E5C] mt-1">
                  Parameters were provided for evaluation and discrepancy testing. In accordance with NPCI consumer protection principles, genuine mandates require end-user bank authorization.
                </p>
              </div>
            </div>
          )}

          <div className="p-4 rounded-xl bg-[#211611]/80 border border-[#C28B3D]/30 mb-6 flex items-start gap-3">
            <Info className="w-5 h-5 text-[#E8C78E] shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-[#E8C78E] block uppercase tracking-wider">
                Comparison Summary
              </span>
              <p className="text-xs text-[#F5EBDD]/80 font-sans mt-0.5">
                {mandateResult.status_summary}
              </p>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#C28B3D]/30 text-[#A77E5C] uppercase text-[10px] tracking-wider">
                  <th className="pb-3 font-semibold">Parameter</th>
                  <th className="pb-3 font-semibold">Webpage Disclosed Term</th>
                  <th className="pb-3 font-semibold">Actual Mandate Setting</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Provenance & Analysis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C28B3D]/10">
                {mandateResult.comparison_items.map((item) => (
                  <tr key={item.parameter} className="hover:bg-[#2B211D]/40">
                    <td className="py-3.5 font-bold text-[#F5EBDD]">{item.parameter}</td>
                    <td className="py-3.5 text-[#F5EBDD]/80">{item.disclosed_value || 'Not Disclosed'}</td>
                    <td className="py-3.5 font-bold text-[#E8C78E]">{item.actual_mandate_value || 'Not Provided'}</td>
                    <td className="py-3.5">
                      {item.status === 'MATCH' && (
                        <span className="px-2 py-0.5 rounded bg-[#75836B]/20 text-[#75836B] font-bold text-[10px]">
                          MATCH
                        </span>
                      )}
                      {item.status === 'REVIEW' && (
                        <span className="px-2 py-0.5 rounded bg-[#C28B3D]/20 text-[#E8C78E] font-bold text-[10px]">
                          REVIEW
                        </span>
                      )}
                      {item.status === 'MISMATCH' && (
                        <span className="px-2 py-0.5 rounded bg-[#85543A]/30 text-[#F5EBDD] font-bold text-[10px]">
                          MISMATCH
                        </span>
                      )}
                      {item.status === 'NOT_VERIFIED' && (
                        <span className="px-2 py-0.5 rounded bg-[#2B211D] text-[#A77E5C] text-[10px]">
                          UNVERIFIED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 text-[11px] text-[#F5EBDD]/70 font-sans max-w-xs">
                      {item.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => onSimulateMandate({})}
              className="text-xs text-[#A77E5C] hover:text-[#E8C78E] font-mono underline cursor-pointer"
            >
              Reset to Authentic Unverified Mandate State
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
