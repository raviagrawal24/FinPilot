"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { Sliders, Sparkles, RotateCcw, TrendingUp, TrendingDown, Heart, Calendar, Info } from "lucide-react";
import { useApp } from "@/context/AppContext";

interface BaselineData {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  savingsRate: number;
  totalDebt: number;
  monthlyEMI: number;
  goalCompletionMonths: number;
}

interface SimulatedData {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  savingsRate: number;
  surplusDiff: number;
  goalCompletionMonths: number;
}

interface SimulatorApiResponse {
  success: boolean;
  baseline: BaselineData;
  simulated: SimulatedData;
  impactStatus: "BETTER" | "WORSE" | "NEUTRAL";
  explainableText: string;
  savingsDiff: number;
  sixMonthCumulativeDiff: number;
  goalDelayMonths: number;
  healthScoreDelta: number;
  whyItMatters: string[];
  comparisonChart: { month: string; currentSavings: number; simulatedSavings: number }[];
}

function ImpactMetricCard({
  icon: Icon,
  label,
  value,
  sub,
  positive,
  neutral,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  positive: boolean;
  neutral?: boolean;
}) {
  const color = neutral
    ? "text-[var(--text-secondary)]"
    : positive
    ? "text-emerald-500"
    : "text-rose-400";
  const bg = neutral
    ? "bg-[var(--bg-surface)] border-[var(--border-subtle)]"
    : positive
    ? "bg-emerald-500/10 border-emerald-500/30"
    : "bg-rose-500/10 border-rose-500/30";
  return (
    <div className={`p-4 rounded-2xl border ${bg} space-y-1.5`}>
      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wider">
        <Icon className={`w-4 h-4 ${color}`} />
        {label}
      </div>
      <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
      {sub && <p className="text-[11px] text-[var(--text-muted)]">{sub}</p>}
    </div>
  );
}

