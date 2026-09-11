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
    primary: "gradient-purple-btn text-white font-medium",
    secondary: "bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 border border-purple-500/30",
    outline: "bg-transparent border border-purple-500/30 text-purple-200 hover:bg-purple-950/40",
    ghost: "bg-transparent text-slate-300 hover:text-white hover:bg-purple-950/30",
    danger: "bg-rose-900/80 hover:bg-rose-800 text-rose-100 border border-rose-500/40",
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
