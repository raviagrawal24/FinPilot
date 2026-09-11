"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import {
  Landmark,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  ArrowUpRight,
  CheckCircle,
  Plus,
  Trash2,
  AlertTriangle,
  X,
  CreditCard,
  Percent,
} from "lucide-react";

interface LiabilityItemData {
  id: string;
  name: string;
  type: string;
  outstanding: number;
  interestRate: number;
  emi: number;
  minimumDue: number | null;
  dueDate: string | null;
  priorityRank: number;
  priorityReason: string;
}

interface LiabilitiesApiResponse {
  success: boolean;
  hasLiabilities: boolean;
  totalDebt: number;
  totalMonthlyEMI: number;
  activeLiabilitiesCount: number;
  highestInterestRate: number;
  weightedAverageInterestRate: number;
  topRecommendation: {
    priorityDebtName: string;
    interestRate: number;
    monthlyInterestWaste: number;
    explanation: string;
  } | null;
  liabilities: LiabilityItemData[];
}

export default function LiabilitiesPage() {
  const [data, setData] = useState<LiabilitiesApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [outstanding, setOutstanding] = useState<string>("");
  const [interestRate, setInterestRate] = useState<string>("");
  const [emi, setEmi] = useState<string>("");
  const [minimumDue, setMinimumDue] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchLiabilities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/liabilities");
      if (!res.ok) {
        throw new Error(`Failed to load liabilities: ${res.statusText}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      console.error("Error fetching liabilities:", err);
      setError(err instanceof Error ? err.message : "Failed to load liabilities");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiabilities();
  }, [fetchLiabilities]);

  const handleCreateLiability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || outstanding === "" || interestRate === "" || emi === "") {
      setFormError("Debt name, outstanding amount, interest rate, and monthly EMI are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      const res = await fetch("/api/liabilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          outstanding,
          interestRate,
          emi,
          minimumDue: minimumDue || undefined,
          dueDate: dueDate || undefined,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to create liability.");
      }

      // Reset & Refresh
      setName("");
      setOutstanding("");
      setInterestRate("");
      setEmi("");
      setMinimumDue("");
      setDueDate("");
      setIsModalOpen(false);
      fetchLiabilities();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create liability.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLiability = async (id: string) => {
    if (!confirm("Are you sure you want to delete this liability?")) return;

    try {
      const res = await fetch(`/api/liabilities?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete liability.");
      }
      fetchLiabilities();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error deleting liability");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
              <Landmark className="w-6 h-6 text-purple-400" />
              Liabilities & Debt Intelligence
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Active loans, credit card balances, interest rates, and explainable debt avalanche priorities.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Add Liability
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
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Error Loading Liabilities</h3>
            <p className="text-sm text-[var(--text-secondary)]">{error}</p>
            <button
              onClick={fetchLiabilities}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Retry
            </button>
          </Card>
        )}

        {/* Main Content View */}
        {!loading && !error && data && (
          <>
            {/* 4 Core Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card variant="glass">
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Total Outstanding Debt</p>
                <h3 className="text-2xl font-extrabold text-rose-400 mt-1">
                  {formatCurrency(data.totalDebt)}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">{data.activeLiabilitiesCount} active loans/cards</p>
              </Card>

              <Card variant="glass">
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Active Liabilities</p>
                <h3 className="text-2xl font-extrabold text-[var(--text-primary)] mt-1">{data.activeLiabilitiesCount}</h3>
                <p className="text-[11px] text-purple-400 mt-1">Tracked obligations</p>
              </Card>

              <Card variant="glass">
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Monthly EMI</p>
                <h3 className="text-2xl font-extrabold text-[var(--text-primary)] mt-1">
                  {formatCurrency(data.totalMonthlyEMI)}/mo
                </h3>
                <p className="text-[11px] text-rose-300 mt-1">Monthly debt commitment</p>
              </Card>

              <Card variant="glass">
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Highest Interest Rate</p>
                <h3 className="text-2xl font-extrabold text-amber-400 mt-1">
                  {data.highestInterestRate}% APR
                </h3>
                <p className="text-[11px] text-amber-300 mt-1">
                  Weighted avg: {data.weightedAverageInterestRate}% APR
                </p>
              </Card>
            </div>

            {/* Empty State when no liabilities exist */}
            {!data.hasLiabilities ? (
              <Card variant="glass" className="p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-900/30 border border-purple-800/40 flex items-center justify-center mx-auto text-purple-400">
                  <Landmark className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">No Active Liabilities Found</h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    No active liabilities or loans found in your database. Add a debt or loan obligation to calculate your payoff strategy.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => setIsModalOpen(true)}
                  className="mx-auto"
                >
                  Add Liability
                </Button>
              </Card>
            ) : (
              <>
                {/* AI Debt Prioritization Strategy Banner */}
                {data.topRecommendation && (
                  <Card
                    variant="glass"
                    className="bg-gradient-to-r from-[#1c0c38] via-[#14082b] to-[#0d051c] border-purple-500/40 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-300 animate-pulse" />
                        <h3 className="text-base font-bold text-[var(--text-primary)]">
                          AI Debt Payoff Strategy (Avalanche Method)
                        </h3>
                      </div>
                      <Badge variant="danger">Priority Action Required</Badge>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {data.topRecommendation.explanation}
                    </p>
                  </Card>
                )}

                {/* Debt Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {data.liabilities.map((liab) => {
                    const isHighInterest = liab.interestRate >= 20;

                    return (
                      <Card
                        key={liab.id}
                        variant="glass"
                        className={`space-y-4 relative ${
                          isHighInterest ? "border-rose-500/40 bg-rose-950/10" : "border-purple-900/30"
                        }`}
                      >
                        {/* Priority Badge */}
                        <div className="flex items-center justify-between">
                          <Badge
                            variant={liab.priorityRank === 1 ? "danger" : "primary"}
                            className="text-[10px] font-extrabold uppercase tracking-wider"
                          >
                            Priority #{liab.priorityRank}
                          </Badge>

                          <button
                            onClick={() => handleDeleteLiability(liab.id)}
                            className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-400 transition-colors opacity-80 hover:opacity-100"
                            title="Delete Liability"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[11px] text-slate-400 uppercase font-semibold">
                            {liab.type.replace("_", " ")}
                          </span>
                          <h3 className="text-xl font-bold text-[var(--text-primary)]">{liab.name}</h3>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-purple-900/30">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Outstanding Balance</span>
                            <span className="text-base font-extrabold text-rose-400">
                              {formatCurrency(liab.outstanding)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Interest Rate</span>
                            <span
                              className={`font-bold ${
                                isHighInterest ? "text-rose-400" : "text-amber-300"
                              }`}
                            >
                              {liab.interestRate}% APR
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Monthly EMI</span>
                            <span className="font-bold text-white">{formatCurrency(liab.emi)}</span>
                          </div>
                          {liab.minimumDue !== null && (
                            <div className="flex items-center justify-between text-xs pt-1 border-t border-purple-900/20">
                              <span className="text-slate-400">Minimum Due</span>
                              <span className="font-bold text-rose-300">
                                {formatCurrency(liab.minimumDue)}
                              </span>
                            </div>
                          )}
                          {liab.dueDate && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">Next Due Date</span>
                              <span className="font-medium text-slate-200">{liab.dueDate}</span>
                            </div>
                          )}
                        </div>

                        {/* Priority Rationale Explanation */}
                        <div className="p-2.5 rounded-xl bg-purple-950/50 border border-purple-800/40 text-[11px] text-slate-300 space-y-1">
                          <p className="font-semibold text-purple-300 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-purple-400" /> Priority Rationale
                          </p>
                          <p className="leading-relaxed">{liab.priorityReason}</p>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* Modal Component for Adding a Liability */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
                <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-purple-400" />
                  Add New Liability / Debt
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors"
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

              <form onSubmit={handleCreateLiability} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[var(--text-secondary)] font-medium">Debt Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Credit Card, HDFC Home Loan, Personal Loan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[var(--text-secondary)] font-medium">Outstanding Balance (â‚¹) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      placeholder="50000"
                      value={outstanding}
                      onChange={(e) => setOutstanding(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[var(--text-secondary)] font-medium">Interest Rate (% APR) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      placeholder="14.5"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[var(--text-secondary)] font-medium">Monthly EMI (â‚¹) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      placeholder="4500"
                      value={emi}
                      onChange={(e) => setEmi(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[var(--text-secondary)] font-medium">Minimum Due (â‚¹)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Optional"
                      value={minimumDue}
                      onChange={(e) => setMinimumDue(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[var(--text-secondary)] font-medium">Next Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-purple-950/50 border border-purple-800/50 text-white focus:outline-none focus:border-purple-500"
                  />
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
                    {isSubmitting ? "Adding..." : "Save Liability"}
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
