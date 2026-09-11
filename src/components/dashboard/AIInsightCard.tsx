"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Sparkles, Utensils, Tv, ShieldCheck, ArrowRight } from "lucide-react";
import { AIInsightItem } from "@/types";
import Link from "next/link";

interface AIInsightCardProps {
  insight: AIInsightItem;
}

export function AIInsightCard({ insight }: AIInsightCardProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Utensils":
        return <Utensils className="w-4 h-4 text-amber-400" />;
      case "Tv":
        return <Tv className="w-4 h-4 text-purple-400" />;
      case "ShieldCheck":
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-purple-400" />;
    }
  };

  const getBadgeVariant = (cat: AIInsightItem["category"]) => {
    switch (cat) {
      case "warning":
        return "warning";
      case "tip":
        return "info";
      case "opportunity":
        return "success";
      default:
        return "primary";
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-[#160b2d] to-[#0f071f] border-purple-500/25 hover:border-purple-400/40 transition-all flex flex-col justify-between">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-800/40 flex items-center justify-center">
              {getIcon(insight.icon)}
            </div>
            <h4 className="text-sm font-semibold text-white truncate">{insight.title}</h4>
          </div>
          <Badge variant={getBadgeVariant(insight.category)}>{insight.impact}</Badge>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed pl-1 border-l-2 border-purple-500/40">
          {insight.description}
        </p>
      </div>

      <div className="mt-3 pt-2 border-t border-purple-900/30 flex items-center justify-between">
        <span className="text-[10px] text-purple-300 font-semibold flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-purple-400" /> FinPilot Recommendation
        </span>
        <Link
          href="/assistant"
          className="text-xs text-purple-300 hover:text-white flex items-center gap-1 font-medium group"
        >
          Discuss with AI <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </Card>
  );
}
