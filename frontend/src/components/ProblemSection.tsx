import React from 'react';
import { AlertCircle, Clock, CalendarX, Lock, HelpCircle, ArrowRight } from 'lucide-react';

export const ProblemSection: React.FC = () => {
  return (
    <section id="problem" className="relative py-28 px-4 sm:px-6 lg:px-8 bg-[#211611] overflow-hidden">
      {/* Decorative background light accents */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-[#85543A]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-80 h-80 rounded-full bg-[#C28B3D]/10 blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#2B211D] border border-[#C28B3D]/30 mb-4">
            <AlertCircle className="w-3.5 h-3.5 text-[#E8C78E]" />
            <span className="text-[11px] uppercase tracking-widest font-bold text-[#E8C78E]">The Friction in Recurring Payments</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl text-[#F5EBDD] font-bold leading-tight mb-6">
            Subscriptions shouldn't come with surprises.
          </h2>

          <p className="text-base sm:text-lg text-[#F5EBDD]/70 font-sans leading-relaxed">
            Recurring digital mandates are meant to offer effortless convenience. Yet across India's rapidly expanding subscription economy, unclear terms turn simple sign-ups into unexpected recurring liabilities.
          </p>
        </div>

        {/* Editorial Asymmetric Layout of Problem Dimensions */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
          {/* Card 1: Unclear Renewal & Post-Trial Shock */}
          <div className="md:col-span-7 metallic-card rounded-2xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="font-serif text-8xl font-black text-[#E8C78E]">01</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#85543A]/30 border border-[#C28B3D]/40 flex items-center justify-center text-[#E8C78E] mb-6">
              <CalendarX className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-[#F5EBDD] mb-3 group-hover:text-[#E8C78E] transition-colors">
              The Post-Trial Auto-Conversion Trap
            </h3>
            <p className="text-[#F5EBDD]/75 text-sm sm:text-base leading-relaxed mb-6 font-sans">
              "Try free for 14 days" looks risk-free until day 15 debits ₹1,499. Merchants frequently conceal the post-trial recurring price in micro-print footers or nested legal disclaimers, leaving customers blindsided when free trials covertly morph into recurring mandates.
            </p>
            <div className="p-4 rounded-xl bg-[#211611]/80 border border-[#85543A]/30 font-mono text-xs text-[#E8C78E] flex items-center justify-between">
              <span>NPCI AutoPay Finding:</span>
              <span className="text-[#F5EBDD]/70">Zero-value trial must disclose first debit date</span>
            </div>
          </div>

          {/* Card 2: Ambiguous Billing Cadence */}
          <div className="md:col-span-5 metallic-card rounded-2xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="font-serif text-8xl font-black text-[#E8C78E]">02</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#85543A]/30 border border-[#C28B3D]/40 flex items-center justify-center text-[#E8C78E] mb-6">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-[#F5EBDD] mb-3 group-hover:text-[#E8C78E] transition-colors">
              Ambiguous Cadence & "As Presented" Mandates
            </h3>
            <p className="text-[#F5EBDD]/75 text-sm sm:text-base leading-relaxed mb-6 font-sans">
              Is ₹299 billed monthly, every 4 weeks (13 times/year), or on-demand? When mandates are registered under flexible "As & when presented" schedules, customers lose certainty on when debits trigger.
            </p>
            <div className="p-4 rounded-xl bg-[#211611]/80 border border-[#85543A]/30 font-mono text-xs text-[#E8C78E] flex items-center justify-between">
              <span>RBI e-Mandate Rule:</span>
              <span className="text-[#F5EBDD]/70">Explicit cadence registration required</span>
            </div>
          </div>

          {/* Card 3: Hidden Cancellation Pathways */}
          <div className="md:col-span-5 metallic-card rounded-2xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="font-serif text-8xl font-black text-[#E8C78E]">03</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#85543A]/30 border border-[#C28B3D]/40 flex items-center justify-center text-[#E8C78E] mb-6">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-[#F5EBDD] mb-3 group-hover:text-[#E8C78E] transition-colors">
              The Roach Motel: Impossible Opt-Outs
            </h3>
            <p className="text-[#F5EBDD]/75 text-sm sm:text-base leading-relaxed mb-6 font-sans">
              Starting a subscription takes 1 click; terminating it requires navigating labyrinthine settings, calling support numbers during business hours, or sending written emails 7 days in advance.
            </p>
            <div className="p-4 rounded-xl bg-[#211611]/80 border border-[#85543A]/30 font-mono text-xs text-[#E8C78E] flex items-center justify-between">
              <span>Customer Right:</span>
              <span className="text-[#F5EBDD]/70">Unconditional cancellation via UPI App</span>
            </div>
          </div>

          {/* Card 4: Disconnect between Disclosures & Actual Mandate Execution */}
          <div className="md:col-span-7 metallic-card rounded-2xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="font-serif text-8xl font-black text-[#E8C78E]">04</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#85543A]/30 border border-[#C28B3D]/40 flex items-center justify-center text-[#E8C78E] mb-6">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-[#F5EBDD] mb-3 group-hover:text-[#E8C78E] transition-colors">
              Mandate Disconnect: Stated Terms vs Technical Mandate
            </h3>
            <p className="text-[#F5EBDD]/75 text-sm sm:text-base leading-relaxed mb-6 font-sans">
              The merchant website advertises "₹199 per month", but the technical UPI AutoPay authorization prompt requests permission to debit up to "₹5,000 maximum cap" without specifying the variance reason. Users approve without understanding the difference between the subscription amount and the mandate authorization ceiling.
            </p>
            <div className="p-4 rounded-xl bg-[#211611]/80 border border-[#85543A]/30 font-mono text-xs text-[#E8C78E] flex items-center justify-between">
              <span>SpashtMandate AI Mission:</span>
              <span className="text-[#F5EBDD]/70">Reconcile disclosures with mandate reality</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
