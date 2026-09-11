import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "success" | "warning" | "danger" | "info" | "neutral";
  className?: string;
}

export function Badge({ children, variant = "primary", className }: BadgeProps) {
  const variantStyles = {
    primary: "dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-500/30 bg-purple-100 text-purple-700 border-purple-300",
    success: "dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-500/30 bg-emerald-100 text-emerald-700 border-emerald-300",
    warning: "dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-500/30 bg-amber-100 text-amber-700 border-amber-300",
    danger: "dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-500/30 bg-rose-100 text-rose-700 border-rose-300",
    info: "dark:bg-sky-950/80 dark:text-sky-300 dark:border-sky-500/30 bg-sky-100 text-sky-700 border-sky-300",
    neutral: "dark:bg-slate-900/80 dark:text-slate-300 dark:border-slate-700/50 bg-slate-100 text-slate-700 border-slate-300",
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
