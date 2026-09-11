"use client";

import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { HealthScoreGauge } from "@/components/dashboard/HealthScoreGauge";
import { KPICard } from "@/components/dashboard/KPICard";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { ExpenseBreakdownChart } from "@/components/dashboard/ExpenseBreakdownChart";
import { AIInsightCard } from "@/components/dashboard/AIInsightCard";
import { AlertCard } from "@/components/dashboard/AlertCard";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  MOCK_KPIS,
  MOCK_GOALS,
  MOCK_AI_INSIGHTS,
  MOCK_ALERTS,
} from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { Target, Sparkles, BellRing, ArrowRight, ShieldCheck, Plus } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const emergencyGoal = MOCK_GOALS[0];
  const emergencyPct = Math.round((emergencyGoal.currentAmount / emergencyGoal.targetAmount) * 100);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Good afternoon 👋
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Here&apos;s your personal financial health overview & AI diagnosis.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/simulator">
              <Button variant="secondary" size="sm" icon={<Sparkles className="w-3.5 h-3.5 text-purple-400" />}>
                What-If Simulator
              </Button>
            </Link>
          </div>
        </div>

        {/* Health Score Gauge Banner */}
        <HealthScoreGauge score={78} />

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MOCK_KPIS.map((metric) => (
            <KPICard key={metric.title} metric={metric} />
          ))}
        </div>

        {/* Cash Flow Chart & Expense Breakdown Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CashFlowChart />
          </div>
          <div className="lg:col-span-1">
            <ExpenseBreakdownChart />
          </div>
        </div>

        {/* Goals & AI Insights Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Goals Card */}
          <Card variant="glass" className="lg:col-span-1 space-y-4">
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  Financial Goals
                </CardTitle>
                <CardDescription>Track progress toward savings targets.</CardDescription>
              </div>
              <Link href="/goals" className="text-xs text-purple-400 hover:underline">
                View All
              </Link>
            </CardHeader>

            <div className="space-y-4">
              {/* Highlighted Emergency Fund Goal */}
              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{emergencyGoal.title}</span>
                  <span className="text-xs font-semibold text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded-full border border-purple-500/30">
                    {emergencyPct}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>{formatCurrency(emergencyGoal.currentAmount)}</span>
                  <span className="text-slate-400">Target: {formatCurrency(emergencyGoal.targetAmount)}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-purple-950 overflow-hidden border border-purple-900/40">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full transition-all duration-500"
                    style={{ width: `${emergencyPct}%` }}
                  />
                </div>
                <p className="text-[11px] text-purple-300 pt-1">
                  Monthly contribution: {formatCurrency(emergencyGoal.monthlyContribution)}/mo
                </p>
              </div>

              {/* Other Goals Summary */}
              <div className="space-y-2">
                {MOCK_GOALS.slice(1, 3).map((goal) => {
                  const pct = Math.round((goal.currentAmount / goal.targetAmount) * 100);
                  return (
                    <div
                      key={goal.id}
                      className="p-3 rounded-xl bg-purple-950/20 border border-purple-900/20 flex items-center justify-between text-xs hover:border-purple-500/30 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-white">{goal.title}</p>
                        <p className="text-slate-400 text-[10px]">
                          {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                        </p>
                      </div>
                      <span className="font-bold text-purple-300">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* AI Insights Cards */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  AI Spending Insights
                </h3>
                <p className="text-xs text-slate-400">Automated diagnostic rules & cost saving opportunities.</p>
              </div>
              <Link href="/assistant" className="text-xs text-purple-400 hover:underline">
                Ask FinPilot AI
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MOCK_AI_INSIGHTS.map((insight) => (
                <AIInsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BellRing className="w-5 h-5 text-rose-400" />
              Priority Alerts
            </h3>
            <Link href="/alerts" className="text-xs text-purple-400 hover:underline">
              View All Alerts
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_ALERTS.slice(0, 4).map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
