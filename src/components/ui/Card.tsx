import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: "glass" | "solid" | "bordered";
}

export function Card({ children, className, variant = "glass", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "p-6 transition-all duration-200",
        variant === "glass" && "glass-card",
        variant === "solid" && "bg-[#120a21] border border-purple-900/30 rounded-2xl",
        variant === "bordered" && "bg-[#0c0717] border border-purple-500/20 rounded-2xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex items-center justify-between mb-4", className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn("text-lg font-semibold text-white tracking-tight", className)}>{children}</h3>;
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-sm text-slate-400 mt-1", className)}>{children}</p>;
}
