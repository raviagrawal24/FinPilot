"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ExpenseBreakdownChart } from "@/components/dashboard/ExpenseBreakdownChart";
import { AIInsightCard } from "@/components/dashboard/AIInsightCard";
import { formatCurrency } from "@/lib/utils";
import {
  CreditCard,
  Calendar,
  Filter,
  Shield,
  RefreshCw,
  AlertTriangle,
  Receipt,
  PieChart as PieIcon,
  TrendingDown,
  Info,
  Sparkles,
  ArrowDownRight,
  HelpCircle,
} from "lucide-react";

interface ExpenseCategoryData {
  name: string;
  amount: number;
  percentage: number;
  color: string;
  isEssential: boolean;
  count: number;
  explanation: string;
}

interface ExpenseInsightData {
  id: string;
  title: string;
  description: string;
  category: "warning" | "tip" | "opportunity";
  impact: string;
  icon: string;
}

interface RecurringTransaction {
  id: string;
  merchant: string;
  amount: number;
  categoryName: string;
  date: string;
}

interface ExpensesApiResponse {
  totalExpenses: number;
  essentialExpenses: number;
  discretionaryExpenses: number;
  essentialPercentage: number;
  discretionaryPercentage: number;
  transactionCount: number;
  averageExpense: number;
  largestExpense: number;
  recurringExpenseTotal: number;
  categories: ExpenseCategoryData[];
  insights: ExpenseInsightData[];
  recurringExpenses: RecurringTransaction[];
  timeframe: string;
  typeFilter: string;
}

