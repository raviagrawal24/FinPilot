"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AlertCircle, Calendar, CreditCard, RefreshCw, ShieldAlert, ArrowUpRight } from "lucide-react";
import { AlertItem } from "@/types";

interface AlertCardProps {
  alert: AlertItem;
  onDismiss?: (id: string) => void;
}

export function AlertCard({ alert, onDismiss }: AlertCardProps) {
  const getIcon = (type: AlertItem["type"]) => {
    switch (type) {
      case "emi_due":
        return <Calendar className="w-4 h-4 text-purple-400" />;
      case "large_transaction":
        return <CreditCard className="w-4 h-4 text-amber-400" />;
      case "overspending":
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      case "subscription_renewal":
        return <RefreshCw className="w-4 h-4 text-sky-400" />;
      case "low_cash_buffer":
        return <ShieldAlert className="w-4 h-4 text-orange-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-purple-400" />;
    }
  };

  const getPriorityBadge = (priority: AlertItem["priority"]) => {
    switch (priority) {
      case "HIGH":
        return <Badge variant="danger">High Priority</Badge>;
      case "MEDIUM":
        return <Badge variant="warning">Medium Priority</Badge>;
      case "LOW":
        return <Badge variant="info">Low Priority</Badge>;
    }
  };

  return (
    <Card className="p-4 bg-[#120a21]/90 border-purple-900/30 hover:border-purple-500/40 transition-all flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-800/40 flex items-center justify-center shrink-0 mt-0.5">
        {getIcon(alert.type)}
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-bold text-white tracking-tight">{alert.title}</h4>
          {getPriorityBadge(alert.priority)}
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">{alert.message}</p>

        <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
          <span>{alert.date}</span>
          <button
            onClick={() => onDismiss?.(alert.id)}
            className="text-purple-400 hover:text-white font-medium transition-colors"
          >
            Mark as Resolved
          </button>
        </div>
      </div>
    </Card>
  );
}
