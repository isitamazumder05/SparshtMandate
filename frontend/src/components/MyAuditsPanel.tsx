import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  ExternalLink,
  Download,
  Trash2,
  Calendar,
  Award,
  RefreshCw,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { AnalysisSummary, AnalysisResponse } from '../types';
import { fetchAnalysesHistory, fetchAnalysisById, deleteAnalysisById, getPdfDownloadUrl } from '../services/api';

interface MyAuditsPanelProps {
  onSelectAnalysis: (analysis: AnalysisResponse) => void;
  onAuditNewPage: () => void;
}

export const MyAuditsPanel: React.FC<MyAuditsPanelProps> = ({
  onSelectAnalysis,
  onAuditNewPage
}) => {
  const [history, setHistory] = useState<AnalysisSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadHistory = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const items = await fetchAnalysesHistory();
      setHistory(items);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load past audits');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSelect = async (id: string) => {
    setIsLoading(true);
    try {
      const full = await fetchAnalysisById(id);
      onSelectAnalysis(full);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to open analysis record');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this subscription audit record?')) return;
    try {
      await deleteAnalysisById(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete record');
    }
  };

  const filteredHistory = history.filter((item) => {
    const q = searchTerm.toLowerCase();
    return (
      item.merchant_name.toLowerCase().includes(q) ||
      item.source_url.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="metallic-card rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] px-2.5 py-0.5 rounded bg-[#85543A]/30 text-[#E8C78E] font-mono font-bold uppercase tracking-wider">
                User Subscription Vault
              </span>
              <span className="text-xs text-[#A77E5C] font-mono">
                {history.length} Saved Record{history.length === 1 ? '' : 's'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#F5EBDD] flex items-center gap-2">
              <History className="w-5 h-5 text-[#C28B3D]" />
              <span>My Subscription Audits</span>
            </h2>
            <p className="text-xs text-[#A77E5C] mt-1 max-w-2xl leading-relaxed">
              Your historical subscription transparency audits and verified terms. Click any record to reopen in your
              workspace, compare pricing, or export updated PDF reports.
            </p>
          </div>

          <button
            onClick={onAuditNewPage}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#85543A] via-[#C28B3D] to-[#E8C78E] text-[#211611] font-bold text-xs font-mono uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 self-start sm:self-center cursor-pointer"
          >
            <span>+ Audit New Merchant</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-6 relative">
          <Search className="w-4 h-4 text-[#A77E5C] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search saved audits by merchant name or subscription URL..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#211611] border border-[#C28B3D]/30 text-xs text-[#F5EBDD] placeholder-[#A77E5C] focus:outline-none focus:border-[#C28B3D]"
          />
        </div>
      </div>

      {/* History Records List */}
      {isLoading ? (
        <div className="metallic-card rounded-2xl p-12 text-center text-xs text-[#A77E5C] flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#C28B3D]" />
          <span>Loading saved audits from database...</span>
        </div>
      ) : errorMsg ? (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs">
          {errorMsg}
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="metallic-card rounded-2xl p-12 text-center text-[#A77E5C] text-xs space-y-3">
          <p>No past subscription audit records match your search.</p>
          <button
            onClick={onAuditNewPage}
            className="px-4 py-2 rounded-lg bg-[#C28B3D] text-[#211611] font-mono font-bold text-xs hover:bg-[#E8C78E] transition-colors cursor-pointer"
          >
            Run an Audit Now
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className="metallic-card rounded-xl p-5 cursor-pointer hover:border-[#C28B3D] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-extrabold text-lg border flex-shrink-0 ${
                    item.transparency_grade.startsWith('A')
                      ? 'border-[#75836B]/50 bg-[#75836B]/15 text-[#75836B]'
                      : item.transparency_grade === 'B'
                      ? 'border-[#E8C78E]/50 bg-[#E8C78E]/15 text-[#E8C78E]'
                      : 'border-[#85543A]/50 bg-[#85543A]/15 text-[#85543A]'
                  }`}
                >
                  {item.transparency_grade}
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#F5EBDD] group-hover:text-[#E8C78E] transition-colors flex items-center gap-2">
                    <span>{item.merchant_name}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-[#C28B3D]" />
                  </h3>

                  <div className="text-xs text-[#A77E5C] font-mono truncate max-w-md mt-0.5">
                    {item.source_url}
                  </div>

                  <div className="flex items-center gap-4 text-[10px] font-mono text-[#A77E5C] mt-2">
                    <span>
                      {new Date(item.analyzed_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    <span>•</span>
                    <span>{item.timeline_event_count || 0} Timeline Events</span>
                    <span>•</span>
                    <span>{item.findings_count} Audit Rules</span>
                    {item.has_mandate && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-400">Mandate Verified</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <div className="text-right mr-2 hidden sm:block">
                  <div className="text-lg font-mono font-bold text-[#E8C78E]">
                    {item.transparency_score}/100
                  </div>
                  <div className="text-[9px] uppercase font-mono text-[#A77E5C]">
                    Transparency
                  </div>
                </div>

                <a
                  href={getPdfDownloadUrl(item.id)}
                  onClick={(e) => e.stopPropagation()}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Download PDF Report"
                  className="p-2.5 rounded-lg bg-[#211611] border border-[#C28B3D]/30 text-[#A77E5C] hover:text-[#E8C78E] hover:border-[#C28B3D] transition-colors"
                >
                  <Download className="w-4 h-4" />
                </a>

                <button
                  onClick={(e) => handleDelete(item.id, e)}
                  title="Delete Audit Record"
                  className="p-2.5 rounded-lg bg-[#211611] border border-[#C28B3D]/30 text-[#A77E5C] hover:text-red-400 hover:border-red-500/50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

