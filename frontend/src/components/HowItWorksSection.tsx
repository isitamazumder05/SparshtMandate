import React from 'react';
import { Globe, FileSearch, Scale, BarChart3, ArrowRight, CheckCircle2 } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const stages = [
    {
      num: '01',
      title: 'DISCOVER',
      subtitle: 'Real Webpage Ingestion',
      icon: Globe,
      description:
        'Input any publicly accessible merchant subscription or pricing URL. The platform ingests real HTML/markdown with strict SSRF protection and Firecrawl / native parsing.',
      features: ['SSRF & Network Shield', 'DOM & Fine-Print Extraction', 'Source Timestamp Provenance']
    },
    {
      num: '02',
      title: 'EXTRACT',
      subtitle: 'Grounded AI Structuring',
      icon: FileSearch,
      description:
        'AI extracts 12 core recurring payment parameters. Every extracted value is anchored to an exact verbatim quote from the page. Missing terms remain strictly null — zero hallucinations.',
      features: ['Verbatim Quote Anchoring', 'Confidence Scoring', 'Null for Missing Terms']
    },
    {
      num: '03',
      title: 'VERIFY',
      subtitle: 'Deterministic Rule Engine',
      icon: Scale,
      description:
        'A deterministic Python rule engine audits extracted disclosures against authentic NPCI UPI AutoPay operating guidelines and RBI recurring mandate circulars.',
      features: ['NPCI UPI AutoPay Rules', 'RBI e-Mandate Circulars', 'PASS / REVIEW / MISSING Statuses']
    },
    {
      num: '04',
      title: 'UNDERSTAND',
      subtitle: 'Transparency Audit Report',
      icon: BarChart3,
      description:
        'Generates an actionable Transparency Scorecard (0–100), risk grade, mandate comparison reconciliation, and AI-suggested corrective disclosure copy for merchants.',
      features: ['Transparency Score & Grade', 'Mandate Comparison Architecture', 'Downloadable PDF Report']
    }
  ];

  return (
    <section id="how-it-works" className="relative py-28 px-4 sm:px-6 lg:px-8 bg-[#2B211D]/50 border-y border-[#C28B3D]/15">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#211611] border border-[#C28B3D]/30 mb-4">
            <Scale className="w-3.5 h-3.5 text-[#E8C78E]" />
            <span className="text-[11px] uppercase tracking-widest font-bold text-[#E8C78E]">The Four-Stage Audit Pipeline</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl text-[#F5EBDD] font-bold leading-tight mb-6">
            From ambiguous terms to absolute clarity.
          </h2>

          <p className="text-base sm:text-lg text-[#F5EBDD]/70 font-sans leading-relaxed">
            SpashtMandate AI combines real-world web ingestion, evidence-anchored AI extraction, and a deterministic regulatory rule engine to evaluate recurring payment journeys.
          </p>
        </div>

        {/* 4-Stage Connected Process Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.title}
                className="metallic-card rounded-2xl p-7 relative flex flex-col justify-between group transition-all duration-300 hover:-translate-y-1"
              >
                {/* Top Badge & Number */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono text-2xl font-bold text-[#C28B3D] group-hover:text-[#E8C78E] transition-colors">
                      {stage.num}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[#85543A]/20 border border-[#C28B3D]/30 flex items-center justify-center text-[#E8C78E]">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="font-display text-lg font-black tracking-wider text-[#E8C78E] mb-1">
                    {stage.title}
                  </h3>
                  <h4 className="text-xs uppercase tracking-wider text-[#A77E5C] font-semibold mb-4">
                    {stage.subtitle}
                  </h4>

                  <p className="text-[#F5EBDD]/75 text-xs sm:text-sm leading-relaxed mb-6 font-sans">
                    {stage.description}
                  </p>
                </div>

                {/* Micro Features */}
                <div className="pt-4 border-t border-[#C28B3D]/15 flex flex-col gap-2">
                  {stage.features.map((feat) => (
                    <div key={feat} className="flex items-center gap-2 text-[11px] text-[#F5EBDD]/80">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C28B3D] shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Workflow Summary Flow Graphic */}
        <div className="mt-14 p-6 rounded-2xl bg-[#211611]/80 border border-[#C28B3D]/20 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[#E8C78E]">
          <span className="text-[#F5EBDD]/60 uppercase tracking-widest font-semibold">Continuous Audit Loop:</span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded bg-[#2B211D] border border-[#C28B3D]/30">Merchant Page</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#C28B3D]" />
            <span className="px-3 py-1 rounded bg-[#2B211D] border border-[#C28B3D]/30">Evidence Grounding</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#C28B3D]" />
            <span className="px-3 py-1 rounded bg-[#2B211D] border border-[#C28B3D]/30">NPCI/RBI Rule Matrix</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#C28B3D]" />
            <span className="px-3 py-1 rounded bg-[#C28B3D]/20 border border-[#C28B3D] text-[#E8C78E] font-bold">
              Transparency Scorecard & PDF
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
