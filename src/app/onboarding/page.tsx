"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Wallet, Target, Landmark } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [income, setIncome] = useState("85000");
  const [goal, setGoal] = useState("Emergency Fund");

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setStep(4);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#06040a] text-slate-100 flex items-center justify-center p-4 subtle-grid-bg">
      <div className="w-full max-w-xl glass-panel rounded-2xl p-8 border border-purple-500/30 shadow-2xl space-y-6">
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between pb-4 border-b border-purple-900/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl gradient-purple-btn flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white tracking-wide">FinPilot Setup</span>
          </div>
          <span className="text-xs text-purple-300 font-semibold bg-purple-950/60 px-3 py-1 rounded-full border border-purple-800/40">
            Step {step} of 3
          </span>
        </div>

        {/* Step 1: Income */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-purple-400" />
                What is your estimated monthly net income?
              </h2>
              <p className="text-xs text-slate-400 mt-1">Include salary, freelance, or recurring business earnings.</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Monthly Net Income (₹ INR)</label>
              <input
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="w-full px-4 py-3 bg-purple-950/40 border border-purple-900/40 rounded-xl text-lg font-bold text-white focus:outline-none focus:border-purple-500/60"
              />
            </div>
          </div>
        )}

        {/* Step 2: Liabilities */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Landmark className="w-5 h-5 text-purple-400" />
                Select active loan or liability types
              </h2>
              <p className="text-xs text-slate-400 mt-1">FinPilot AI optimizes debt payoff priority for high APR balances.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {["Home Loan", "Credit Card Debt", "Personal Loan", "Car / Auto Loan"].map((item) => (
                <div
                  key={item}
                  className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs font-semibold text-white flex items-center gap-2 cursor-pointer hover:border-purple-500/60"
                >
                  <CheckCircle2 className="w-4 h-4 text-purple-400" /> {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Goal */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                Choose your primary financial focus
              </h2>
              <p className="text-xs text-slate-400 mt-1">We will tailor your AI Insights dashboard to this priority.</p>
            </div>
            <div className="space-y-2">
              {["Emergency Safety Cushion", "Pay Off Credit Card Debt", "Save for Major Purchase", "Retirement Investment"].map((g) => (
                <button
                  key={g}
                  onClick={() => setGoal(g)}
                  className={`w-full p-3.5 rounded-xl text-xs font-bold text-left transition-all border ${
                    goal === g
                      ? "bg-purple-600 border-purple-400 text-white"
                      : "bg-purple-950/30 border-purple-900/40 text-slate-300 hover:text-white"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Diagnostic Calculation Animation */}
        {step === 4 && (
          <div className="py-8 text-center space-y-4">
            <Sparkles className="w-12 h-12 text-purple-400 mx-auto animate-spin" />
            <h2 className="text-xl font-extrabold text-white">Generating AI Financial Diagnosis...</h2>
            <p className="text-xs text-purple-300">
              Calculating initial Health Score (78/100) and building customized recommendations.
            </p>
          </div>
        )}

        {/* Actions */}
        {step < 4 && (
          <div className="flex items-center justify-between pt-4 border-t border-purple-900/30">
            {step > 1 ? (
              <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} icon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
            ) : <div />}
            <Button variant="primary" size="sm" onClick={handleNext} icon={<ArrowRight className="w-4 h-4" />}>
              {step === 3 ? "Complete Diagnosis" : "Continue"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
