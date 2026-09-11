"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MOCK_INITIAL_CHAT, MOCK_CHAT_SUGGESTIONS } from "@/lib/mock-data";
import { ChatMessage } from "@/types";
import { Sparkles, Send, Bot, User, ArrowRight, Lightbulb } from "lucide-react";

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_INITIAL_CHAT);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (textToSend?: string) => {
    const query = textToSend || inputValue;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue("");
    setIsTyping(true);

    // Mock AI intelligent response logic
    setTimeout(() => {
      let aiResponseText = "";

      if (query.includes("25,000 phone") || query.includes("afford")) {
        aiResponseText =
          "Based on your current liquid savings of ₹1,47,300 and monthly surplus of ₹30,800, **YES, you can afford a ₹25,000 phone**. However, doing so upfront will reduce your Emergency Fund goal progress by 16 days. *Recommendation:* Consider taking a 3-month No-Cost EMI of ₹8,333/mo to preserve cash buffer liquidity.";
      } else if (query.includes("save") || query.includes("month")) {
        aiResponseText =
          "Your current monthly surplus is **₹30,800**. I recommend allocating:\n\n1. **₹10,000** to Emergency Fund\n2. **₹15,000** to pay down Credit Card (36% interest!)\n3. **₹5,800** flexible discretionary buffer.";
      } else if (query.includes("debt") || query.includes("pay first")) {
        aiResponseText =
          "CRITICAL RECOMMENDATION: Pay your **Credit Card Outstanding (₹48,000 at 36% APR)** first! Paying this off aggressively using your monthly surplus saves you **₹1,440/month** in pure interest charges.";
      } else if (query.includes("overspending")) {
        aiResponseText =
          "You are overspending in **Food & Dining Out** (₹12,500/mo, 23% above 3-month baseline) and **Shopping** (₹14,999 recent tech purchase). Trimming Swiggy/Zomato by 30% frees up ₹3,750/month.";
      } else {
        aiResponseText =
          `Thank you for asking: "${query}". Based on your financial diagnostic (Health Score 78/100), your overall liquidity is strong, but debt optimization on high-interest balances will yield the highest return.`;
      }

      const aiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: "assistant",
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <AppLayout>
      <div className="h-[calc(100vh-7rem)] flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              FinPilot AI Copilot
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Ask explainable financial health questions, budget advice, and scenario assessments.
            </p>
          </div>
        </div>

        {/* Main Chat Container */}
        <Card variant="glass" className="flex-1 flex flex-col p-4 overflow-hidden border-purple-900/30">
          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "assistant" && (
                  <div className="w-8 h-8 rounded-xl bg-purple-900/80 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                )}

                <div
                  className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed space-y-2 ${
                    msg.sender === "user"
                      ? "bg-purple-600 text-white rounded-br-none"
                      : "bg-[#120a21] text-slate-200 border border-purple-900/40 rounded-bl-none shadow-lg"
                  }`}
                >
                  <p className="whitespace-pre-line font-medium">{msg.text}</p>
                  <span className="text-[10px] text-slate-400 block text-right mt-1 opacity-75">
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === "user" && (
                  <div className="w-8 h-8 rounded-xl bg-purple-700 flex items-center justify-center text-white shrink-0 font-bold text-xs">
                    AM
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-purple-300 p-2">
                <Bot className="w-4 h-4 animate-spin" /> FinPilot AI is calculating recommendation...
              </div>
            )}
          </div>

          {/* Quick Preset Prompts */}
          <div className="pt-3 border-t border-purple-900/30">
            <p className="text-[11px] text-slate-400 font-semibold mb-2 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Suggested Diagnostic Questions:
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {MOCK_CHAT_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  className="px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/40 text-xs text-purple-200 hover:text-white transition-all flex items-center gap-1.5"
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
                placeholder="Ask FinPilot AI (e.g., 'Should I prepay my home loan or invest?')..."
                className="flex-1 px-4 py-3 text-xs bg-purple-950/30 border border-purple-900/40 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-500/60"
              />
              <Button type="submit" variant="primary" icon={<Send className="w-4 h-4" />}>
                Send
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
