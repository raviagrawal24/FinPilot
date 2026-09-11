import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  icon,
  className,
  ...props
}: ButtonProps) {
  const variantStyles = {
    primary: "gradient-purple-btn text-white font-medium shadow-sm",
    secondary: "dark:bg-purple-950/60 dark:hover:bg-purple-900/60 dark:text-purple-200 dark:border-purple-500/30 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 shadow-sm",
    outline: "dark:bg-transparent dark:border-purple-500/30 dark:text-purple-200 dark:hover:bg-purple-950/40 bg-white border border-purple-300 text-purple-700 hover:bg-purple-50 shadow-sm",
    ghost: "dark:bg-transparent dark:text-slate-300 dark:hover:text-white dark:hover:bg-purple-950/30 bg-transparent text-slate-700 hover:text-purple-700 hover:bg-purple-50",
    danger: "dark:bg-rose-900/80 dark:hover:bg-rose-800 dark:text-rose-100 dark:border-rose-500/40 bg-rose-600 hover:bg-rose-700 text-white border border-rose-600 shadow-sm",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
    md: "px-4 py-2 text-sm rounded-xl gap-2",
    lg: "px-6 py-3 text-base rounded-xl gap-2.5",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
