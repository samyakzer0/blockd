import React, { useState, useRef, useEffect } from "react";
import {
  ArrowUpIcon,
  CopyIcon,
  CheckIcon,
  RefreshCwIcon,
  SparklesIcon,
  BotIcon,
  CornerDownLeftIcon,
  ChevronRight
} from "lucide-react";
import { Badge } from "./ui";

export function AssistantThread({ messages, onSendMessage }) {
  const [input, setInput] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const viewportRef = useRef(null);

  // Auto scroll to bottom smoothly
  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages]);

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
      className="flex h-full flex-col bg-slate-925/95 text-slate-100 rounded-xl border border-slate-800 shadow-2xl overflow-hidden font-sans text-xs"
      style={{
        "--thread-max-width": "100%",
        "--composer-radius": "1.25rem",
        "--composer-padding": "10px",
        "--composer-bg": "#090d16",
        "--accent-color": "#4f46e5",
        "--accent-foreground": "#ffffff",
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center">
            <BotIcon className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-xs text-white flex items-center gap-1.5">
              Case Intelligence Copilot <SparklesIcon className="w-3 h-3 text-amber-400" />
            </h3>
            <p className="text-[10px] text-slate-400">Recursive Atomic Deep-Dives & Live Kanoon Search</p>
          </div>
        </div>
        <Badge variant="success" className="text-[9px] px-2 py-0.5">ONLINE</Badge>
      </div>

      {/* Thread Viewport */}
      <div
        ref={viewportRef}
        className="relative flex flex-1 flex-col overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} fade-in animate-in duration-150`}
          >
            {/* User Message */}
            {msg.sender === "user" ? (
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-indigo-600 px-3.5 py-2.5 text-white font-medium shadow-md shadow-indigo-600/20 text-xs break-words">
                {msg.text}
              </div>
            ) : (
              /* Assistant Message */
              <div className="w-full space-y-2">
                <div className="rounded-2xl rounded-tl-sm bg-slate-900/90 border border-slate-800/90 px-3.5 py-2.5 text-slate-200 leading-relaxed shadow-sm text-xs break-words">
                  {msg.text}
                </div>

                {/* Clickable Atomic Deep-Dive Cards */}
                {msg.cards && msg.cards.length > 0 && (
                  <div className="grid grid-cols-1 gap-2 pt-1">
                    {msg.cards.map((card, cIdx) => (
                      <div
                        key={cIdx}
                        onClick={() => {
                          const queryTarget = card.deepDiveQuery || card.title.replace(/^[^:]+:\s*/, "").replace(/[📋⚖️🚨🏛️💰👤🎯]\s*/g, "");
                          onSendMessage(`Deep dive on ${queryTarget}`);
                        }}
                        className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/70 hover:bg-slate-900/90 transition-all space-y-1.5 text-xs cursor-pointer group relative shadow-sm"
                        title="Click to deep dive deeper into this entity/record"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200 text-xs group-hover:text-indigo-300 transition-colors flex items-center gap-1">
                            {card.title}
                          </span>
                          <Badge variant={card.variant} className="text-[9px] px-2 py-0 shrink-0">
                            {card.badge}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{card.desc}</p>
                        
                        <div className="flex items-center justify-end text-[10px] text-indigo-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity pt-0.5 gap-1">
                          <span>Explore atomic details</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Assistant Action Bar */}
                <div className="flex items-center gap-1 text-slate-400 px-1 pt-0.5">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(msg.text, idx)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    title="Copy response"
                  >
                    {copiedIndex === idx ? (
                      <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <CopyIcon className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSendMessage(msg.text)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    title="Re-run analysis"
                  >
                    <RefreshCwIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Composer (Tool chips removed) */}
      <div className="p-3 bg-slate-900/70 border-t border-slate-800">
        <form onSubmit={handleSubmit} className="relative flex w-full flex-col">
          <div className="flex w-full cursor-text flex-col gap-1.5 rounded-[var(--composer-radius)] border border-slate-800 bg-[var(--composer-bg)] p-[var(--composer-padding)] shadow-inner transition-[border-color] focus-within:border-indigo-500/80">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything or click any card above to deep dive infinitely..."
              className="max-h-32 min-h-9 w-full resize-none bg-transparent px-2 py-0.5 text-xs text-slate-100 placeholder:text-slate-500 outline-none leading-5"
              rows={1}
              enterKeyHint="send"
            />
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                Click cards to drill down <ChevronRight className="w-2.5 h-2.5 inline" />
              </span>

              <button
                type="submit"
                disabled={!input.trim()}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                style={{
                  backgroundColor: "var(--accent-color)",
                  color: "var(--accent-foreground)",
                }}
                title="Send message"
              >
                <ArrowUpIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
