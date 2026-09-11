import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "success" | "warning" | "danger" | "info" | "neutral";
  className?: string;
}

export function Badge({ children, variant = "primary", className }: BadgeProps) {
  const variantStyles = {
    primary: "bg-purple-950/80 text-purple-300 border-purple-500/30",
    success: "bg-emerald-950/80 text-emerald-300 border-emerald-500/30",
    warning: "bg-amber-950/80 text-amber-300 border-amber-500/30",
    danger: "bg-rose-950/80 text-rose-300 border-rose-500/30",
    info: "bg-sky-950/80 text-sky-300 border-sky-500/30",
    neutral: "bg-slate-900/80 text-slate-300 border-slate-700/50",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border backdrop-blur-md",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
