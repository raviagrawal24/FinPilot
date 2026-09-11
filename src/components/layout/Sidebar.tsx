"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  TrendingUp,
  Target,
  Landmark,
  Repeat,
  BellRing,
  Sparkles,
  Sliders,
  Settings,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, user, refreshUser } = useApp();

  useEffect(() => {
    if (!user) {
      refreshUser();
    }
  }, [user, refreshUser]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const navItems = [
    { name: t("nav.dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { name: t("nav.transactions"), href: "/transactions", icon: Receipt },
    { name: t("nav.expenses"), href: "/expenses", icon: PieChart },
    { name: t("nav.cashflow"), href: "/cashflow", icon: TrendingUp },
    { name: t("nav.goals"), href: "/goals", icon: Target },
    { name: t("nav.liabilities"), href: "/liabilities", icon: Landmark },
    { name: t("nav.subscriptions"), href: "/subscriptions", icon: Repeat },
    { name: t("nav.alerts"), href: "/alerts", icon: BellRing },
    { name: t("nav.assistant"), href: "/assistant", icon: Sparkles, highlight: true },
    { name: t("nav.simulator"), href: "/simulator", icon: Sliders },
  ];

  const displayName = user?.name || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 bg-[var(--bg-surface)] backdrop-blur-xl border-r border-[var(--border-subtle)] flex flex-col justify-between transition-all duration-300 md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Top Header / Logo */}
        <div className="p-5 border-b border-[var(--border-subtle)]">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl gradient-purple-btn flex items-center justify-center shadow-lg shadow-purple-900/40 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-wider text-[var(--text-primary)]">FINPILOT</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-purple-600/30 text-purple-400 font-semibold border border-purple-500/40">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] font-medium tracking-wide">FINANCIAL HEALTH ENGINE</p>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
            Core Modules
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group relative",
                  isActive
                    ? "dark:bg-purple-600/20 dark:text-purple-400 dark:border-purple-500/40 bg-purple-100/90 text-purple-700 border border-purple-200 shadow-sm font-semibold"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border border-transparent"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors",
                      isActive ? "dark:text-purple-400 text-purple-600" : "text-[var(--text-muted)] group-hover:text-purple-500"
                    )}
                  />
                  <span>{item.name}</span>
                </div>
                {item.highlight && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-[var(--border-subtle)] space-y-1">
          <Link
            href="/settings"
            onClick={onCloseMobile}
            className={cn(
              "flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors border",
              pathname === "/settings"
                ? "dark:bg-purple-600/20 dark:text-purple-400 dark:border-purple-500/40 bg-purple-100/90 text-purple-700 border-purple-200 font-semibold"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
            )}
          >
            <Settings className="w-4 h-4 text-purple-500" />
            <span>{t("nav.settings")}</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-500/10 transition-colors text-left"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>{t("nav.signOut")}</span>
          </button>

          {/* User Preview Box */}
          <div className="mt-2 p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 p-0.5 shadow-sm">
                <div className="w-full h-full rounded-full dark:bg-purple-950 bg-purple-600 flex items-center justify-center font-bold text-xs text-white">
                  {initials}
                </div>
              </div>
              <div className="text-xs">
                <p className="font-semibold text-[var(--text-primary)] truncate max-w-[110px]">{displayName}</p>
                <p className="text-[10px] text-purple-500 font-semibold">Session Active</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

