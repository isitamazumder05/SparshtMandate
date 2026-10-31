import React, { useState, useEffect } from 'react';
import { BookOpen, ExternalLink, X, Shield, Search, Filter } from 'lucide-react';
import { fetchRegulatoryReferences } from '../services/api';
import { RegulatoryReference } from '../types';

interface RegulatoryExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegulatoryExplorerModal: React.FC<RegulatoryExplorerModalProps> = ({
  isOpen,
  onClose
}) => {
  const [references, setReferences] = useState<RegulatoryReference[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAuthority, setSelectedAuthority] = useState<string>('ALL');

  useEffect(() => {
    if (isOpen) {
      fetchRegulatoryReferences()
        .then(setReferences)
        .catch((err) => console.log('Error fetching regulatory refs:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredRefs = references.filter((ref) => {
    const matchesSearch =
      ref.document_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.relevant_provision.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ref.circular_ref && ref.circular_ref.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesAuth =
      selectedAuthority === 'ALL' ||
      (selectedAuthority === 'RBI' && ref.authority.includes('Reserve Bank')) ||
      (selectedAuthority === 'NPCI' && ref.authority.includes('NPCI')) ||
      (selectedAuthority === 'PAYTM' && ref.authority.includes('Paytm'));

    return matchesSearch && matchesAuth;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#170E0B]/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[85vh] rounded-2xl bg-[#211611] border border-[#C28B3D]/30 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#C28B3D]/20 flex items-center justify-between bg-[#2B211D]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#85543A]/30 border border-[#C28B3D]/40 flex items-center justify-center text-[#E8C78E]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-[#F5EBDD]">
                Official Regulatory Knowledge Base
              </h3>
              <p className="text-xs text-[#A77E5C] font-mono">
                Authentic, verifiable citations from NPCI, RBI, and Paytm Developer Guidelines
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#F5EBDD]/60 hover:text-[#E8C78E] hover:bg-[#211611] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 bg-[#2B211D]/40 border-b border-[#C28B3D]/15 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#A77E5C] absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search circulars, provisions, mandate rules..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#211611] border border-[#C28B3D]/30 text-xs text-[#F5EBDD] font-mono focus:outline-none focus:border-[#E8C78E]"
            />
          </div>

          <div className="flex items-center gap-2">
            {['ALL', 'RBI', 'NPCI', 'PAYTM'].map((auth) => (
              <button
                key={auth}
                type="button"
                onClick={() => setSelectedAuthority(auth)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                  selectedAuthority === auth
                    ? 'bg-[#C28B3D] text-[#211611]'
                    : 'bg-[#211611] text-[#F5EBDD]/70 border border-[#C28B3D]/20 hover:border-[#C28B3D]/50'
                }`}
              >
                {auth}
              </button>
            ))}
          </div>
        </div>

        {/* Reference List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {filteredRefs.map((ref) => (
            <div
              key={ref.id}
              className="p-5 rounded-xl bg-[#2B211D]/60 border border-[#C28B3D]/20 hover:border-[#C28B3D]/50 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#85543A]/30 text-[#E8C78E] font-mono font-bold uppercase mr-2">
                    {ref.authority}
                  </span>
                  {ref.circular_ref && (
                    <span className="text-[10px] text-[#A77E5C] font-mono">
                      Ref: {ref.circular_ref}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[#F5EBDD]/50 font-mono">
                  Pub Date: {ref.publication_date}
                </span>
              </div>

              <h4 className="font-serif text-lg font-bold text-[#F5EBDD] mb-2">
                {ref.document_title}
              </h4>

              {/* Exact Verbatim Provision */}
              <div className="p-3.5 rounded-lg bg-[#211611] border-l-2 border-[#C28B3D] my-3">
                <span className="text-[10px] font-mono text-[#A77E5C] uppercase block mb-1">
                  Authentic Statutory Provision:
                </span>
                <p className="text-xs text-[#F5EBDD]/90 font-serif italic leading-relaxed">
                  "{ref.relevant_provision}"
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#C28B3D]/10 text-xs font-mono">
                <span className="text-[11px] text-[#A77E5C]">
                  Applicability: {ref.applicability_notes}
                </span>

                <a
                  href={ref.official_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#E8C78E] hover:text-[#F5EBDD] font-semibold transition-colors"
                >
                  <span>Official Document</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}

          {filteredRefs.length === 0 && (
            <div className="text-center py-12 text-[#F5EBDD]/60 font-mono text-xs">
              No regulatory references matched your query.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#2B211D]/80 border-t border-[#C28B3D]/20 text-center text-xs text-[#A77E5C] font-mono">
          SpashtMandate AI utilizes only officially published circulars & guidelines without synthetic legal fabrication.
        </div>
      </div>
    </div>
  );
};
