import React from 'react';
import { IndianRupee, Repeat, Clock, RefreshCw, XCircle, Undo2, ShieldCheck } from 'lucide-react';

export const WhatWeAnalyzeSection: React.FC = () => {
  const auditPoints = [
    {
      title: 'Subscription Amount & Currency',
      icon: IndianRupee,
      description: 'Verifies explicit numeric price disclosure and currency designation (INR / ₹) prior to mandate approval.',
      rule: 'NPCI UPI AutoPay Limit Guidelines'
    },
    {
      title: 'Billing Frequency & Interval',
      icon: Repeat,
      description: 'Checks whether the cadence (Monthly, Annual, Weekly, As Presented) is unambiguously specified before consent.',
      rule: 'Paytm Recurring PG Standard'
    },
    {
      title: 'Trial Duration & Auto-Conversion',
      icon: Clock,
      description: 'Scans for zero-value or discounted trial windows and ensures post-trial regular pricing is prominently disclosed.',
      rule: 'NPCI Circular 2021-12'
    },
    {
      title: 'Renewal Amount & Notice',
      icon: RefreshCw,
      description: 'Audits automatic renewal clauses and pre-debit intimation requirements (at least 24h prior to debit).',
      rule: 'RBI DPSS.CO.PD.No.447/02.14'
    },
    {
      title: 'Cancellation Mechanism',
      icon: XCircle,
      description: 'Evaluates online revocation pathways to ensure customers retain simple, frictionless opt-out capability.',
      rule: 'RBI DPSS.CO.PD.No.754/02.14'
    },
    {
      title: 'Refund & Cooling-Off Terms',
      icon: Undo2,
      description: 'Analyzes whether merchants disclose policies regarding accidental recurring renewals or money-back guarantees.',
      rule: 'Consumer Protection Standard'
    },
    {
      title: 'Mandate Cap vs Real Price',
      icon: ShieldCheck,
      description: 'Cross-references stated subscription prices against technical UPI AutoPay maximum execution caps.',
      rule: 'UPI AutoPay Mandate Rules'
    }
  ];

  return (
    <section id="what-we-analyze" className="relative py-28 px-4 sm:px-6 lg:px-8 bg-[#211611]">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#2B211D] border border-[#C28B3D]/30 mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-[#E8C78E]" />
            <span className="text-[11px] uppercase tracking-widest font-bold text-[#E8C78E]">Verification Checklist</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl text-[#F5EBDD] font-bold leading-tight mb-6">
            What SpashtMandate AI analyzes.
          </h2>

          <p className="text-base sm:text-lg text-[#F5EBDD]/70 font-sans leading-relaxed">
            Every subscription journey is dissected into 7 critical financial transparency parameters, grounded in official payment guidelines.
          </p>
        </div>

        {/* Audit Points Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auditPoints.map((point) => {
            const Icon = point.icon;
            return (
              <div
                key={point.title}
                className="metallic-card rounded-2xl p-6 relative flex flex-col justify-between group hover:border-[#C28B3D]/50 transition-all"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#85543A]/20 border border-[#C28B3D]/30 flex items-center justify-center text-[#E8C78E] mb-5 group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="font-display text-lg font-bold text-[#F5EBDD] mb-2 group-hover:text-[#E8C78E] transition-colors">
                    {point.title}
                  </h3>

                  <p className="text-[#F5EBDD]/70 text-xs sm:text-sm leading-relaxed mb-6 font-sans">
                    {point.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#C28B3D]/15 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#A77E5C]">Reference:</span>
                  <span className="text-[#E8C78E] font-medium">{point.rule}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