export default function SimulatorPage() {
  const { t } = useApp();
  const [baseline, setBaseline] = useState<BaselineData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [incomeDelta, setIncomeDelta] = useState<number>(0);
  const [rentDelta, setRentDelta] = useState<number>(0);
  const [expenseDelta, setExpenseDelta] = useState<number>(0);
  const [emiDelta, setEmiDelta] = useState<number>(0);
  const [goalContributionDelta, setGoalContributionDelta] = useState<number>(0);

  const [simulationResult, setSimulationResult] = useState<SimulatorApiResponse | null>(null);

  const fetchBaseline = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/simulator");
      if (!res.ok) throw new Error("Failed to load simulator baseline.");
      const json = await res.json();
      setBaseline(json.baseline);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load simulator baseline.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBaseline(); }, [fetchBaseline]);

  const runSimulation = useCallback(async () => {
    try {
      const res = await fetch("/api/simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incomeDelta, rentDelta, expenseDelta, emiDelta, goalContributionDelta }),
      });
      if (!res.ok) throw new Error("Simulation failed.");
      const json = await res.json();
      setSimulationResult(json);
    } catch (err: unknown) {
      console.error("Error running simulation:", err);
    }
  }, [incomeDelta, rentDelta, expenseDelta, emiDelta, goalContributionDelta]);

  useEffect(() => { runSimulation(); }, [runSimulation]);

  const handlePreset = (type: "SALARY_10" | "RENT_5K" | "EMI_3K") => {
    handleReset();
    if (type === "SALARY_10" && baseline) setIncomeDelta(Math.round(baseline.monthlyIncome * 0.1));
    else if (type === "RENT_5K") setRentDelta(5000);
    else if (type === "EMI_3K") setEmiDelta(3000);
  };

  const handleReset = () => {
    setIncomeDelta(0); setRentDelta(0); setExpenseDelta(0);
    setEmiDelta(0); setGoalContributionDelta(0);
  };

  const sr = simulationResult;
  const savingsUp = (sr?.savingsDiff ?? 0) >= 0;
  const goalEarlier = (sr?.goalDelayMonths ?? 0) < 0;
  const healthUp = (sr?.healthScoreDelta ?? 0) >= 0;
  const noChange = incomeDelta === 0 && rentDelta === 0 && expenseDelta === 0 && emiDelta === 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
              <Sliders className="w-6 h-6 text-purple-400" />
              {t("simulator.title")}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">{t("simulator.subtitle")}</p>
          </div>
          <button
            onClick={handleReset}
            className="text-xs text-purple-400 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] px-3.5 py-2 rounded-xl border border-[var(--border-subtle)] transition-all flex items-center gap-1.5 w-fit font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5 text-purple-400" /> {t("simulator.reset")}
          </button>
        </div>

        {/* Preset Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{t("simulator.presets")}:</span>
          <button onClick={() => handlePreset("SALARY_10")} className="px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-xs font-semibold text-emerald-500 hover:text-emerald-400 transition-all shadow-sm">
            {t("simulator.preset1")}
          </button>
          <button onClick={() => handlePreset("RENT_5K")} className="px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-xs font-semibold text-amber-500 hover:text-amber-400 transition-all shadow-sm">
            {t("simulator.preset2")}
          </button>
          <button onClick={() => handlePreset("EMI_3K")} className="px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-xs font-semibold text-rose-500 hover:text-rose-400 transition-all shadow-sm">
            {t("simulator.preset3")}
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500" />
          </div>
        )}

        {!loading && error && (
          <Card variant="glass" className="p-6 text-center space-y-3">
            <p className="text-[var(--text-primary)] font-bold">Failed to load simulator</p>
            <p className="text-sm text-[var(--text-secondary)]">Something went wrong. Please refresh the page.</p>
          </Card>
        )}

        {!loading && baseline && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT: Controls */}
            <Card variant="glass" className="lg:col-span-1 space-y-5 border-[var(--border-subtle)]">
              <CardHeader>
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-purple-400" /> Scenario Controls
                  </CardTitle>
                  <CardDescription>Baseline values pulled from your real financial data.</CardDescription>
                </div>
              </CardHeader>

              <div className="space-y-4 text-xs">
                {/* Income */}
                <div className="space-y-2 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  <div className="flex justify-between font-semibold text-[var(--text-secondary)]">
                    <span>{t("simulator.incomeDelta")}</span>
                    <span className={incomeDelta >= 0 ? "text-emerald-500 font-bold" : "text-rose-500 font-bold"}>
                      {incomeDelta >= 0 ? `+₹${incomeDelta.toLocaleString("en-IN")}` : `-₹${Math.abs(incomeDelta).toLocaleString("en-IN")}`}
                    </span>
                  </div>
                  <input type="range" min={-20000} max={30000} step={1000} value={incomeDelta}
                    onChange={(e) => setIncomeDelta(Number(e.target.value))} className="w-full accent-purple-500 cursor-pointer" />
                  <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                    <span>-₹20k</span>
                    <span>Baseline (₹{baseline.monthlyIncome.toLocaleString("en-IN")})</span>
                    <span>+₹30k</span>
                  </div>
                </div>

                {/* Rent */}
                <div className="space-y-2 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  <div className="flex justify-between font-semibold text-[var(--text-secondary)]">
                    <span>{t("simulator.rentDelta")}</span>
                    <span className={rentDelta > 0 ? "text-amber-500 font-bold" : "text-emerald-500 font-bold"}>
                      {rentDelta >= 0 ? `+₹${rentDelta.toLocaleString("en-IN")}` : `-₹${Math.abs(rentDelta).toLocaleString("en-IN")}`}
                    </span>
                  </div>
                  <input type="range" min={-10000} max={20000} step={1000} value={rentDelta}
                    onChange={(e) => setRentDelta(Number(e.target.value))} className="w-full accent-amber-500 cursor-pointer" />
                </div>

                {/* Expenses */}
                <div className="space-y-2 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  <div className="flex justify-between font-semibold text-[var(--text-secondary)]">
                    <span>{t("simulator.expenseDelta")}</span>
                    <span className={expenseDelta > 0 ? "text-amber-500 font-bold" : "text-emerald-500 font-bold"}>
                      {expenseDelta >= 0 ? `+₹${expenseDelta.toLocaleString("en-IN")}` : `-₹${Math.abs(expenseDelta).toLocaleString("en-IN")}`}
                    </span>
                  </div>
                  <input type="range" min={-10000} max={25000} step={1000} value={expenseDelta}
                    onChange={(e) => setExpenseDelta(Number(e.target.value))} className="w-full accent-purple-500 cursor-pointer" />
                </div>

                {/* EMI */}
                <div className="space-y-2 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  <div className="flex justify-between font-semibold text-[var(--text-secondary)]">
                    <span>{t("simulator.emiDelta")}</span>
                    <span className={emiDelta > 0 ? "text-rose-500 font-bold" : "text-emerald-500 font-bold"}>
                      {emiDelta >= 0 ? `+₹${emiDelta.toLocaleString("en-IN")}` : `-₹${Math.abs(emiDelta).toLocaleString("en-IN")}`}
                    </span>
                  </div>
                  <input type="range" min={-5000} max={20000} step={1000} value={emiDelta}
                    onChange={(e) => setEmiDelta(Number(e.target.value))} className="w-full accent-rose-500 cursor-pointer" />
                </div>
              </div>
            </Card>

            {/* RIGHT: Results */}
            <div className="lg:col-span-2 space-y-6">
              {simulationResult && (
                <>
                  {/* Status header + summary text */}
                  <Card variant="glass" className="space-y-4 border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <h3 className="text-base font-bold text-[var(--text-primary)]">{t("simulator.simulatedHeader")}</h3>
                      </div>
                      <Badge variant={simulationResult.impactStatus === "BETTER" ? "success" : simulationResult.impactStatus === "WORSE" ? "danger" : "neutral"}>
                        {simulationResult.impactStatus === "BETTER" ? t("simulator.better") : simulationResult.impactStatus === "WORSE" ? t("simulator.worse") : t("simulator.neutral")}
                      </Badge>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] leading-relaxed">
                      {simulationResult.explainableText}
                    </div>

                    {/* Current vs Simulated savings */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2">
                        <Badge variant="neutral">{t("simulator.baselineHeader")}</Badge>
                        <div className="space-y-1 pt-2">
                          <p className="text-xs text-[var(--text-secondary)]">{t("dashboard.monthlySavings")}</p>
                          <p className="text-2xl font-extrabold text-[var(--text-primary)]">
                            {formatCurrency(simulationResult.baseline.monthlySavings)}
                          </p>
                          <p className="text-[11px] text-purple-400 font-semibold">
                            {t("dashboard.savingsRate")}: {simulationResult.baseline.savingsRate}%
                          </p>
                        </div>
                        <div className="pt-2 border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
                          <span>Goal Completion: </span>
                          <span className="font-bold text-emerald-500">{simulationResult.baseline.goalCompletionMonths} months</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-purple-500/40 space-y-2 shadow-lg">
                        <Badge variant={simulationResult.simulated.surplusDiff >= 0 ? "success" : "warning"}>
                          {t("simulator.simulatedHeader")}
                        </Badge>
                        <div className="space-y-1 pt-2">
                          <p className="text-xs text-[var(--text-secondary)]">Simulated {t("dashboard.monthlySavings")}</p>
                          <p className={`text-2xl font-extrabold ${simulationResult.simulated.surplusDiff >= 0 ? "text-emerald-500" : "text-amber-500"}`}>
                            {formatCurrency(simulationResult.simulated.monthlySavings)}
                          </p>
                          <p className="text-[11px] text-purple-400 font-semibold">
                            {t("dashboard.savingsRate")}: {simulationResult.simulated.savingsRate}%
                          </p>
                        </div>
                        <div className="pt-2 border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
                          <span>Goal Completion: </span>
                          <span className="font-bold text-amber-500">{simulationResult.simulated.goalCompletionMonths} months</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Impact Breakdown — 4 metric cards */}
                  {!noChange && (
                    <Card variant="glass" className="space-y-4 border-[var(--border-subtle)]">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-purple-400" /> Impact Breakdown
                        </CardTitle>
                        <CardDescription>Real-time financial impact of your scenario changes.</CardDescription>
                      </CardHeader>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <ImpactMetricCard
                          icon={savingsUp ? TrendingUp : TrendingDown}
                          label="Monthly Savings"
                          value={`${savingsUp ? "+" : ""}${formatCurrency(simulationResult.savingsDiff)}`}
                          sub={`${formatCurrency(simulationResult.simulated.monthlySavings)}/mo`}
                          positive={savingsUp}
                        />
                        <ImpactMetricCard
                          icon={savingsUp ? TrendingUp : TrendingDown}
                          label="6-Month Cumulative"
                          value={`${simulationResult.sixMonthCumulativeDiff >= 0 ? "+" : ""}${formatCurrency(simulationResult.sixMonthCumulativeDiff)}`}
                          sub="projected compound impact"
                          positive={simulationResult.sixMonthCumulativeDiff >= 0}
                        />
                        <ImpactMetricCard
                          icon={Calendar}
                          label="Goal Timeline"
                          value={simulationResult.goalDelayMonths === 0 ? "No change" : `${Math.abs(simulationResult.goalDelayMonths)} mo ${goalEarlier ? "earlier" : "delayed"}`}
                          sub={goalEarlier ? "faster completion" : simulationResult.goalDelayMonths > 0 ? "slower completion" : "on track"}
                          positive={goalEarlier}
                          neutral={simulationResult.goalDelayMonths === 0}
                        />
                        <ImpactMetricCard
                          icon={Heart}
                          label="Health Score"
                          value={`${healthUp ? "+" : ""}${simulationResult.healthScoreDelta} pts`}
                          sub={healthUp ? "improving trajectory" : "declining trajectory"}
                          positive={healthUp}
                          neutral={simulationResult.healthScoreDelta === 0}
                        />
                      </div>

                      {/* Why This Matters */}
                      {simulationResult.whyItMatters && simulationResult.whyItMatters.length > 0 && (
                        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-2">
                          <h4 className="text-xs font-bold text-purple-400 flex items-center gap-1.5 uppercase tracking-wider">
                            <Info className="w-3.5 h-3.5" /> Why This Matters
                          </h4>
                          <ul className="space-y-1.5">
                            {simulationResult.whyItMatters.map((bullet, i) => (
                              <li key={i} className="text-xs text-[var(--text-secondary)] flex items-start gap-2 leading-relaxed">
                                <span className="text-purple-400 mt-0.5 shrink-0">•</span>
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Card>
                  )}

                  {/* 6-Month Chart */}
                  <Card variant="glass" className="space-y-4 border-[var(--border-subtle)]">
                    <CardHeader>
                      <div>
                        <CardTitle className="text-base">Cumulative Savings Comparison</CardTitle>
                        <CardDescription>6-month projected growth: Current vs. Simulated.</CardDescription>
                      </div>
                    </CardHeader>
                    <div className="h-64 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={simulationResult.comparisonChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.15)" vertical={false} />
                          <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="glass-panel p-3 rounded-xl border border-[var(--border-subtle)] text-xs space-y-1 bg-[var(--bg-surface)]">
                                    <p className="font-bold text-[var(--text-primary)]">{label}</p>
                                    <p className="text-[var(--text-secondary)]">Current: <span className="font-semibold text-[var(--text-primary)]">{formatCurrency(payload[0]?.value as number)}</span></p>
                                    <p className="text-purple-500">Simulated: <span className="font-semibold text-emerald-500">{formatCurrency(payload[1]?.value as number)}</span></p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                          <Bar dataKey="currentSavings" name="Current Savings" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={18} />
                          <Bar dataKey="simulatedSavings" name="Simulated Savings" fill="#10b981" radius={[4, 4, 0, 0]} barSize={18} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
