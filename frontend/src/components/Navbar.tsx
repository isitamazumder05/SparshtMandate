import React, { useState, useEffect } from 'react';
import { BookOpen, History, LogOut, Sparkles, User, PlusCircle } from 'lucide-react';
import { User as UserType } from '../types';

interface NavbarProps {
  user: UserType | null;
  onOpenHistory: () => void;
  onOpenRegulatoryDocs: () => void;
  onNewAudit: () => void;
  onSignInClick: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenHistory,
  onOpenRegulatoryDocs,
  onNewAudit,
  onSignInClick,
  onSignOut
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#211611]/92 backdrop-blur-xl border-b border-[#C28B3D]/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)] py-3'
          : 'bg-transparent py-4 sm:py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo & Wordmark */}
        <div
          onClick={user ? onNewAudit : onSignInClick}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-[#85543A] via-[#C28B3D] to-[#E8C78E] p-[1.5px] shadow-[0_0_15px_rgba(194,139,61,0.3)] group-hover:shadow-[0_0_20px_rgba(232,199,142,0.5)] transition-all">
            <div className="w-full h-full bg-[#211611] rounded-[7px] flex items-center justify-center">
              <span className="font-serif font-bold text-lg text-[#E8C78E]">S</span>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-lg tracking-wider text-[#F5EBDD] group-hover:text-[#E8C78E] transition-colors">
                SPASHTMANDATE
              </span>
              <span className="text-xs px-1.5 py-0.2 rounded bg-[#C28B3D]/20 border border-[#C28B3D]/40 text-[#E8C78E] font-mono font-semibold">
                AI
              </span>
            </div>
            <span className="text-[10px] text-[#A77E5C] font-mono tracking-tight hidden sm:block">
              Every payment deserves clarity
            </span>
          </div>
        </div>

        {/* Right Action Items */}
        <div className="flex items-center gap-3 sm:gap-4">
          {user ? (
            /* Authenticated Workspace Top Controls */
            <>
              <button
                onClick={onNewAudit}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2B211D] hover:bg-[#85543A]/30 border border-[#C28B3D]/30 text-xs font-mono font-bold text-[#E8C78E] transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New Audit</span>
              </button>

              <button
                onClick={onOpenHistory}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2B211D]/80 hover:bg-[#2B211D] border border-[#C28B3D]/30 text-xs font-mono text-[#F5EBDD] transition-all cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-[#C28B3D]" />
                <span className="hidden sm:inline">My Audits</span>
              </button>

              <button
                onClick={onOpenRegulatoryDocs}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2B211D]/80 hover:bg-[#2B211D] border border-[#C28B3D]/30 text-xs font-mono text-[#E8C78E] transition-all cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#C28B3D]" />
                <span>Regulatory KB</span>
              </button>

              {/* User Identity Pill */}
              <div className="flex items-center gap-2 pl-2 border-l border-[#C28B3D]/20">
                <div className="w-7 h-7 rounded-full bg-[#85543A]/30 border border-[#C28B3D]/40 flex items-center justify-center text-[#E8C78E] text-xs font-bold font-mono">
                  {user.email[0].toUpperCase()}
                </div>
                <span className="text-xs text-[#F5EBDD]/80 font-mono hidden lg:inline max-w-[140px] truncate">
                  {user.email}
                </span>

                <button
                  onClick={onSignOut}
                  className="p-1.5 rounded-lg text-[#A77E5C] hover:text-red-400 hover:bg-[#2B211D] transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            /* Unauthenticated Landing CTA */
            <button
              onClick={onSignInClick}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#85543A] via-[#C28B3D] to-[#E8C78E] text-[#211611] font-bold text-xs tracking-wider uppercase shadow-[0_4px_15px_rgba(194,139,61,0.3)] hover:shadow-[0_6px_20px_rgba(194,139,61,0.45)] transition-all cursor-pointer"
            >
              Get Started / Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
