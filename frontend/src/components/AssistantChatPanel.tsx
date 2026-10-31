import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  ShieldCheck,
  BookOpen,
  HelpCircle,
  AlertTriangle,
  FileText,
  User,
  Bot,
  RefreshCw
} from 'lucide-react';
import { AnalysisResponse, ChatMessage } from '../types';
import { sendAssistantChatMessage } from '../services/api';

interface AssistantChatPanelProps {
  analysis: AnalysisResponse;
  onOpenRegulatoryDocs: () => void;
}

export const AssistantChatPanel: React.FC<AssistantChatPanelProps> = ({
  analysis,
  onOpenRegulatoryDocs
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `Hello! I am your SpashtMandate AI Subscription Assistant. I have audited **${analysis.merchant_name}** and evaluated its recurring payment terms against authentic NPCI UPI AutoPay and RBI guidelines.\n\nAsk me about your actual payment amounts, billing discrepancies, cancellation steps vs mandate revocation, or regulatory consumer rights.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      regulatory_citations: ['NPCI/UPI/OC-96/2020-21', 'RBI/2019-20/47']
    }
  ]);

  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'How do I cancel this subscription vs revoking the mandate?',
    'Why is my checkout charge different from the listed price?',
    'What are my rights under RBI UPI AutoPay guidelines?',
    'When is the exact deadline to cancel before trial auto-converts?'
  ];

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      // Build conversation history for API
      const historyPayload = messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const res = await sendAssistantChatMessage(analysis.id, textToSend.trim(), historyPayload);

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        evidence_citations: res.evidence_citations,
        regulatory_citations: res.regulatory_citations
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ Guidance query error: ${err.message || 'Unable to fetch response'}. Please verify your connection or try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="metallic-card rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] px-2.5 py-0.5 rounded bg-[#85543A]/30 text-[#E8C78E] font-mono font-bold uppercase tracking-wider">
                Grounded Subscription AI
              </span>
              <span className="text-xs text-[#A77E5C] font-mono">
                Context: {analysis.merchant_name}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#F5EBDD] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#C28B3D]" />
              <span>Conversational Subscription Intelligence</span>
            </h2>
            <p className="text-xs text-[#A77E5C] mt-1 max-w-2xl leading-relaxed">
              Ask natural-language questions about your analyzed subscription terms, actual payments, price differences,
              cancellation procedures, and authentic RBI/NPCI AutoPay guidelines.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#211611]/70 border border-[#C28B3D]/20 text-[11px] text-[#A77E5C] max-w-xs">
            <ShieldCheck className="w-4 h-4 text-[#C28B3D] mb-1 inline mr-1" />
            <strong>Safety Guard:</strong> SpashtMandate AI will <em>never</em> ask for your UPI PIN, OTP, or bank passwords.
          </div>
        </div>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-mono text-[#A77E5C] flex-shrink-0">Suggested:</span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-[#2B211D] border border-[#C28B3D]/30 text-xs text-[#F5EBDD] hover:border-[#C28B3D] hover:bg-[#85543A]/20 transition-all flex-shrink-0 cursor-pointer disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Main Chat Interface */}
      <div className="metallic-card rounded-2xl p-6 flex flex-col h-[600px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-[#C28B3D] text-[#211611]'
                    : 'bg-[#85543A] text-[#E8C78E]'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Content Bubble */}
              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-[#85543A] to-[#C28B3D] text-[#211611] font-medium'
                    : 'bg-[#211611]/80 border border-[#C28B3D]/25 text-[#F5EBDD]'
                }`}
              >
                {/* Text Formatting with basic Markdown support */}
                <div className="whitespace-pre-line space-y-2">
                  {msg.text}
                </div>

                {/* Evidence Citations */}
                {msg.evidence_citations && msg.evidence_citations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-[#C28B3D]/20 space-y-1">
                    <span className="text-[10px] font-mono text-[#E8C78E] uppercase block font-bold">
                      Supporting Page Evidence:
                    </span>
                    {msg.evidence_citations.map((cite, i) => (
                      <div key={i} className="text-[11px] italic font-serif text-[#F5EBDD]/80">
                        {cite}
                      </div>
                    ))}
                  </div>
                )}

                {/* Regulatory Citations */}
                {msg.regulatory_citations && msg.regulatory_citations.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-[#C28B3D]/20 flex flex-wrap gap-1.5">
                    {msg.regulatory_citations.map((reg, i) => (
                      <span
                        key={i}
                        onClick={onOpenRegulatoryDocs}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#85543A]/40 text-[#E8C78E] border border-[#C28B3D]/30 cursor-pointer hover:bg-[#C28B3D] hover:text-[#211611] transition-colors"
                      >
                        Ref: {reg}
                      </span>
                    ))}
                  </div>
                )}

                {/* Timestamp */}
                <div
                  className={`text-[9px] font-mono mt-2 text-right ${
                    msg.sender === 'user' ? 'text-[#211611]/70' : 'text-[#A77E5C]'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#85543A] text-[#E8C78E] flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-[#211611]/80 border border-[#C28B3D]/25 rounded-2xl p-4 text-xs text-[#A77E5C] flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C28B3D]" />
                <span>Grounding response with analysis context & regulatory rules...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Query Input Box */}
        <div className="mt-4 pt-3 border-t border-[#C28B3D]/20">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask a question about this subscription, actual debits, or RBI rules..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-xl bg-[#211611] border border-[#C28B3D]/30 text-xs text-[#F5EBDD] placeholder-[#A77E5C] focus:outline-none focus:border-[#C28B3D]"
            />

            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#85543A] via-[#C28B3D] to-[#E8C78E] text-[#211611] font-bold text-xs font-mono uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

