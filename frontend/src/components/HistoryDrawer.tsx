import React, { useState, useEffect } from 'react';
import { History, X, ExternalLink, Calendar, Award, ChevronRight, RefreshCw, Trash2, Download } from 'lucide-react';
import { fetchAnalysesHistory, fetchAnalysisById, deleteAnalysisById, getPdfDownloadUrl } from '../services/api';
import { AnalysisSummary, AnalysisResponse } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAnalysis: (analysis: AnalysisResponse) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  onSelectAnalysis
}) => {
  const [history, setHistory] = useState<AnalysisSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadHistory = () => {
    setLoading(true);
    fetchAnalysesHistory()
      .then((data) => {
        setHistory(data);
        setLoading(false);
      })
      .catch((err) => {
        console.log('Error loading history:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = async (id: string) => {
    try {
      setLoading(true);
      const full = await fetchAnalysisById(id);
      onSelectAnalysis(full);
      onClose();
    } catch (err) {
      console.log('Could not load analysis details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this subscription analysis from your history?')) {
      return;
    }
    try {
      setDeletingId(id);
      await deleteAnalysisById(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Failed to delete analysis:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#170E0B]/70 backdrop-blur-sm animate-fade-in flex justify-end">
      <div className="relative w-full max-w-md h-full bg-[#211611] border-l border-[#C28B3D]/30 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#C28B3D]/20 flex items-center justify-between bg-[#2B211D]">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-[#E8C78E]" />
            <div>
              <h3 className="font-display text-lg font-bold text-[#F5EBDD]">
                My Subscription Audits
              </h3>
              <p className="text-[11px] text-[#A77E5C] font-mono">
                Isolated to your authenticated session
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#F5EBDD]/60 hover:text-[#E8C78E] hover:bg-[#211611] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-12 text-[#E8C78E]">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
          )}

          {!loading && history.length === 0 && (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-full bg-[#2B211D] border border-[#C28B3D]/30 flex items-center justify-center mx-auto mb-3 text-[#A77E5C]">
                <History className="w-6 h-6" />
              </div>
              <h4 className="font-serif text-base font-bold text-[#F5EBDD] mb-1">
                No Past Analyses Stored Yet
              </h4>
              <p className="text-xs text-[#F5EBDD]/60 font-sans">
                As you audit merchant URLs, real analysis records and payment timelines will be preserved in your database.
              </p>
            </div>
          )}

          {!loading &&
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className="p-4 rounded-xl bg-[#2B211D]/70 border border-[#C28B3D]/20 hover:border-[#C28B3D]/60 hover:bg-[#2B211D] cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-[#F5EBDD] group-hover:text-[#E8C78E] transition-colors">
                    {item.merchant_name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                        item.transparency_score >= 80
                          ? 'bg-[#75836B]/20 text-[#75836B]'
                          : item.transparency_score >= 50
                          ? 'bg-[#C28B3D]/20 text-[#E8C78E]'
                          : 'bg-[#85543A]/30 text-[#F5EBDD]'
                      }`}
                    >
                      {item.transparency_score}/100
                    </span>
                    <span className="text-xs font-mono font-bold text-[#E8C78E]">
                      ({item.transparency_grade})
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-[#A77E5C] font-mono truncate mb-2">
                  {item.source_url}
                </p>

                <div className="flex items-center justify-between text-[10px] text-[#F5EBDD]/60 font-mono pt-2 border-t border-[#C28B3D]/10">
                  <span>{item.analyzed_at ? item.analyzed_at.slice(0, 10) : ''}</span>
                  <div className="flex items-center gap-2">
                    <a
                      href={getPdfDownloadUrl(item.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded text-[#A77E5C] hover:text-[#E8C78E] transition-colors"
                      title="Download PDF Report"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={(e) => handleDelete(e, item.id)}
                      className="p-1 rounded text-[#A77E5C] hover:text-red-400 transition-colors"
                      title="Delete from History"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center gap-1 text-[#E8C78E] pl-1">
                      <span>View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
