"use client";

import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MOCK_SUBSCRIPTIONS } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { Repeat, Tv, Music, Sparkles, AlertCircle, Trash2, CheckCircle2 } from "lucide-react";

export default function SubscriptionsPage() {
  const monthlyCost = MOCK_SUBSCRIPTIONS.filter((s) => s.billingCycle === "monthly").reduce(
    (acc, s) => acc + s.amount,
    0
  );
  const annualCost = monthlyCost * 12 + 1499; // Adding yearly Amazon Prime
  const potentialSavings = 129 * 12 + 1500; // YouTube + Gym duplicate flag

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Recurring Subscriptions</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Manage active recurring services, detected renewals, and unused subscription leaks.
            </p>
          </div>
          <Badge variant="warning" className="text-xs px-3 py-1.5 w-fit">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Potential Savings: {formatCurrency(potentialSavings)}/yr
          </Badge>
        </div>

        {/* Top Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card variant="glass">
            <p className="text-xs font-semibold text-slate-400 uppercase">Monthly Subscription Spend</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{formatCurrency(monthlyCost)}</h3>
            <p className="text-[11px] text-purple-400 mt-1">4 Active monthly services</p>
          </Card>

          <Card variant="glass">
            <p className="text-xs font-semibold text-slate-400 uppercase">Annualized Impact</p>
            <h3 className="text-2xl font-extrabold text-purple-300 mt-1">{formatCurrency(annualCost)}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Includes annual renewals</p>
          </Card>

          <Card variant="glass">
            <p className="text-xs font-semibold text-slate-400 uppercase">Optimization Opportunities</p>
            <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">2 Flags</h3>
            <p className="text-[11px] text-emerald-300 mt-1">1 Unused & 1 low engagement</p>
          </Card>
        </div>

        {/* Subscriptions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_SUBSCRIPTIONS.map((sub) => {
            const isFlagged = sub.status === "flagged" || sub.status === "saving_opportunity";

            return (
              <Card
                key={sub.id}
                variant="glass"
                className={`space-y-4 relative ${
                  isFlagged ? "border-amber-500/40 bg-amber-950/10" : "border-purple-900/30"
                }`}
              >
                {sub.isDetectedRecently && (
                  <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold uppercase tracking-wider">
                    Newly Detected
                  </span>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-800/40 flex items-center justify-center text-purple-300">
                      <Repeat className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">{sub.name}</h4>
                      <p className="text-[10px] text-slate-400">{sub.category}</p>
                    </div>
                  </div>
                  <span className="text-lg font-extrabold text-white">
                    {formatCurrency(sub.amount)}
                    <span className="text-[10px] font-normal text-slate-400">/{sub.billingCycle}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-purple-900/30">
                  <span className="text-slate-400">Next Billing Date</span>
                  <span className="font-semibold text-slate-200">{sub.nextBilling}</span>
                </div>

                {isFlagged && (
                  <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200 flex items-center justify-between">
                    <span>Low usage detected this month</span>
                    <Button variant="danger" size="sm" icon={<Trash2 className="w-3 h-3" />}>
                      Cancel
                    </Button>
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
