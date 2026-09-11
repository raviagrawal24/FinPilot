"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { TrendingUp, TrendingDown, CreditCard, PiggyBank, Landmark, ArrowUpRight } from "lucide-react";
import { KPIMetric } from "@/types";

interface KPICardProps {
  metric: KPIMetric;
}

export function KPICard({ metric }: KPICardProps) {
  const getIcon = (name: string) => {
    switch (name) {
      case "TrendingUp":
        return <TrendingUp className="w-5 h-5 text-emerald-400" />;
      case "CreditCard":
        return <CreditCard className="w-5 h-5 text-purple-400" />;
      case "PiggyBank":
        return <PiggyBank className="w-5 h-5 text-sky-400" />;
      case "Landmark":
        return <Landmark className="w-5 h-5 text-rose-400" />;
      default:
        return <ArrowUpRight className="w-5 h-5 text-purple-400" />;
    }
  };

  const isPositive = (metric.changePercent || 0) >= 0;

  return (
    <Card variant="glass" className="relative group hover:translate-y-[-2px] transition-all">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{metric.title}</p>
          <h3 className="text-2xl font-extrabold text-white tracking-tight">{metric.formattedValue}</h3>
        </div>
        <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center group-hover:scale-110 transition-transform">
          {getIcon(metric.iconName)}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-purple-900/20 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          {isPositive ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +{metric.changePercent}%
            </span>
          ) : (
            <span className="text-rose-400 font-semibold flex items-center gap-0.5">
              <TrendingDown className="w-3.5 h-3.5" /> {metric.changePercent}%
            </span>
          )}
          <span className="text-slate-400 text-[11px]">vs last month</span>
        </div>
        {metric.subtitle && <span className="text-[11px] text-slate-400 truncate max-w-[120px]">{metric.subtitle}</span>}
      </div>
    </Card>
  );
}
