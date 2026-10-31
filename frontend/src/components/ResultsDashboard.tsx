import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Download,
  LayoutDashboard,
  Sliders,
  Percent,
  Calendar,
  ShieldCheck,
  Award,
  Sparkles,
  History,
  FileText
} from 'lucide-react';
import { AnalysisResponse, MandateRecordInput } from '../types';
import { getPdfDownloadUrl } from '../services/api';
import { WorkspaceOverview } from './WorkspaceOverview';
import { PlanCheckerPanel } from './PlanCheckerPanel';
import { OffersIntelligencePanel } from './OffersIntelligencePanel';
import { SubscriptionTimeline } from './SubscriptionTimeline';
import { MandateVerificationPanel } from './MandateVerificationPanel';
import { ScorecardPanel } from './ScorecardPanel';
import { AssistantChatPanel } from './AssistantChatPanel';
import { MyAuditsPanel } from './MyAuditsPanel';

export type WorkspaceSection =
  | 'OVERVIEW'
  | 'PLAN_CHECKER'
  | 'OFFERS'
  | 'TIMELINE'
  | 'MANDATE_CHECK'
  | 'TRANSPARENCY_REPORT'
  | 'AI_ASSISTANT'
  | 'MY_AUDITS';

interface ResultsDashboardProps {
  analysis: AnalysisResponse;
  onReset: () => void;
  onSimulateMandate: (mandate: MandateRecordInput) => void;
  onOpenRegulatoryDocs: () => void;
  onUpdateAnalysis?: (updated: AnalysisResponse) => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  analysis: initialAnalysis,
  onReset,
  onSimulateMandate,
  onOpenRegulatoryDocs,
  onUpdateAnalysis
}) => {
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResponse>(initialAnalysis);
  const [activeSection, setActiveSection] = useState<WorkspaceSection>('OVERVIEW');

  useEffect(() => {
    setCurrentAnalysis(initialAnalysis);
  }, [initialAnalysis]);

  const handleUpdate = (updated: AnalysisResponse) => {
    setCurrentAnalysis(updated);
    if (onUpdateAnalysis) {
      onUpdateAnalysis(updated);
    }
  };

  const pdfUrl = getPdfDownloadUrl(currentAnalysis.id);

  // Workspace Nav Tabs configuration
  const tabs = [
    { id: 'OVERVIEW' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'PLAN_CHECKER' as const, label: 'Plan Checker', icon: Sliders },
    { id: 'OFFERS' as const, label: 'Offers & Discounts', icon: Percent },
    { id: 'TIMELINE' as const, label: 'Payment Timeline', icon: Calendar },
    { id: 'MANDATE_CHECK' as const, label: 'Mandate Check', icon: ShieldCheck },
    { id: 'TRANSPARENCY_REPORT' as const, label: 'Transparency Report', icon: Award },
    { id: 'AI_ASSISTANT' as const, label: 'AI Assistant', icon: Sparkles },
    { id: 'MY_AUDITS' as const, label: 'My Audits', icon: History }
  ];

  return (
    <div className="relative py-8 px-4 sm:px-6 lg:px-8 bg-[#211611] min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Control Bar: Audit Another Page, Engine Mode, PDF Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#C28B3D]/20">
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 text-xs uppercase font-mono font-bold tracking-wider text-[#A77E5C] hover:text-[#E8C78E] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Audit Another Merchant Page</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#A77E5C] font-mono hidden sm:inline">
              Engine: {currentAnalysis.extraction_mode}
            </span>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#85543A] via-[#C28B3D] to-[#E8C78E] text-[#211611] font-bold text-xs font-mono uppercase tracking-wider shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </a>
          </div>
        </div>

        {/* macOS-Inspired Segmented Workspace Navigation Bar */}
        <div className="flex justify-center">
          <div className="bg-[#2B211D]/80 backdrop-blur-md p-1.5 rounded-2xl border border-[#C28B3D]/30 inline-flex flex-wrap items-center justify-center gap-1 shadow-lg max-w-full">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#85543A] via-[#C28B3D] to-[#E8C78E] text-[#211611] shadow-md scale-[1.02]'
                      : 'text-[#A77E5C] hover:text-[#F5EBDD] hover:bg-[#85543A]/20'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Workspace Active Section View */}
        <div className="pt-2">
          {activeSection === 'OVERVIEW' && (
            <WorkspaceOverview
              analysis={currentAnalysis}
              onNavigateTab={(tabId) => setActiveSection(tabId as WorkspaceSection)}
              onOpenRegulatoryDocs={onOpenRegulatoryDocs}
            />
          )}

          {activeSection === 'PLAN_CHECKER' && (
            <PlanCheckerPanel
              analysis={currentAnalysis}
              onUpdateAnalysis={handleUpdate}
            />
          )}

          {activeSection === 'OFFERS' && (
            <OffersIntelligencePanel
              analysis={currentAnalysis}
            />
          )}

          {activeSection === 'TIMELINE' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="metallic-card rounded-2xl p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#F5EBDD] flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[#C28B3D]" />
                      <span>Chronological Payment Lifecycle Timeline</span>
                    </h2>
                    <p className="text-xs text-[#A77E5C] mt-1 max-w-2xl leading-relaxed">
                      Every event is strictly labeled as explicitly disclosed, calculated from terms, or relative timing.
                      Accounts for free trials, introductory promo periods, statutory 24h pre-debit notices, and recurring renewal cycles.
                    </p>
                  </div>
                </div>
              </div>

              <SubscriptionTimeline
                timeline={currentAnalysis.timeline}
                merchantName={currentAnalysis.merchant_name}
              />
            </div>
          )}

          {activeSection === 'MANDATE_CHECK' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="metallic-card rounded-2xl p-6 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-[#F5EBDD] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#C28B3D]" />
                  <span>UPI AutoPay Mandate Verification</span>
                </h2>
                <p className="text-xs text-[#A77E5C] mt-1 max-w-2xl leading-relaxed">
                  Authentic mandate reconciliation. When technical mandate records are not provided, an honest UNVERIFIED
                  status is displayed. Test potential debit cap variances using the clearly marked simulated environment.
                </p>
              </div>

              <MandateVerificationPanel
                mandateResult={currentAnalysis.mandate_verification}
                merchantName={currentAnalysis.merchant_name}
                disclosedAmount={currentAnalysis.extracted_terms.subscription_amount.value}
                disclosedFrequency={currentAnalysis.extracted_terms.billing_frequency.value}
                onSimulateMandate={onSimulateMandate}
              />
            </div>
          )}

          {activeSection === 'TRANSPARENCY_REPORT' && (
            <ScorecardPanel
              analysis={currentAnalysis}
              onOpenRegulatoryDocs={onOpenRegulatoryDocs}
            />
          )}

          {activeSection === 'AI_ASSISTANT' && (
            <AssistantChatPanel
              analysis={currentAnalysis}
              onOpenRegulatoryDocs={onOpenRegulatoryDocs}
            />
          )}

          {activeSection === 'MY_AUDITS' && (
            <MyAuditsPanel
              onSelectAnalysis={(selected) => {
                handleUpdate(selected);
                setActiveSection('OVERVIEW');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onAuditNewPage={onReset}
            />
          )}
        </div>
      </div>
    </div>
  );
};
