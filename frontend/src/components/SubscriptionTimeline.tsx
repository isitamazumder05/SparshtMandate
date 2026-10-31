import React, { useState } from 'react';
import { Calendar, Clock, DollarSign, AlertCircle, CheckCircle2, Info, ChevronRight, ShieldCheck, Quote } from 'lucide-react';
import { TimelineEvent } from '../types';

interface SubscriptionTimelineProps {
  timeline: TimelineEvent[];
  merchantName: string;
}

export const SubscriptionTimeline: React.FC<SubscriptionTimelineProps> = ({ timeline, merchantName }) => {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  if (!timeline || timeline.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-[#2B211D]/60 border border-[#C28B3D]/20 text-center">
        <Clock className="w-8 h-8 text-[#A77E5C] mx-auto mb-3" />
        <h3 className="text-sm font-bold text-[#E8C78E] uppercase tracking-wider">Timeline Incomplete</h3>
        <p className="text-xs text-[#A77E5C] mt-1 max-w-md mx-auto">
          The merchant page did not disclose sufficient sequential payment dates or trial durations to build a complete chronological lifecycle.
        </p>
      </div>
    );
  }

  const getTimingBadge = (timingType: string) => {
    switch (timingType) {
      case 'EXPLICIT_DATE':
        return {
          label: 'Explicit Date',
          classes: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300',
          desc: 'Disclosed directly on page'
        };
      case 'CALCULATED_DATE':
        return {
          label: 'Calculated Timing',
          classes: 'bg-amber-950/80 border-amber-500/50 text-amber-300',
          desc: 'Deterministically calculated from disclosed terms'
        };
      case 'RELATIVE_TIMING':
        return {
          label: 'Relative Schedule',
          classes: 'bg-[#85543A]/40 border-[#C28B3D]/50 text-[#E8C78E]',
          desc: 'Relative lifecycle cadence'
        };
      default:
        return {
          label: 'Unspecified',
          classes: 'bg-zinc-800/80 border-zinc-600 text-zinc-300',
          desc: 'Not articulated on page'
        };
    }
  };

  const getStatusIcon = (badgeStatus: string) => {
    switch (badgeStatus) {
      case 'CONFIRMED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'ALERT':
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
      case 'CALCULATED':
        return <Clock className="w-4 h-4 text-[#E8C78E]" />;
      default:
        return <Info className="w-4 h-4 text-[#A77E5C]" />;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Timeline Header & Explanation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#C28B3D]/20">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#85543A]/20 border border-[#85543A]/40 text-xs font-mono text-[#E8C78E] mb-2">
            <Calendar className="w-3.5 h-3.5 text-[#C28B3D]" />
            <span>Core Feature &bull; Chronological Subscription Flow</span>
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-black text-[#F5EBDD] tracking-tight">
            Subscription & Payment Lifecycle
          </h3>
          <p className="text-xs text-[#A77E5C] mt-1 max-w-2xl">
            Sequential breakdown of what gets charged, when it gets debited, and notification windows for <span className="text-[#E8C78E] font-semibold">{merchantName}</span>.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 text-[10px] font-mono">
          <span className="px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
            &bull; Explicit Date
          </span>
          <span className="px-2.5 py-1 rounded-md bg-amber-950/60 border border-amber-500/40 text-amber-300">
            &bull; Calculated Timing
          </span>
          <span className="px-2.5 py-1 rounded-md bg-[#85543A]/30 border border-[#C28B3D]/40 text-[#E8C78E]">
            &bull; Relative Schedule
          </span>
        </div>
      </div>

      {/* Chronological Flow Cards */}
      <div className="relative pl-6 sm:pl-10 space-y-6 before:absolute before:left-3 sm:before:left-5 before:top-3 before:bottom-3 before:w-[2px] before:bg-gradient-to-b before:from-[#C28B3D] before:via-[#85543A] before:to-[#2B211D]">
        {timeline.map((event) => {
          const badge = getTimingBadge(event.timing_type);
          const isSelected = selectedEventId === event.event_id;

          return (
            <div
              key={event.event_id}
              onClick={() => setSelectedEventId(isSelected ? null : event.event_id)}
              className={`relative p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                isSelected
                  ? 'bg-[#2B211D] border-[#E8C78E] shadow-[0_10px_30px_rgba(194,139,61,0.2)]'
                  : 'bg-[#2B211D]/60 hover:bg-[#2B211D]/90 border-[#C28B3D]/25 hover:border-[#C28B3D]/50'
              }`}
            >
              {/* Stepper Node Marker on the vertical connector line */}
              <div className="absolute -left-[31px] sm:-left-[47px] top-5 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#211611] border-2 border-[#C28B3D] flex items-center justify-center shadow-md">
                <span className="text-[10px] sm:text-xs font-bold text-[#E8C78E] font-mono">
                  {event.step_number}
                </span>
              </div>

              {/* Event Content Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2.5">
                  {getStatusIcon(event.badge_status)}
                  <h4 className="text-base font-bold text-[#F5EBDD] tracking-tight">
                    {event.phase_name}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono border uppercase tracking-wider ${badge.classes}`}
                    title={badge.desc}
                  >
                    {badge.label}
                  </span>
                  {event.amount_display && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#85543A]/30 border border-[#C28B3D]/40 text-[#E8C78E] font-mono text-xs font-bold">
                      {event.amount_display}
                    </span>
                  )}
                </div>
              </div>

              {/* Timing Display */}
              <div className="flex items-center gap-2 text-xs font-mono text-[#E8C78E] mb-2">
                <Clock className="w-3.5 h-3.5 text-[#C28B3D]" />
                <span className="font-semibold">{event.date_display}</span>
              </div>

              {/* Lifecycle Description */}
              <p className="text-xs text-[#F5EBDD]/80 leading-relaxed font-sans">
                {event.description}
              </p>

              {/* Expandable Grounding Evidence Quote */}
              {event.evidence_quote && (
                <div className="mt-3 pt-3 border-t border-[#C28B3D]/15">
                  <div className="flex items-start gap-2 bg-[#211611]/70 p-2.5 rounded-xl border border-[#C28B3D]/20 text-[11px] text-[#A77E5C] font-mono">
                    <Quote className="w-3.5 h-3.5 text-[#C28B3D] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#C28B3D] block mb-0.5">
                        Verbatim Grounding Evidence:
                      </span>
                      <span className="text-[#F5EBDD]/90 italic">
                        "{event.evidence_quote}"
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

