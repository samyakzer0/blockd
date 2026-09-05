import React, { useState, useRef, useEffect } from "react";
import {
  ArrowUpIcon,
  CopyIcon,
  CheckIcon,
  RefreshCwIcon,
  SparklesIcon,
  BotIcon,
  ChevronRight,
  Loader2
} from "lucide-react";
import { Badge } from "./ui";

export function AssistantThread({ messages, onSendMessage, isQuerying = false }) {
  const [input, setInput] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const viewportRef = useRef(null);

  // Auto scroll to bottom smoothly
  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages, isQuerying]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div
      className="flex h-full flex-col bg-white text-[#28374A] rounded-2xl border border-[#D3C7AD] shadow-sm overflow-hidden font-sans text-xs"
      style={{
        "--thread-max-width": "100%",
        "--composer-radius": "1.25rem",
        "--composer-padding": "10px",
        "--composer-bg": "#ffffff",
        "--accent-color": "#B8502E",
        "--accent-foreground": "#ffffff",
      }}
    >
      {/* Header - Azul */}
      <div className="px-4 py-3 border-b border-[#1C2735] bg-[#28374A] text-white flex items-center justify-between shadow-xs">
        <h3 className="font-bold text-xs sm:text-sm text-white">
          Case Intelligence Copilot
        </h3>
      </div>

      {/* Thread Viewport - Warm Areia Tint */}
      <div
        ref={viewportRef}
        className="relative flex flex-1 flex-col overflow-y-auto p-4 space-y-4 scroll-smooth bg-[#FAF7F2]"
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} fade-in animate-in duration-150`}
          >
            {/* User Message - Azul */}
            {msg.sender === "user" ? (
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[#28374A] px-3.5 py-2.5 text-white font-medium shadow-xs text-xs break-words">
                {msg.text}
              </div>
            ) : (
              /* Assistant Message */
              <div className="w-full space-y-2">
                <div className="rounded-2xl rounded-tl-sm bg-white border border-[#D3C7AD] px-3.5 py-2.5 text-[#28374A] leading-relaxed shadow-2xs text-xs break-words">
                  {msg.text}
                </div>

                {/* Clickable Atomic Deep-Dive Cards */}
                {msg.cards && msg.cards.length > 0 && (
                  <div className="grid grid-cols-1 gap-2 pt-1">
                    {msg.cards.map((card, cIdx) => (
                      <div
                        key={cIdx}
                        onClick={() => {
                          const queryTarget = card.deepDiveQuery || card.title.replace(/^[^:]+:\s*/, "");
                          onSendMessage(`Deep dive on ${queryTarget}`);
                        }}
                        className="p-3 rounded-xl bg-white border border-[#D3C7AD] hover:border-[#B8502E] hover:bg-[#FDF4EE]/60 transition-all space-y-1.5 text-xs cursor-pointer group relative shadow-2xs"
                        title="Click to deep dive deeper into this entity/record"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#28374A] text-xs group-hover:text-[#B8502E] transition-colors flex items-center gap-1">
                            {card.title}
                          </span>
                          <Badge variant={card.variant} className="text-[9px] px-2 py-0 shrink-0">
                            {card.badge}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-[#6B6751] leading-relaxed">{card.desc}</p>
                        
                        <div className="flex items-center justify-end text-[10px] text-[#B8502E] font-semibold opacity-0 group-hover:opacity-100 transition-opacity pt-0.5 gap-1">
                          <span>Explore atomic details</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Assistant Action Bar */}
                <div className="flex items-center gap-1 text-[#6B6751] px-1 pt-0.5">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(msg.text, idx)}
                    className="p-1 rounded hover:bg-[#E8E1D1] text-[#6B6751] hover:text-[#28374A] transition-colors cursor-pointer"
                    title="Copy response"
                  >
                    {copiedIndex === idx ? (
                      <CheckIcon className="w-3.5 h-3.5 text-emerald-700" />
                    ) : (
                      <CopyIcon className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSendMessage(msg.text)}
                    className="p-1 rounded hover:bg-[#E8E1D1] text-[#6B6751] hover:text-[#28374A] transition-colors cursor-pointer"
                    title="Re-run analysis"
                  >
                    <RefreshCwIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {isQuerying && (
          <div className="flex flex-col items-start fade-in animate-in duration-150 w-full space-y-2">
            <div className="rounded-2xl rounded-tl-sm bg-white border border-[#B8502E]/50 p-4 text-[#28374A] leading-relaxed shadow-sm flex flex-col gap-2.5 text-xs w-full overflow-hidden">
              <div className="flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-[#B8502E] animate-spin shrink-0" />
                <div className="space-y-0.5">
                  <p className="font-bold text-[#28374A]">Investigating Target Dossier...</p>
                  <p className="text-[10px] text-[#B8502E] font-sans">Cross-referencing Gemini AI, Kanoon precedents & asset ledgers</p>
                </div>
              </div>
              <md-linear-progress indeterminate style={{ width: "100%", "--md-linear-progress-active-indicator-color": "#B8502E" }}></md-linear-progress>
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="p-3 bg-white border-t border-[#D3C7AD]">
        <form onSubmit={handleSubmit} className="relative flex w-full flex-col">
          <div className="flex w-full cursor-text flex-col gap-1.5 rounded-[var(--composer-radius)] border border-[#D3C7AD] bg-[#FAF7F2] p-[var(--composer-padding)] shadow-2xs transition-[border-color] focus-within:border-[#B8502E] focus-within:bg-white">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything or click any card above to deep dive infinitely..."
              className="max-h-32 min-h-9 w-full resize-none bg-transparent px-2 py-0.5 text-xs text-[#28374A] placeholder:text-[#6B6751]/60 outline-none leading-5 font-sans"
              rows={1}
              enterKeyHint="send"
            />
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[10px] text-[#6B6751] flex items-center gap-1 font-sans">
                Click cards to drill down <ChevronRight className="w-2.5 h-2.5 inline" />
              </span>

              <button
                type="submit"
                disabled={!input.trim()}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-xs bg-[#B8502E] hover:bg-[#9A3E20] text-white"
                title="Send message"
              >
                <ArrowUpIcon className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
