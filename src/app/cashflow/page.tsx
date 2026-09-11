"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { AIInsightCard } from "@/components/dashboard/AIInsightCard";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  Info,
} from "lucide-react";

interface CashFlowPointData {
  month: string;
  income: number;
  expenses: number;
  net: number;
  projectedBalance: number;
}

interface CashFlowInsightData {
  id: string;
  title: string;
  description: string;
  category: "warning" | "tip" | "opportunity";
  impact: string;
  icon: string;
}

interface CashFlowApiResponse {
  success: boolean;
  user: {
    id: string;
    name: string;
    monthlyIncome: number;
  };
  hasData: boolean;
  transactionCount: number;
  currentBalance: number;
  expectedIncome: number;
  committedExpenses: number;
  currentMonthNet: number;
  previousMonthNet: number;
  netChangeFromLastMonth: number;
  projectedMonthEnd: number;
  savingsRate: number;
  expenseRatio: number;
  isNegativeProjected: boolean;
  cashFlowPoints: CashFlowPointData[];
  insights: CashFlowInsightData[];
}

export default function CashFlowPage() {
  const [data, setData] = useState<CashFlowApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [simulateDeficit, setSimulateDeficit] = useState<boolean>(false);

  const fetchCashFlow = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/cashflow");
      if (!res.ok) {
        throw new Error(`Failed to load cash flow data: ${res.statusText}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      console.error("Error fetching cash flow:", err);
      setError(err instanceof Error ? err.message : "Failed to load cash flow intelligence.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCashFlow();
  }, [fetchCashFlow]);

  // Derived metrics with simulation override support
  const committedExpenses = data
    ? simulateDeficit
      ? data.expectedIncome + data.currentBalance + 50000
      : data.committedExpenses
    : 0;

  const expectedIncome = data ? data.expectedIncome : 0;
  const currentBalance = data ? data.currentBalance : 0;
  const projectedMonthEnd = currentBalance + expectedIncome - committedExpenses;
  const isNegative = projectedMonthEnd < 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-purple-400" />
              Cash Flow & Runway Intelligence
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Monitor real liquidity, 6-month income vs. expense trends, and projected runway.
            </p>
          </div>
          <button
            onClick={() => setSimulateDeficit(!simulateDeficit)}
            className="text-xs font-semibold text-purple-300 bg-purple-950/60 hover:bg-purple-900/60 px-3.5 py-2 rounded-xl border border-purple-800/40 transition-all w-fit flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
            {simulateDeficit ? "Reset Normal Scenario" : "Test Negative Cash Flow State"}
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <Card variant="glass" className="p-6 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Error Loading Cash Flow Intelligence</h3>
            <p className="text-sm text-slate-400">{error}</p>
            <button
              onClick={fetchCashFlow}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Retry
            </button>
          </Card>
        )}

        {/* Main Content View */}
        {!loading && !error && data && (
          <>
            {/* Warning Banner for Negative Balance */}
            {isNegative && (
              <div className="p-4 rounded-2xl bg-rose-950/90 border border-rose-500/50 flex items-start gap-3 text-rose-200 animate-pulse shadow-lg">
                <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    CRITICAL WARNING: Negative Month-End Balance Projected!
                  </h4>
                  <p>
                    Your committed expenses ({formatCurrency(committedExpenses)}) exceed total expected liquidity (
                    {formatCurrency(currentBalance + expectedIncome)}). You risk a cash deficit of{" "}
                    <span className="font-extrabold underline">{formatCurrency(Math.abs(projectedMonthEnd))}</span> by month end.
                  </p>
                  <p className="font-medium text-rose-300">
                    Action Required: Defer non-essential expenses or transfer buffer funds immediately to prevent overdraft.
                  </p>
                </div>
              </div>
            )}

            {/* 4 Core Cashflow Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card variant="glass">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Balance</span>
                  <Wallet className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="text-2xl font-extrabold text-white mt-2">{formatCurrency(currentBalance)}</h3>
                <p className="text-[11px] text-slate-400 mt-1">Total liquid account balance</p>
              </Card>

              <Card variant="glass">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Expected Income</span>
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-extrabold text-emerald-400 mt-2">{formatCurrency(expectedIncome)}</h3>
                <p className="text-[11px] text-emerald-300 mt-1">Monthly income baseline</p>
              </Card>

              <Card variant="glass">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Committed Expenses</span>
                  <ArrowDownRight className="w-4 h-4 text-rose-400" />
                </div>
                <h3 className={`text-2xl font-extrabold mt-2 ${simulateDeficit ? "text-rose-400" : "text-white"}`}>
                  {formatCurrency(committedExpenses)}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  {data.expenseRatio}% of income spent
                </p>
              </Card>

              <Card variant="glass">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Projected Month-End</span>
                  <TrendingUp className={`w-4 h-4 ${isNegative ? "text-rose-400" : "text-purple-400"}`} />
                </div>
                <h3 className={`text-2xl font-extrabold mt-2 ${isNegative ? "text-rose-400" : "text-purple-300"}`}>
                  {formatCurrency(projectedMonthEnd)}
                </h3>
                <p className="text-[11px] text-purple-400 mt-1">
                  {isNegative
                    ? `Deficit of ${formatCurrency(Math.abs(projectedMonthEnd))}`
                    : `+${formatCurrency(data.currentMonthNet)} net cash flow`}
                </p>
              </Card>
            </div>

            {/* 6-Month Composed Cash Flow Chart */}
            <CashFlowChart data={data.cashFlowPoints} />

            {/* Explainable Cash-Flow Insights Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Explainable Cash-Flow Insights
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.insights.map((insight) => (
                  <AIInsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
