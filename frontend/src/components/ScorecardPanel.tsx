import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  Download,
  ExternalLink,
  HelpCircle,
  ShieldAlert,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { AnalysisResponse, ScoreCategory, AuditFinding } from '../types';
import { getPdfDownloadUrl } from '../services/api';

interface ScorecardPanelProps {
  analysis: AnalysisResponse;
  onOpenRegulatoryDocs: () => void;
}

export const ScorecardPanel: React.FC<ScorecardPanelProps> = ({
  analysis,
  onOpenRegulatoryDocs
}) => {
  const { scorecard, findings, id, transparency_score, transparency_grade } = analysis;
  const categories = scorecard?.categories || [];
  const [filter, setFilter] = useState<'ALL' | 'PASS' | 'REVIEW' | 'MISSING'>('ALL');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  const pdfUrl = getPdfDownloadUrl(id);

  const filteredCategories = categories.filter((c) => {
    if (filter === 'ALL') return true;
    if (filter === 'PASS') return c.status === 'PASS';
    if (filter === 'REVIEW') return c.status === 'PARTIAL' || c.status === 'REVIEW';
    if (filter === 'MISSING') return c.status === 'MISSING';
    return true;
  });

  const toggleExpand = (catId: string) => {
    setExpandedCategoryId((prev) => (prev === catId ? null : catId));
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header & PDF Download Action */}
      <div className="metallic-card rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] px-2.5 py-0.5 rounded bg-[#85543A]/30 text-[#E8C78E] font-mono font-bold uppercase tracking-wider">
                100-Point Deterministic Matrix
              </span>
              <span className="text-xs text-[#A77E5C] font-mono">
                8 Weighted Categories
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-[#F5EBDD] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#C28B3D]" />
              <span>Subscription Transparency Scorecard</span>
            </h2>

            <p className="text-xs text-[#A77E5C] mt-2 max-w-2xl leading-relaxed">
              Every point is explainable, deterministic, and grounded in verbatim quotes from the merchant's page.
              Evaluated against authentic NPCI UPI AutoPay Operating Circulars and RBI E-Mandate Master Directions.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-3xl font-extrabold text-[#E8C78E] font-mono">
                {transparency_score}/100
              </div>
              <div className="text-[10px] uppercase font-mono text-[#A77E5C]">
                Grade {transparency_grade}
              </div>
            </div>

            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#85543A] via-[#C28B3D] to-[#E8C78E] text-[#211611] font-bold text-xs font-mono uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Report</span>
            </a>
          </div>
        </div>

        {/* Regulatory Disclaimer Notice */}
        <div className="mt-6 p-3 rounded-xl bg-[#211611]/60 border border-[#C28B3D]/20 text-[11px] text-[#A77E5C] flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-[#C28B3D] flex-shrink-0 mt-0.5" />
          <p>
            <strong>Regulatory Notice:</strong> This score represents an objective transparency evaluation of disclosed terms.
            It does not constitute an official regulatory compliance certification or legal guarantee issued by the Reserve Bank of India (RBI) or NPCI.
          </p>
        </div>
      </div>

      {/* 2. Filter Pills */}
      <div className="flex items-center gap-2 pb-2 overflow-x-auto">
        <span className="text-xs font-mono text-[#A77E5C] mr-2">Filter by Status:</span>
        {(['ALL', 'PASS', 'REVIEW', 'MISSING'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
              filter === st
                ? 'bg-[#C28B3D] text-[#211611]'
                : 'bg-[#2B211D] text-[#A77E5C] hover:text-[#F5EBDD] border border-[#C28B3D]/20'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* 3. Detailed 8-Category Score Breakdown */}
      <div className="space-y-4">
        {filteredCategories.map((cat: ScoreCategory) => {
          const isExpanded = expandedCategoryId === cat.category_id;
          const isFullPoints = cat.points_earned === cat.max_points;

          return (
            <div
              key={cat.category_id}
              className="metallic-card rounded-xl p-5 transition-all hover:border-[#C28B3D]/50"
            >
              {/* Category Header Row */}
              <div
                onClick={() => toggleExpand(cat.category_id)}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {cat.status === 'PASS' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : cat.status === 'MISSING' ? (
                      <AlertCircle className="w-5 h-5 text-rose-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#A77E5C]">{cat.category_id}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          cat.status === 'PASS'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : cat.status === 'MISSING'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {cat.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#F5EBDD] mt-0.5">{cat.title}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center">
                  <div className="text-right">
                    <span
                      className={`text-lg font-mono font-extrabold ${
                        isFullPoints ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {cat.points_earned}
                    </span>
                    <span className="text-xs font-mono text-[#A77E5C]"> / {cat.max_points} pts</span>
                  </div>

                  <button className="p-1 text-[#A77E5C] hover:text-[#F5EBDD] transition-colors">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Deduction Reason (Visible when deducted) */}
              {cat.reason_for_deduction && (
                <div className="mt-3 p-3 rounded-lg bg-amber-950/20 border border-amber-500/20 text-xs text-amber-200">
                  <strong>Deduction:</strong> {cat.reason_for_deduction}
                </div>
              )}

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-[#C28B3D]/10 space-y-3 text-xs animate-fadeIn">
                  {/* Evidence Snippet */}
                  {cat.evidence_used ? (
                    <div>
                      <span className="text-[11px] font-mono text-[#A77E5C] block mb-1">
                        Supporting Evidence from Merchant Page:
                      </span>
                      <blockquote className="p-3 rounded-lg bg-[#211611]/80 border-l-2 border-[#C28B3D] text-[#F5EBDD] italic font-serif leading-relaxed">
                        "{cat.evidence_used}"
                      </blockquote>
                    </div>
                  ) : (
                    <div className="text-[#A77E5C] italic">
                      No supporting text quote found on the audited journey page.
                    </div>
                  )}

                  {/* Customer Impact & Corrective Disclosure */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {cat.customer_impact && (
                      <div className="p-3 rounded-lg bg-[#211611]/50 border border-[#C28B3D]/10">
                        <span className="text-[10px] font-mono text-[#A77E5C] uppercase block mb-1">
                          Consumer Impact:
                        </span>
                        <p className="text-[#F5EBDD]/90 leading-relaxed">{cat.customer_impact}</p>
                      </div>
                    )}

                    {cat.suggested_corrective_disclosure && (
                      <div className="p-3 rounded-lg bg-[#211611]/50 border border-[#C28B3D]/10">
                        <span className="text-[10px] font-mono text-[#E8C78E] uppercase block mb-1">
                          Suggested Corrective Disclosure:
                        </span>
                        <p className="text-[#F5EBDD]/90 leading-relaxed font-mono text-[11px]">
                          {cat.suggested_corrective_disclosure}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Regulatory Authority Citation */}
                  {cat.regulatory_reference_id && (
                    <div className="pt-2 flex items-center justify-between text-[11px] text-[#A77E5C] font-mono">
                      <span>Authority: {cat.regulatory_authority || 'NPCI / RBI'}</span>
                      <button
                        onClick={onOpenRegulatoryDocs}
                        className="text-[#C28B3D] hover:text-[#E8C78E] transition-colors underline cursor-pointer"
                      >
                        Ref: {cat.regulatory_reference_id}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

