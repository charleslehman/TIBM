"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChatMessage } from "@/components/ChatMessage";
import { StarterQuestions } from "@/components/StarterQuestions";
import type { ChatMessage as ChatMessageType, ChatResponse } from "@/types";

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(generateSessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessageType = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          history: messages.slice(-6),
          session_id: sessionId,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data: ChatResponse = await response.json();
      const assistantMessage: ChatMessageType = {
        role: "assistant",
        content: data.message,
        sources: data.sources,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Something went wrong. Please try again or rephrase your question.",
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-dvh bg-[#FAFAF9]">
      {/* Header */}
      <header className="shrink-0 bg-white border-b border-[#E7E5E4]">
        <div className="max-w-3xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-[15px] font-semibold text-[#1C1917] tracking-tight">
              Texas Title Insurance Manual Assistant
            </h1>
            <p className="text-[11px] text-[#A8A29E] mt-0.5 tracking-wide">
              TDI Basic Manual &middot; Statutes, Rules, Forms &amp; Procedures
            </p>
          </div>
          <Link
            href="/about"
            className="text-[12px] text-[#A8A29E] hover:text-[#78716C] transition-colors duration-150"
          >
            About
          </Link>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-3xl mx-auto px-5">
          {messages.length === 0 ? (
            <StarterQuestions onSelect={sendMessage} />
          ) : (
            <div className="py-6 space-y-5">
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} />
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="px-5 py-4 rounded-xl bg-white border border-[#E7E5E4] shadow-[0_1px_3px_0_rgb(0_0_0/0.04)]">
                    <div className="flex gap-1.5 items-center">
                      <span className="w-1.5 h-1.5 bg-[#A8A29E] rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 bg-[#A8A29E] rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-[#A8A29E] rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input */}
      <footer className="shrink-0 bg-white border-t border-[#E7E5E4]">
        <div className="max-w-3xl mx-auto px-5 py-4">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about the Texas Title Insurance Basic Manual..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-[#E7E5E4] bg-white px-4 py-3 text-[14px] text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all duration-150"
              style={{ maxHeight: "120px" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height =
                  Math.min(target.scrollHeight, 120) + "px";
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="shrink-0 w-10 h-10 rounded-xl bg-[#2563EB] text-white flex items-center justify-center hover:bg-[#1D4ED8] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.98]"
            >
              <svg
                className="w-4.5 h-4.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 19V5m0 0l-7 7m7-7l7 7"
                />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-[#D6D3D1] mt-3 text-center leading-relaxed">
            General information from the TDI Basic Manual. Not legal advice.
            Consult your underwriter or counsel for specific situations.
          </p>
        </div>
      </footer>
    </div>
  );
}
