"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import {
  Target,
  Plus,
  Calendar,
  Sparkles,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";

interface GoalItemData {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  requiredMonthlyContribution: number;
  remainingAmount: number;
  percentageCompleted: number;
  monthsRemaining: number;
  targetDate: string;
  formattedTargetDate: string;
  status: "COMPLETED" | "ON_TRACK" | "AT_RISK";
  recommendation: string;
}

interface GoalsApiResponse {
  success: boolean;
  hasGoals: boolean;
  totalGoals: number;
  totalTargetAmount: number;
  totalSaved: number;
  totalMonthlyContribution: number;
  goals: GoalItemData[];
}

export default function GoalsPage() {
  const [data, setData] = useState<GoalsApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [targetAmount, setTargetAmount] = useState<string>("");
  const [currentAmount, setCurrentAmount] = useState<string>("");
  const [monthlyContribution, setMonthlyContribution] = useState<string>("");
  const [targetDate, setTargetDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/goals");
      if (!res.ok) {
        throw new Error(`Failed to load goals: ${res.statusText}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      console.error("Error fetching goals:", err);
      setError(err instanceof Error ? err.message : "Failed to load goals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetAmount || !targetDate) {
      setFormError("Goal title, target amount, and target date are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          targetAmount,
          currentAmount: currentAmount || "0",
          monthlyContribution: monthlyContribution || "0",
          targetDate,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to create goal.");
      }

      // Reset & Refresh
      setTitle("");
      setTargetAmount("");
      setCurrentAmount("");
      setMonthlyContribution("");
      setTargetDate("");
      setIsModalOpen(false);
      fetchGoals();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create goal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;

    try {
      const res = await fetch(`/api/goals?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete goal.");
      }
      fetchGoals();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error deleting goal");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
              <Target className="w-6 h-6 text-purple-400" />
              Goal-Based Financial Planning
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Target planning, progress tracking, and monthly savings allocation.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Create New Goal
          </Button>
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
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Error Loading Goals</h3>
            <p className="text-sm text-[var(--text-secondary)]">{error}</p>
            <button
              onClick={fetchGoals}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Retry
            </button>
          </Card>
        )}

        {/* Content View */}
        {!loading && !error && data && (
          <>
            {/* 4 Top KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card variant="glass">
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Total Goals</p>
                <h3 className="text-2xl font-extrabold text-[var(--text-primary)] mt-1">{data.totalGoals}</h3>
                <p className="text-[11px] text-purple-400 mt-1">Active targets</p>
              </Card>

              <Card variant="glass">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Target Amount</p>
                <h3 className="text-2xl font-extrabold text-purple-300 mt-1">
                  {formatCurrency(data.totalTargetAmount)}
                </h3>
                <p className="text-[11px] text-purple-400 mt-1">Cumulative ambition</p>
              </Card>

              <Card variant="glass">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Saved</p>
                <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">
                  {formatCurrency(data.totalSaved)}
                </h3>
                <p className="text-[11px] text-emerald-300 mt-1">
                  {data.totalTargetAmount > 0
                    ? `${Math.round((data.totalSaved / data.totalTargetAmount) * 100)}% overall progress`
                    : "0% overall progress"}
                </p>
              </Card>

              <Card variant="glass">
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Monthly Contributions</p>
                <h3 className="text-2xl font-extrabold text-[var(--text-primary)] mt-1">
                  {formatCurrency(data.totalMonthlyContribution)}/mo
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1">Allocated monthly savings</p>
              </Card>
            </div>

            {/* Empty State when no goals exist */}
            {!data.hasGoals ? (
              <Card variant="glass" className="p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-900/30 border border-purple-800/40 flex items-center justify-center mx-auto text-purple-400">
                  <Target className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Create Your First Financial Goal</h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    No active goals found in the database. Set a target amount and date to track your savings progress.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => setIsModalOpen(true)}
                  className="mx-auto"
                >
                  Create Goal
                </Button>
              </Card>
            ) : (
              /* Goals Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.goals.map((goal) => (
                  <Card
                    key={goal.id}
                    variant="glass"
                    className="space-y-4 hover:border-purple-500/40 transition-all border-purple-900/30 relative group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <Badge
                          variant={
                            goal.status === "COMPLETED"
                              ? "success"
                              : goal.status === "ON_TRACK"
                              ? "primary"
                              : "warning"
                          }
                        >
                          {goal.status === "COMPLETED"
                            ? "Completed"
                            : goal.status === "ON_TRACK"
                            ? "On Track"
                            : "At Risk"}
                        </Badge>
                        <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight mt-1">{goal.title}</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-2xl font-extrabold text-purple-300">
                            {goal.percentageCompleted}%
                          </span>
                          <p className="text-[10px] text-slate-400">Completed</p>
                        </div>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-400 transition-colors opacity-80 hover:opacity-100"
                          title="Delete Goal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="w-full h-3 rounded-full bg-purple-950/80 overflow-hidden border border-purple-900/40 p-0.5">
                        <div
                          className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-400"
                          style={{ width: `${goal.percentageCompleted}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-[var(--text-primary)]">{formatCurrency(goal.currentAmount)} saved</span>
                        <span className="text-[var(--text-secondary)]">Target: {formatCurrency(goal.targetAmount)}</span>
                      </div>
                    </div>

                    {/* Info Pills */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-purple-900/30 text-xs">
                      <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-900/30">
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Monthly Contribution</p>
                        <p className="font-bold text-purple-300 mt-0.5">
                          {formatCurrency(goal.monthlyContribution > 0 ? goal.monthlyContribution : goal.requiredMonthlyContribution)}/mo
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-900/30">
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Target Date</p>
                        <p className="font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {goal.formattedTargetDate} ({goal.monthsRemaining} mos)
                        </p>
                      </div>
                    </div>

                    {/* Explainable Recommendation Note */}
                    <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/30 text-[11px] text-slate-300 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <span>{goal.recommendation}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Modal Component for Adding a Goal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
                <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  Create New Financial Goal
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateGoal} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[var(--text-secondary)] font-medium">Goal Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Emergency Fund, House Downpayment"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-purple-950/50 border border-purple-800/50 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[var(--text-secondary)] font-medium">Target Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="100000"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[var(--text-secondary)] font-medium">Current Saved (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={currentAmount}
                      onChange={(e) => setCurrentAmount(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[var(--text-secondary)] font-medium">Target Date *</label>
                    <input
                      type="date"
                      required
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-purple-950/50 border border-purple-800/50 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[var(--text-secondary)] font-medium">Monthly Deposit (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Auto-calculated"
                      value={monthlyContribution}
                      onChange={(e) => setMonthlyContribution(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-900/40">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                  >
                    Cancel
                  </button>
                  <Button type="submit" disabled={isSubmitting} variant="primary" size="sm">
                    {isSubmitting ? "Creating..." : "Save Goal"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
