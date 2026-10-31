import React from 'react';
import { ArrowRight, ShieldCheck, Heart, ExternalLink } from 'lucide-react';

interface FooterProps {
  onAnalyzeClick: () => void;
  onOpenRegulatoryDocs: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onAnalyzeClick,
  onOpenRegulatoryDocs
}) => {
  return (
    <footer className="relative bg-[#170E0B] border-t border-[#C28B3D]/20 overflow-hidden">
      {/* Final Call to Action Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center relative z-10">
        <div className="w-16 h-16 rounded-full bg-[#85543A]/20 border border-[#C28B3D]/30 flex items-center justify-center mx-auto mb-6 text-[#E8C78E]">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <h2 className="font-serif text-3xl sm:text-5xl text-[#F5EBDD] font-bold mb-4">
          Make your next subscription an informed decision.
        </h2>

        <p className="text-sm sm:text-base text-[#F5EBDD]/70 max-w-xl mx-auto font-sans mb-8">
          Audit any merchant recurring payment journey before approving UPI AutoPay or e-mandates.
        </p>

        <button
          onClick={onAnalyzeClick}
          className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#85543A] via-[#C28B3D] to-[#E8C78E] text-[#211611] font-bold text-sm tracking-widest uppercase shadow-[0_10px_30px_rgba(194,139,61,0.35)] hover:shadow-[0_15px_40px_rgba(194,139,61,0.5)] transition-all transform hover:-translate-y-0.5 cursor-pointer inline-flex items-center gap-3"
        >
          <span>Analyze a Subscription</span>
          <ArrowRight className="w-4 h-4 text-[#211611]" />
        </button>
      </div>

      {/* Brand & Regulatory Attribution Bar */}
      <div className="border-t border-[#C28B3D]/10 bg-[#211611] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#A77E5C] font-mono">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <span className="font-display font-bold text-sm text-[#F5EBDD]">
              SPASHTMANDATE AI
            </span>
            <span className="hidden sm:inline text-[#C28B3D]">&bull;</span>
            <span>Paytm Build for India Hackathon 2026 (Bengaluru Edition)</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={onOpenRegulatoryDocs}
              className="hover:text-[#E8C78E] transition-colors cursor-pointer"
            >
              Official Regulatory Knowledge Base
            </button>
            <a
              href="https://www.npci.org.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#E8C78E] transition-colors flex items-center gap-1"
            >
              <span>NPCI</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://www.rbi.org.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#E8C78E] transition-colors flex items-center gap-1"
            >
              <span>RBI</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="text-center text-[10px] text-[#F5EBDD]/40 font-mono mt-6">
          "Every payment deserves clarity. Understand what you agree to. Know what gets charged. Stay in control."
        </div>
      </div>
    </footer>
  );
};
