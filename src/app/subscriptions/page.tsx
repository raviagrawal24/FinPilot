"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import {
  Repeat,
  Sparkles,
  AlertCircle,
  Trash2,
  Plus,
  AlertTriangle,
  X,
  Calendar,
  CreditCard,
  Tv,
} from "lucide-react";

interface SubscriptionItemData {
  id: string;
  name: string;
  amount: number;
  billingCycle: string;
  nextBilling: string;
  category: string;
  isUnused: boolean;
  monthlyEquivalent: number;
}

interface SubscriptionsApiResponse {
  success: boolean;
  hasSubscriptions: boolean;
  totalActive: number;
  monthlyCost: number;
  annualizedCost: number;
  upcomingPaymentsCount: number;
  unusedSubscriptionsCount: number;
  insight: string;
  subscriptions: SubscriptionItemData[];
}

export default function SubscriptionsPage() {
  const [data, setData] = useState<SubscriptionsApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [billingCycle, setBillingCycle] = useState<string>("MONTHLY");
  const [nextBilling, setNextBilling] = useState<string>("");
  const [category, setCategory] = useState<string>("Entertainment");
  const [isUnused, setIsUnused] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/subscriptions");
      if (!res.ok) {
        throw new Error(`Failed to load subscriptions: ${res.statusText}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      console.error("Error fetching subscriptions:", err);
      setError(err instanceof Error ? err.message : "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || amount === "" || !nextBilling) {
      setFormError("Service name, amount, and next billing date are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          amount,
          billingCycle,
          nextBilling,
          category,
          isUnused,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to create subscription.");
      }

      // Reset & Refresh
      setName("");
      setAmount("");
      setBillingCycle("MONTHLY");
      setNextBilling("");
      setCategory("Entertainment");
      setIsUnused(false);
      setIsModalOpen(false);
      fetchSubscriptions();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create subscription.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subscription?")) return;

    try {
      const res = await fetch(`/api/subscriptions?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete subscription.");
      }
      fetchSubscriptions();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error deleting subscription");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
              <Repeat className="w-6 h-6 text-purple-400" />
              Subscription Intelligence
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Manage recurring services, auto-detected subscriptions, and unused payment leaks.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Add Subscription
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
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Error Loading Subscriptions</h3>
            <p className="text-sm text-[var(--text-secondary)]">{error}</p>
            <button
              onClick={fetchSubscriptions}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Retry
            </button>
          </Card>
        )}

        {/* Content View */}
        {!loading && !error && data && (
          <>
            {/* Top Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card variant="glass">
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Active Subscriptions</p>
                <h3 className="text-2xl font-extrabold text-[var(--text-primary)] mt-1">{data.totalActive}</h3>
                <p className="text-[11px] text-purple-400 mt-1">Tracked recurring services</p>
              </Card>

              <Card variant="glass">
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Monthly Spend</p>
                <h3 className="text-2xl font-extrabold text-[var(--text-primary)] mt-1">{formatCurrency(data.monthlyCost)}</h3>
                <p className="text-[11px] text-purple-300 mt-1">Total monthly impact</p>
              </Card>

              <Card variant="glass">
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Annualized Cost</p>
                <h3 className="text-2xl font-extrabold text-purple-300 mt-1">
                  {formatCurrency(data.annualizedCost)}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">Annual recurring commitment</p>
              </Card>

              <Card variant="glass">
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Upcoming Payments</p>
                <h3 className="text-2xl font-extrabold text-amber-400 mt-1">
                  {data.upcomingPaymentsCount} Due
                </h3>
                <p className="text-[11px] text-amber-300 mt-1">Renewing within 30 days</p>
              </Card>
            </div>

            {/* Explainable Subscription Insight Banner */}
            <Card
              variant="glass"
              className="bg-gradient-to-r from-purple-950/60 via-purple-900/40 to-slate-950 border-purple-800/40 p-4 text-xs text-slate-300 flex items-center gap-3"
            >
              <Sparkles className="w-5 h-5 text-purple-300 shrink-0" />
              <span className="leading-relaxed font-medium">{data.insight}</span>
            </Card>

            {/* Empty State when no subscriptions exist */}
            {!data.hasSubscriptions ? (
              <Card variant="glass" className="p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-900/30 border border-purple-800/40 flex items-center justify-center mx-auto text-purple-400">
                  <Repeat className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">No Active Subscriptions</h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    No active subscriptions detected in the database. Add your recurring subscriptions or upload bank statements to auto-detect them.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => setIsModalOpen(true)}
                  className="mx-auto"
                >
                  Add Subscription
                </Button>
              </Card>
            ) : (
              /* Subscriptions Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.subscriptions.map((sub) => (
                  <Card
                    key={sub.id}
                    variant="glass"
                    className={`space-y-4 relative ${
                      sub.isUnused ? "border-amber-500/40 bg-amber-950/10" : "border-purple-900/30"
                    }`}
                  >
                    {sub.isUnused && (
                      <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-bold uppercase tracking-wider">
                        Unused Leak
                      </span>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-800/40 flex items-center justify-center text-purple-300">
                          <Repeat className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-[var(--text-primary)] text-base">{sub.name}</h4>
                          <p className="text-[10px] text-slate-400">{sub.category}</p>
                        </div>
                      </div>
                      <span className="text-lg font-extrabold text-[var(--text-primary)]">
                        {formatCurrency(sub.amount)}
                        <span className="text-[10px] font-normal text-slate-400">/{sub.billingCycle}</span>
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-purple-900/30 text-xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Next Billing Date</span>
                        <span className="font-semibold text-slate-200">{sub.nextBilling}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Monthly Cost</span>
                        <span className="font-semibold text-purple-300">
                          {formatCurrency(sub.monthlyEquivalent)}/mo
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-purple-900/20">
                      <Badge variant={sub.isUnused ? "warning" : "primary"} className="text-[10px]">
                        {sub.isUnused ? "Unused Flag" : "Active Service"}
                      </Badge>
                      <button
                        onClick={() => handleDeleteSubscription(sub.id)}
                        className="text-rose-400 hover:text-rose-300 text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Modal Component for Adding a Subscription */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
                <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Repeat className="w-5 h-5 text-purple-400" />
                  Add New Subscription
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

              <form onSubmit={handleCreateSubscription} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[var(--text-secondary)] font-medium">Service Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Netflix, Spotify, Amazon Prime"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[var(--text-secondary)] font-medium">Amount (â‚¹) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="649"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[var(--text-secondary)] font-medium">Billing Cycle *</label>
                    <select
                      value={billingCycle}
                      onChange={(e) => setBillingCycle(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-purple-950/50 border border-purple-800/50 text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="MONTHLY">Monthly</option>
                      <option value="YEARLY">Yearly</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[var(--text-secondary)] font-medium">Next Billing Date *</label>
                    <input
                      type="date"
                      required
                      value={nextBilling}
                      onChange={(e) => setNextBilling(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-purple-950/50 border border-purple-800/50 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[var(--text-secondary)] font-medium">Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Entertainment, Software"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isUnused"
                    checked={isUnused}
                    onChange={(e) => setIsUnused(e.target.checked)}
                    className="rounded border-purple-800 bg-purple-950 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="isUnused" className="text-slate-300 text-xs">
                    Mark as unused / low usage subscription leak
                  </label>
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
                    {isSubmitting ? "Saving..." : "Save Subscription"}
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
