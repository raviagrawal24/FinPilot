"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MOCK_GOALS } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { Target, Plus, Calendar, Sparkles, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function GoalsPage() {
  const [goals, setGoals] = useState(MOCK_GOALS);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Financial Goals</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Target planning, progress tracking, and monthly savings allocation.
            </p>
          </div>
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
            Create New Goal
          </Button>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => {
            const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            const remaining = goal.targetAmount - goal.currentAmount;
            const monthsToTarget = Math.ceil(remaining / goal.monthlyContribution);

            return (
              <Card
                key={goal.id}
                variant="glass"
                className="space-y-4 hover:border-purple-500/40 transition-all border-purple-900/30"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <Badge variant="primary">{goal.category}</Badge>
                    <h3 className="text-xl font-bold text-white tracking-tight mt-1">{goal.title}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-purple-300">{pct}%</span>
                    <p className="text-[10px] text-slate-400">Completed</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-3 rounded-full bg-purple-950/80 overflow-hidden border border-purple-900/40 p-0.5">
                    <div
                      className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-white">{formatCurrency(goal.currentAmount)}</span>
                    <span className="text-slate-400">Target: {formatCurrency(goal.targetAmount)}</span>
                  </div>
                </div>

                {/* Info Pills */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-purple-900/30 text-xs">
                  <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-900/30">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Monthly Deposit</p>
                    <p className="font-bold text-purple-300 mt-0.5">
                      {formatCurrency(goal.monthlyContribution)}/mo
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-900/30">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Projected Finish</p>
                    <p className="font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {goal.targetDate} ({monthsToTarget} mos)
                    </p>
                  </div>
                </div>

                {/* AI Projection Tip */}
                <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/30 text-[11px] text-slate-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Increasing contribution by ₹2,000 cuts timeline by 2 months!</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
