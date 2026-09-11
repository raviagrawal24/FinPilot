"use client";

import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ExpenseBreakdownChart } from "@/components/dashboard/ExpenseBreakdownChart";
import { AIInsightCard } from "@/components/dashboard/AIInsightCard";
import { MOCK_EXPENSE_CATEGORIES, MOCK_AI_INSIGHTS, MOCK_TRANSACTIONS } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, Calendar, ShoppingBag, Shield, Utensils, RefreshCw, AlertTriangle } from "lucide-react";

export default function ExpensesPage() {
  const totalSpending = 54200;
  const avgDailySpending = Math.round(totalSpending / 30);
  const essentialSpending = MOCK_EXPENSE_CATEGORIES.filter((c) => c.isEssential).reduce(
    (acc, c) => acc + c.amount,
    0
  );
  const discretionarySpending = totalSpending - essentialSpending;

  const recurringExpenses = MOCK_TRANSACTIONS.filter((tx) => tx.isRecurring);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Expense Intelligence</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Deep breakdown of essential vs discretionary spending and recurring commitments.
          </p>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="glass">
            <p className="text-xs font-semibold text-slate-400 uppercase">Total Monthly Spend</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{formatCurrency(totalSpending)}</h3>
            <p className="text-[11px] text-purple-400 mt-1">63.7% of monthly income</p>
          </Card>

          <Card variant="glass">
            <p className="text-xs font-semibold text-slate-400 uppercase">Avg Daily Spend</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{formatCurrency(avgDailySpending)}</h3>
            <p className="text-[11px] text-emerald-400 mt-1">Based on 30-day cycle</p>
          </Card>

          <Card variant="glass">
            <p className="text-xs font-semibold text-slate-400 uppercase">Essential Spending</p>
            <h3 className="text-2xl font-extrabold text-purple-300 mt-1">
              {formatCurrency(essentialSpending)}
            </h3>
            <p className="text-[11px] text-purple-400 mt-1">Rent, Groceries, Utilities (78.8%)</p>
          </Card>

          <Card variant="glass">
            <p className="text-xs font-semibold text-slate-400 uppercase">Discretionary Spend</p>
            <h3 className="text-2xl font-extrabold text-amber-400 mt-1">
              {formatCurrency(discretionarySpending)}
            </h3>
            <p className="text-[11px] text-amber-300 mt-1">Shopping, Dining, Media (21.2%)</p>
          </Card>
        </div>

        {/* Charts & Breakdown Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ExpenseBreakdownChart />
          </div>

          {/* Recurring Expenses Card */}
          <Card variant="glass" className="space-y-4">
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-purple-400" />
                  Recurring Expenses
                </CardTitle>
                <CardDescription>Automated monthly subscriptions & charges.</CardDescription>
              </div>
            </CardHeader>

            <div className="space-y-2">
              {recurringExpenses.map((tx) => (
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
                      <p className="text-[10px] text-slate-400">{tx.category} • Monthly</p>
                    </div>
                  </div>
                  <span className="font-bold text-white">{formatCurrency(tx.amount)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* AI Spending Insights Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            AI Spending Diagnostics
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MOCK_AI_INSIGHTS.map((insight) => (
              <AIInsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
