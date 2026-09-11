"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, TrendingUp, Sparkles } from "lucide-react";

interface HealthScoreGaugeProps {
  score: number;
}

export function HealthScoreGauge({ score = 78 }: HealthScoreGaugeProps) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Card className="flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden bg-gradient-to-br from-[#150a29] to-[#0f071d] border-purple-500/30">
      {/* Background Decorative Glow */}
      <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />

      {/* Circular Gauge Ring */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="rgba(139, 92, 246, 0.15)"
            strokeWidth="10"
            fill="transparent"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="url(#purpleGradient)"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c4b5fd" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#6d28d9" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold text-white tracking-tight">{score}</span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-purple-300">/ 100</span>
        </div>
      </div>

      {/* Info & Breakdown */}
      <div className="space-y-3 flex-1 text-center sm:text-left">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <Badge variant="primary" className="text-xs py-1 px-3">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
            Good Financial Health
          </Badge>
          <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +4 pts this month
          </span>
        </div>

        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Financial Health Score</h3>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
            Your score is calculated across savings rate (36%), debt ratio (24%), and emergency runway (4.2 mos).
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-purple-900/30 text-center">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Savings</p>
            <p className="text-xs font-bold text-emerald-400 mt-0.5">36.3% (Strong)</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Debt Buffer</p>
            <p className="text-xs font-bold text-amber-400 mt-0.5">Moderate</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Goal Pace</p>
            <p className="text-xs font-bold text-purple-300 mt-0.5">On Track</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