export default function ExpensesPage() {
  const [timeframe, setTimeframe] = useState<string>("current_month");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [data, setData] = useState<ExpensesApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/api/expenses?timeframe=${encodeURIComponent(timeframe)}&typeFilter=${encodeURIComponent(typeFilter)}`
      );

      if (!res.ok) {
        throw new Error(`Failed to load expenses data: ${res.statusText}`);
      }

      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      console.error("Error fetching expenses:", err);
      setError(err instanceof Error ? err.message : "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [timeframe, typeFilter]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header & Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <PieIcon className="w-6 h-6 text-purple-400" />
              Expense Intelligence
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Deep analytics of essential vs. discretionary spending based on real transactions.
            </p>
          </div>

          {/* Controls: Timeframe & Type Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Timeframe Selector */}
            <div className="flex items-center bg-purple-950/60 p-1 rounded-xl border border-purple-800/40 text-xs">
              <button
                onClick={() => setTimeframe("current_month")}
                className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
                  timeframe === "current_month"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Current Month
              </button>
              <button
                onClick={() => setTimeframe("previous_month")}
                className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
                  timeframe === "previous_month"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Previous Month
              </button>
              <button
                onClick={() => setTimeframe("all_time")}
                className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
                  timeframe === "all_time"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                All Time
              </button>
            </div>

            {/* Type Filter Selector */}
            <div className="flex items-center bg-purple-950/60 p-1 rounded-xl border border-purple-800/40 text-xs">
              <button
                onClick={() => setTypeFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
                  typeFilter === "all"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => setTypeFilter("essential")}
                className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
                  typeFilter === "essential"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Essential
              </button>
              <button
                onClick={() => setTypeFilter("discretionary")}
                className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
                  typeFilter === "discretionary"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Discretionary
              </button>
            </div>
          </div>
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
            <h3 className="text-lg font-bold text-white">Error Loading Expenses</h3>
            <p className="text-sm text-slate-400">{error}</p>
            <button
              onClick={fetchExpenses}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Retry
            </button>
          </Card>
        )}

        {/* Content View */}
        {!loading && !error && data && (
          <>
            {/* Empty State when zero expense transactions match */}
            {data.transactionCount === 0 ? (
              <Card variant="glass" className="p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-900/30 border border-purple-800/40 flex items-center justify-center mx-auto text-purple-400">
                  <Receipt className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-lg font-bold text-white">No Expense Transactions Found</h3>
                  <p className="text-xs text-slate-400">
                    No expense records were found for the selected timeframe ({timeframe.replace("_", " ")}) and filter ({typeFilter}). Upload bank statements or add transactions to see expense intelligence.
                  </p>
                </div>
              </Card>
            ) : (
              <>
                {/* 4 Top KPI Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card variant="glass">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Expenses</p>
                    <h3 className="text-2xl font-extrabold text-white mt-1">
                      {formatCurrency(data.totalExpenses)}
                    </h3>
                    <p className="text-[11px] text-purple-400 mt-1 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      {data.transactionCount} expense transaction{data.transactionCount === 1 ? "" : "s"}
                    </p>
                  </Card>

                  <Card variant="glass">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Essential Spending</p>
                    <h3 className="text-2xl font-extrabold text-purple-300 mt-1">
                      {formatCurrency(data.essentialExpenses)}
                    </h3>
                    <p className="text-[11px] text-purple-400 mt-1">
                      {data.essentialPercentage}% of total expense
                    </p>
                  </Card>

                  <Card variant="glass">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Discretionary Spend</p>
                    <h3 className="text-2xl font-extrabold text-amber-400 mt-1">
                      {formatCurrency(data.discretionaryExpenses)}
                    </h3>
                    <p className="text-[11px] text-amber-300 mt-1">
                      {data.discretionaryPercentage}% of total expense
                    </p>
                  </Card>

                  <Card variant="glass">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Expense</p>
                    <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">
                      {formatCurrency(data.averageExpense)}
                    </h3>
                    <p className="text-[11px] text-emerald-300 mt-1">
                      Max individual: {formatCurrency(data.largestExpense)}
                    </p>
                  </Card>
                </div>

                {/* Main Section: Category Breakdown + Explainable Category List & Recurring Commitments */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column (2 cols): Donut Chart & Category Explanation List */}
                  <div className="lg:col-span-2 space-y-6">
                    <ExpenseBreakdownChart categories={data.categories} />

                    {/* Detailed Explainable Category Breakdown */}
                    <Card variant="glass" className="space-y-4">
                      <CardHeader>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Info className="w-5 h-5 text-purple-400" />
                            Explainable Category Intelligence
                          </CardTitle>
                          <CardDescription>
                            Detailed breakdown of every expense category with transaction-backed logic.
                          </CardDescription>
                        </div>
                      </CardHeader>

                      <div className="space-y-3">
                        {data.categories.map((cat) => (
                          <div
                            key={cat.name}
                            className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-900/30 hover:border-purple-500/40 transition-all space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <span
                                  className="w-3 h-3 rounded-full shrink-0"
                                  style={{ backgroundColor: cat.color }}
                                />
                                <span className="font-semibold text-white text-sm">{cat.name}</span>
                                <Badge
                                  variant={cat.isEssential ? "primary" : "warning"}
                                  className="text-[10px]"
                                >
                                  {cat.isEssential ? "Essential" : "Discretionary"}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-white text-sm">
                                  {formatCurrency(cat.amount)}
                                </span>
                                <span className="text-xs text-purple-300 ml-2">({cat.percentage}%)</span>
                              </div>
                            </div>

                            {/* Human-readable calculation explanation line */}
                            <div className="p-2 rounded-lg bg-slate-900/40 text-xs text-slate-300 flex items-center justify-between border border-slate-800/40">
                              <span className="font-mono text-purple-200">{cat.explanation}</span>
                              <span className="text-[11px] text-slate-400 shrink-0 ml-2">
                                {cat.count} {cat.count === 1 ? "txn" : "txns"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>

                  {/* Right Column: Recurring Expenses */}
                  <div className="space-y-6">
                    <Card variant="glass" className="space-y-4">
                      <CardHeader>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <RefreshCw className="w-5 h-5 text-purple-400" />
                            Recurring Expenses
                          </CardTitle>
                          <CardDescription>
                            Detected subscriptions & recurring commitments.
                          </CardDescription>
                        </div>
                        {data.recurringExpenseTotal > 0 && (
                          <span className="text-xs font-semibold text-purple-300 bg-purple-950/60 px-2.5 py-1 rounded-full border border-purple-800/40">
                            Total: {formatCurrency(data.recurringExpenseTotal)}
                          </span>
                        )}
                      </CardHeader>

                      {data.recurringExpenses.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">
                          No recurring expense transactions flagged in this timeframe.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {data.recurringExpenses.map((tx) => (
                            <div
                              key={tx.id}
                              className="p-3 rounded-xl bg-purple-950/30 border border-purple-900/30 flex items-center justify-between text-xs hover:border-purple-500/40 transition-all"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-purple-900/40 flex items-center justify-center text-purple-300">
                                  <RefreshCw className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="font-semibold text-white">{tx.merchant}</p>
                                  <p className="text-[10px] text-slate-400">
                                    {tx.categoryName} • {new Date(tx.date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <span className="font-bold text-white">{formatCurrency(tx.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </div>
                </div>

                {/* Rule-Based AI Spending Insights Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    AI Spending Insights
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {data.insights.map((insight) => (
                      <AIInsightCard key={insight.id} insight={insight} />
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
