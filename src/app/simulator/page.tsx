"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { Sliders, Sparkles, ArrowRight, TrendingDown, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";

export default function SimulatorPage() {
  const [scenarioType, setScenarioType] = useState("RENT_INCREASE");
  const [rentIncrease, setRentIncrease] = useState(5000);
  const [salaryChange, setSalaryChange] = useState(10000);
  const [newEmi, setNewEmi] = useState(8500);

  // Base metrics
  const baseIncome = 85000;
  const baseExpenses = 54200;
  const baseSurplus = 30800;
  const baseGoalMonths = 9;

  // Dynamic simulation calculations
  let projectedIncome = baseIncome;
  let projectedExpenses = baseExpenses;

  if (scenarioType === "RENT_INCREASE") {
    projectedExpenses += rentIncrease;
  } else if (scenarioType === "SALARY_CHANGE") {
    projectedIncome += salaryChange;
  } else if (scenarioType === "NEW_EMI" || scenarioType === "BUY_CAR") {
    projectedExpenses += newEmi;
  }

  const projectedSurplus = projectedIncome - projectedExpenses;
  const surplusDiff = projectedSurplus - baseSurplus;

  // Projected Goal Completion Delay Impact
  const targetGoalAmount = 150000 - 72000; // Remaining Emergency fund = 78,000
  const projectedGoalMonths = Math.max(1, Math.ceil(targetGoalAmount / (projectedSurplus * 0.35)));

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-purple-400" />
            What-If Scenario Simulator
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Model hypothetical financial events and simulate their effect on monthly surplus and goal completion.
          </p>
        </div>

        {/* Scenario Selection Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { id: "RENT_INCREASE", label: "Rent Increase" },
            { id: "SALARY_CHANGE", label: "Salary Change" },
            { id: "NEW_EMI", label: "New EMI" },
            { id: "BUY_CAR", label: "Buy a Car" },
            { id: "JOB_CHANGE", label: "Job Change" },
            { id: "INCREASE_INVESTMENT", label: "Increase SIP" },
          ].map((sc) => (
            <button
              key={sc.id}
              onClick={() => setScenarioType(sc.id)}
              className={`p-3 rounded-xl text-xs font-bold transition-all border text-center ${
                scenarioType === sc.id
                  ? "bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-900/40 scale-105"
                  : "bg-purple-950/30 border-purple-900/40 text-slate-300 hover:text-white hover:bg-purple-900/40"
              }`}
            >
              {sc.label}
            </button>
          ))}
        </div>

        {/* Simulator Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scenario Input Config Card */}
          <Card variant="glass" className="lg:col-span-1 space-y-4">
            <CardHeader>
              <div>
                <CardTitle className="text-base">Scenario Parameters</CardTitle>
                <CardDescription>Adjust financial variables to run calculation.</CardDescription>
              </div>
            </CardHeader>

            {scenarioType === "RENT_INCREASE" && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-300 block">
                  Monthly Rent Increase Amount: <span className="text-purple-300 font-bold">{formatCurrency(rentIncrease)}</span>
                </label>
                <input
                  type="range"
                  min={1000}
                  max={20000}
                  step={1000}
                  value={rentIncrease}
                  onChange={(e) => setRentIncrease(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
                <p className="text-[11px] text-slate-400">Simulates landlord rent hike starting next month.</p>
              </div>
            )}

            {scenarioType === "SALARY_CHANGE" && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-300 block">
                  Salary Increment / Hike: <span className="text-emerald-400 font-bold">{formatCurrency(salaryChange)}</span>
                </label>
                <input
                  type="range"
                  min={-15000}
                  max={40000}
                  step={2500}
                  value={salaryChange}
                  onChange={(e) => setSalaryChange(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            )}

            {(scenarioType === "NEW_EMI" || scenarioType === "BUY_CAR") && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-300 block">
                  New Monthly EMI Obligation: <span className="text-rose-400 font-bold">{formatCurrency(newEmi)}</span>
                </label>
                <input
                  type="range"
                  min={2000}
                  max={30000}
                  step={1000}
                  value={newEmi}
                  onChange={(e) => setNewEmi(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>
            )}
          </Card>

          {/* Before vs After Impact Analysis */}
          <Card variant="glass" className="lg:col-span-2 space-y-6">
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Simulated Impact Analysis
                </CardTitle>
                <CardDescription>Comparing your current financial state against the projected scenario.</CardDescription>
              </div>
            </CardHeader>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Before Card */}
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-900/30 space-y-2">
                <Badge variant="neutral">BEFORE SCENARIO</Badge>
                <div className="space-y-1 pt-2">
                  <p className="text-xs text-slate-400">Monthly Surplus</p>
                  <p className="text-xl font-extrabold text-white">{formatCurrency(baseSurplus)}</p>
                </div>
                <div className="pt-2 border-t border-purple-900/30 text-xs text-slate-300">
                  <span>Emergency Fund Completion: </span>
                  <span className="font-bold text-emerald-400">{baseGoalMonths} months</span>
                </div>
              </div>

              {/* After Card */}
              <div className="p-4 rounded-xl bg-purple-950/60 border border-purple-500/40 space-y-2">
                <Badge variant="primary">AFTER SCENARIO</Badge>
                <div className="space-y-1 pt-2">
                  <p className="text-xs text-slate-400">Projected Monthly Surplus</p>
                  <p className={`text-xl font-extrabold ${surplusDiff >= 0 ? "text-emerald-400" : "text-amber-400"}`}>
                    {formatCurrency(projectedSurplus)}
                  </p>
                </div>
                <div className="pt-2 border-t border-purple-900/30 text-xs text-slate-300">
                  <span>Emergency Fund Completion: </span>
                  <span className="font-bold text-amber-300">{projectedGoalMonths} months</span>
                </div>
              </div>
            </div>

            {/* Summary Conclusion Box */}
            <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs space-y-2">
              <h4 className="font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-purple-400" /> FinPilot Simulation Summary
              </h4>
              <p className="text-slate-300 leading-relaxed">
                If <span className="text-white font-semibold">{scenarioType.replace("_", " ")}</span> occurs, your monthly surplus changes by{" "}
                <span className={`font-bold ${surplusDiff >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {formatCurrency(surplusDiff)}
                </span>
                . Goal timeline extends from <span className="font-bold text-white">{baseGoalMonths} months → {projectedGoalMonths} months</span>.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
