"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, AlertTriangle, ShieldCheck, Wallet, ArrowDownRight, ArrowUpRight } from "lucide-react";

export default function CashFlowPage() {
  const [simulateDeficit, setSimulateDeficit] = useState(false);

  const currentBalance = 147300;
  const expectedIncome = 85000;
  const committedExpenses = simulateDeficit ? 245000 : 54200; // Deficit state trigger
  const projectedMonthEnd = currentBalance + expectedIncome - committedExpenses;
  const isNegative = projectedMonthEnd < 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Cash Flow & Runway</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Monitor current liquidity, upcoming income streams, and 6-month projected runway.
            </p>
          </div>
          <button
            onClick={() => setSimulateDeficit(!simulateDeficit)}
            className="text-xs text-purple-300 bg-purple-950/60 hover:bg-purple-900/60 px-3 py-1.5 rounded-xl border border-purple-800/40 transition-colors w-fit"
          >
            {simulateDeficit ? "Reset Normal Scenario" : "Test Negative Cash Flow State"}
          </button>
        </div>

        {/* Warning Banner for Negative Balance */}
        {isNegative && (
          <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex items-start gap-3 text-rose-200 animate-pulse">
            <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-sm text-white">CRITICAL WARNING: Negative Balance Projected!</h4>
              <p>
                Your committed expenses ({formatCurrency(committedExpenses)}) exceed expected liquidity ({formatCurrency(currentBalance + expectedIncome)}). You are at risk of an overdrawn balance of{" "}
                <span className="font-extrabold underline">{formatCurrency(Math.abs(projectedMonthEnd))}</span> by month end.
              </p>
              <p className="font-medium text-rose-300">
                Action Required: Consider liquidating short-term investments or deferring non-essential EMIs.
              </p>
            </div>
          </div>
        )}

        {/* 4 Core Cashflow Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="glass">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">Current Balance</span>
              <Wallet className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="text-2xl font-extrabold text-white mt-2">{formatCurrency(currentBalance)}</h3>
            <p className="text-[11px] text-slate-400 mt-1">HDFC & ICICI Accounts</p>
          </Card>

          <Card variant="glass">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">Expected Income</span>
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-extrabold text-emerald-400 mt-2">{formatCurrency(expectedIncome)}</h3>
            <p className="text-[11px] text-emerald-300 mt-1">Salary expected on 30th</p>
          </Card>

          <Card variant="glass">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">Committed Expenses</span>
              <ArrowDownRight className="w-4 h-4 text-rose-400" />
            </div>
            <h3 className={`text-2xl font-extrabold mt-2 ${simulateDeficit ? "text-rose-400" : "text-white"}`}>
              {formatCurrency(committedExpenses)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Rent, EMIs, Subscriptions</p>
          </Card>

          <Card variant="glass">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">Projected Month-End</span>
              <TrendingUp className={`w-4 h-4 ${isNegative ? "text-rose-400" : "text-purple-400"}`} />
            </div>
            <h3 className={`text-2xl font-extrabold mt-2 ${isNegative ? "text-rose-400" : "text-purple-300"}`}>
              {formatCurrency(projectedMonthEnd)}
            </h3>
            <p className="text-[11px] text-purple-400 mt-1">
              {isNegative ? "Deficit warning active" : "+ ₹30,800 net surplus"}
            </p>
          </Card>
        </div>

        {/* Forecast Chart */}
        <CashFlowChart />
      </div>
    </AppLayout>
  );
}
