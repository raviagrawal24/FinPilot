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
        variant === "solid" && "bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-sm",
        variant === "bordered" && "bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded-2xl",
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
  return <h3 className={cn("text-lg font-semibold text-[var(--text-primary)] tracking-tight", className)}>{children}</h3>;
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-sm text-[var(--text-secondary)] mt-1", className)}>{children}</p>;
}
