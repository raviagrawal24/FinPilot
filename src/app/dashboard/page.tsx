"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { HealthScoreGauge } from "@/components/dashboard/HealthScoreGauge";
import { KPICard } from "@/components/dashboard/KPICard";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { ExpenseBreakdownChart } from "@/components/dashboard/ExpenseBreakdownChart";
import { AIInsightCard } from "@/components/dashboard/AIInsightCard";
import { AlertCard } from "@/components/dashboard/AlertCard";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MOCK_AI_INSIGHTS } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { KPIMetric, CashFlowPoint, ExpenseCategoryItem } from "@/types";
import { Target, Sparkles, BellRing, RefreshCw, Plus } from "lucide-react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";

export default function DashboardPage() {
  const { t, user } = useApp();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<{
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlySavings: number;
    savingsRate: number;
    totalDebt: number;
    healthScore: number;
    transactionCount: number;
    expenseBreakdown: ExpenseCategoryItem[];
    monthlyCashFlow: CashFlowPoint[];
    user?: any;
  } | null>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [dashRes, goalsRes, alertsRes] = await Promise.all([
          fetch("/api/dashboard"),
          fetch("/api/goals"),
          fetch("/api/alerts"),
        ]);
        if (dashRes.ok) {
          const data = await dashRes.json();
          if (data.success) setDashboardData(data);
        }
        if (goalsRes.ok) {
          const gData = await goalsRes.json();
          if (gData.goals) setGoals(gData.goals.slice(0, 3));
        }
        if (alertsRes.ok) {
          const aData = await alertsRes.json();
          if (aData.alerts) setAlerts(aData.alerts.slice(0, 4));
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const kpiMetrics: KPIMetric[] = dashboardData
    ? [
        {
          title: t("dashboard.monthlyIncome"),
          value: dashboardData.monthlyIncome,
          formattedValue: formatCurrency(dashboardData.monthlyIncome),
          changePercent: 5.2,
          trend: "up",
          subtitle: "Primary salary + active streams",
          iconName: "TrendingUp",
        },
        {
          title: t("dashboard.monthlyExpenses"),
          value: dashboardData.monthlyExpenses,
          formattedValue: formatCurrency(dashboardData.monthlyExpenses),
          changePercent: -3.8,
          trend: "down",
          subtitle: `${((dashboardData.monthlyExpenses / (dashboardData.monthlyIncome || 1)) * 100).toFixed(1)}% of total income`,
          iconName: "CreditCard",
        },
        {
          title: t("dashboard.monthlySavings"),
          value: dashboardData.monthlySavings,
          formattedValue: formatCurrency(dashboardData.monthlySavings),
          changePercent: 14.5,
          trend: "up",
          subtitle: `${dashboardData.savingsRate}% ${t("dashboard.savingsRate")}`,
          iconName: "PiggyBank",
        },
        {
          title: t("dashboard.totalDebt"),
          value: dashboardData.totalDebt,
          formattedValue: formatCurrency(dashboardData.totalDebt),
          changePercent: -2.1,
          trend: "down",
          subtitle: "Active loan obligations",
          iconName: "Landmark",
        },
      ]
    : [];

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
              {t("dashboard.title")}, {firstName} 👋
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5 flex items-center gap-2">
              {t("dashboard.subtitle")}
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {dashboardData?.transactionCount !== undefined && (
              <Badge variant="primary">{dashboardData.transactionCount} DB Transactions</Badge>
            )}
            <Link href="/simulator">
              <Button variant="secondary" size="sm" icon={<Sparkles className="w-3.5 h-3.5 text-purple-400" />}>
                {t("nav.simulator")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Health Score Gauge Banner */}
        <HealthScoreGauge score={dashboardData?.healthScore ?? 78} />

        {/* KPI Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-[var(--bg-surface)] animate-pulse border border-[var(--border-subtle)]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiMetrics.map((metric) => (
              <KPICard key={metric.title} metric={metric} />
            ))}
          </div>
        )}

        {/* Cash Flow Chart & Expense Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CashFlowChart data={dashboardData?.monthlyCashFlow} />
          </div>
          <div className="lg:col-span-1">
            <ExpenseBreakdownChart categories={dashboardData?.expenseBreakdown} />
          </div>
        </div>

        {/* Goals & AI Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Goals Card */}
          <Card variant="glass" className="lg:col-span-1 space-y-4">
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  {t("goals.title")}
                </CardTitle>
                <CardDescription>{t("goals.subtitle")}</CardDescription>
              </div>
              <Link href="/goals" className="text-xs text-purple-400 hover:underline">
                {t("dashboard.viewAll")}
              </Link>
            </CardHeader>

            <div className="space-y-3">
              {goals.length === 0 ? (
                <div className="p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center space-y-2">
                  <Target className="w-8 h-8 text-purple-400/50 mx-auto" />
                  <p className="text-xs text-[var(--text-secondary)]">No financial goals yet</p>
                  <Link href="/goals">
                    <button className="text-xs text-purple-400 hover:underline flex items-center gap-1 mx-auto">
                      <Plus className="w-3 h-3" /> Create a goal
                    </button>
                  </Link>
                </div>
              ) : (
                goals.map((goal: any) => {
                  const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                  return (
                    <div key={goal.id} className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1.5 hover:border-purple-500/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[var(--text-primary)] truncate max-w-[160px]">{goal.title}</span>
                        <span className="text-xs font-semibold text-purple-400 bg-purple-600/20 px-2 py-0.5 rounded-full border border-purple-500/30">{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[var(--bg-canvas)] overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                        <span>{formatCurrency(goal.currentAmount)}</span>
                        <span>Target: {formatCurrency(goal.targetAmount)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* AI Insights Cards */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  AI Spending Insights
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">Automated diagnostic rules & cost saving opportunities.</p>
              </div>
              <Link href="/assistant" className="text-xs text-purple-400 hover:underline font-medium">
                {t("nav.assistant")}
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
            <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <BellRing className="w-5 h-5 text-rose-400" />
              {t("alerts.title")}
            </h3>
            <Link href="/alerts" className="text-xs text-purple-400 hover:underline font-medium">
              {t("dashboard.viewAll")}
            </Link>
          </div>

          {alerts.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center space-y-2">
              <BellRing className="w-8 h-8 text-emerald-400/60 mx-auto" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">All Clear!</p>
              <p className="text-xs text-[var(--text-secondary)]">No active alerts require your attention.</p>
              <Link href="/alerts">
                <button className="text-xs text-purple-400 hover:underline">Run Alert Analysis →</button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alerts.map((alert: any) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
