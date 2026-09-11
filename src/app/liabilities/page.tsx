"use client";

import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MOCK_LIABILITIES } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { Landmark, ShieldAlert, Sparkles, TrendingDown, ArrowUpRight, CheckCircle } from "lucide-react";

export default function LiabilitiesPage() {
  const totalDebt = MOCK_LIABILITIES.reduce((acc, l) => acc + l.outstanding, 0);
  const totalEMI = MOCK_LIABILITIES.reduce((acc, l) => acc + l.emi, 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Liabilities & Debt Engine</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Active loans, credit card balances, interest rates, and AI payoff strategies.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-purple-950/40 p-3 rounded-2xl border border-purple-900/40 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold">Total Outstanding</span>
              <p className="text-base font-extrabold text-rose-400">{formatCurrency(totalDebt)}</p>
            </div>
            <div className="border-l border-purple-800/40 pl-3">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Monthly EMI</span>
              <p className="text-base font-extrabold text-white">{formatCurrency(totalEMI)}/mo</p>
            </div>
          </div>
        </div>

        {/* Debt Priority Strategy Section (Avalanche / Snowball AI engine) */}
        <Card variant="glass" className="bg-gradient-to-r from-[#1c0c38] via-[#14082b] to-[#0d051c] border-purple-500/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-300 animate-pulse" />
              <h3 className="text-base font-bold text-white">AI Debt Payoff Recommendation (Avalanche Method)</h3>
            </div>
            <Badge variant="danger">Priority Action Required</Badge>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            FinPilot AI identified that your <span className="text-rose-300 font-bold">Credit Card Outstanding (36% APR)</span> generates ₹1,440 in wasted interest every single month. By allocating your ₹30,800 monthly surplus to this credit card first, you will become <span className="text-emerald-400 font-bold">credit-card debt free in 47 days</span> and save ₹18,400 in cumulative interest!
          </p>
        </Card>

        {/* Debt Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MOCK_LIABILITIES.map((liab) => {
            const isHighInterest = liab.interestRate >= 20;

            return (
              <Card
                key={liab.id}
                variant="glass"
                className={`space-y-4 relative ${
                  isHighInterest ? "border-rose-500/40 bg-rose-950/10" : "border-purple-900/30"
                }`}
              >
                {isHighInterest && (
                  <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider">
                    High APR (36%)
                  </span>
                )}

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">{liab.type}</span>
                  <h3 className="text-xl font-bold text-white">{liab.name}</h3>
                </div>

                <div className="space-y-2 pt-2 border-t border-purple-900/30">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Outstanding Balance</span>
                    <span className="text-base font-extrabold text-rose-400">{formatCurrency(liab.outstanding)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Interest Rate</span>
                    <span className={`font-bold ${isHighInterest ? "text-rose-400" : "text-amber-300"}`}>
                      {liab.interestRate}% APR
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Monthly EMI</span>
                    <span className="font-bold text-white">{formatCurrency(liab.emi)}</span>
                  </div>
                  {liab.minimumDue && (
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-purple-900/20">
                      <span className="text-slate-400">Minimum Due</span>
                      <span className="font-bold text-rose-300">{formatCurrency(liab.minimumDue)}</span>
                    </div>
                  )}
                </div>

                {liab.recommendationNote && (
                  <div className="p-2.5 rounded-xl bg-purple-950/50 border border-purple-800/40 text-[11px] text-slate-300 space-y-1">
                    <p className="font-semibold text-purple-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-400" /> FinPilot Insight
                    </p>
                    <p className="leading-relaxed">{liab.recommendationNote}</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
