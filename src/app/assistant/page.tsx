"use client";

import React, { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ChatMessage } from "@/types";
import { Sparkles, Send, Bot, ArrowRight, Lightbulb, Trash2 } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function AssistantPage() {
  const { language, t } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    t("assistant.suggest1"),
    t("assistant.suggest2"),
    t("assistant.suggest3"),
    t("assistant.suggest4"),
    t("assistant.suggest5"),
    t("assistant.suggest6"),
  ];

  useEffect(() => {
    // Initial welcome message based on language
    const welcomeMsg: ChatMessage = {
      id: "msg-welcome",
      sender: "assistant",
      text: language === "hi"
        ? "नमस्ते! मैं **FinPilot AI सहायक** हूँ। मैंने आपके वास्तविक PostgreSQL डेटाबेस से आपके खर्च, आय और बचत का विश्लेषण किया है।\n\nमुझसे अपने वित्त के बारे में कुछ भी पूछें!"
        : "Hello! I am **FinPilot AI Copilot**. I have analyzed your real PostgreSQL transactions, income, debt, and savings data.\n\nAsk me anything about your finances or select one of the suggested diagnostic chips below!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([welcomeMsg]);
  }, [language]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputValue;
    if (!query.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query, lang: language }),
      });

      if (!res.ok) {
        throw new Error("Assistant request failed.");
      }

      const json = await res.json();

      const aiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: "assistant",
        text: json.reply || "I analyzed your database records, but no detailed reply was returned.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      console.error("Assistant error:", err);
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: "assistant",
        text: language === "hi"
          ? "डेटाबेस मेट्रिक्स प्राप्त करने में समस्या हुई। कृपया पुनः प्रयास करें।"
          : "I encountered an error querying your database metrics. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  return (
    <AppLayout>
      <div className="h-[calc(100vh-7rem)] flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              {t("assistant.title")}
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {t("assistant.subtitle")}
            </p>
          </div>
          <button
            onClick={handleClearChat}
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] transition-all font-medium"
          >
            <Trash2 className="w-3.5 h-3.5" /> {t("assistant.clearChat")}
          </button>
        </div>

        {/* Main Chat Container */}
        <Card variant="glass" className="flex-1 flex flex-col p-4 overflow-hidden border-[var(--border-subtle)]">
          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "assistant" && (
                  <div className="w-8 h-8 rounded-xl bg-purple-900/80 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 shadow-md">
                    <Bot className="w-5 h-5 text-purple-300" />
                  </div>
                )}

                <div
                  className={`max-w-2xl p-4 rounded-2xl text-xs leading-relaxed space-y-2 ${
                    msg.sender === "user"
                      ? "bg-purple-600 text-white rounded-br-none shadow-md font-medium"
                      : "bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-bl-none shadow-lg"
                  }`}
                >
                  <div className="whitespace-pre-line font-normal">{msg.text}</div>
                  <span className="text-[10px] text-[var(--text-muted)] block text-right mt-1 opacity-75">
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === "user" && (
                  <div className="w-8 h-8 rounded-xl bg-purple-700 flex items-center justify-center text-white shrink-0 font-bold text-xs shadow-md">
                    YOU
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-purple-400 p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-fit animate-pulse">
                <Bot className="w-4 h-4 text-purple-400 animate-spin" />
                <span>{language === "hi" ? "FinPilot AI डेटाबेस की समीक्षा कर रहा है..." : "FinPilot AI is querying PostgreSQL & calculating recommendations..."}</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Preset Prompts */}
          <div className="pt-3 border-t border-[var(--border-subtle)]">
            <p className="text-[11px] text-[var(--text-secondary)] font-semibold mb-2 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> {t("assistant.suggestedQuestions")}:
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {suggestedQuestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  disabled={isTyping}
                  className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] hover:text-purple-400 transition-all flex items-center gap-1.5 shadow-sm font-medium"
                >
                  {suggestion} <ArrowRight className="w-3 h-3 text-purple-400" />
                </button>
              ))}
            </div>

            {/* Input Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t("assistant.placeholder")}
                className="flex-1 px-4 py-3 text-xs bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-purple-500"
              />
              <Button type="submit" disabled={isTyping || !inputValue.trim()} variant="primary" icon={<Send className="w-4 h-4" />}>
                {t("assistant.send")}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

