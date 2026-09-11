"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  HelpCircle,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Transactions", href: "/transactions", icon: Receipt },
    { name: "Expenses", href: "/expenses", icon: PieChart },
    { name: "Cash Flow", href: "/cashflow", icon: TrendingUp },
    { name: "Goals", href: "/goals", icon: Target },
    { name: "Liabilities", href: "/liabilities", icon: Landmark },
    { name: "Subscriptions", href: "/subscriptions", icon: Repeat },
    { name: "Alerts", href: "/alerts", icon: BellRing, badge: "3" },
    { name: "AI Assistant", href: "/assistant", icon: Sparkles, highlight: true },
    { name: "What-If Simulator", href: "/simulator", icon: Sliders },
  ];

  const bottomItems = [
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Help & Support", href: "#help", icon: HelpCircle },
  ];

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
          "fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0d071a]/90 backdrop-blur-xl border-r border-purple-900/30 flex flex-col justify-between transition-transform duration-300 md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Top Header / Logo */}
        <div className="p-5 border-b border-purple-900/20">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl gradient-purple-btn flex items-center justify-center shadow-lg shadow-purple-900/40 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-wider text-white">FINPILOT</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 font-semibold border border-purple-500/40">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">FINANCIAL HEALTH ENGINE</p>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
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
                    ? "bg-purple-600/20 text-purple-200 border border-purple-500/40 shadow-sm shadow-purple-900/50"
                    : "text-slate-400 hover:text-white hover:bg-purple-950/40 border border-transparent"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors",
                      isActive ? "text-purple-400" : "text-slate-400 group-hover:text-purple-300"
                    )}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-purple-900 text-purple-200 border border-purple-500/40">
                    {item.badge}
                  </span>
                )}
                {item.highlight && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-purple-900/20 space-y-1">
          {bottomItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-purple-900/40 text-white"
                    : "text-slate-400 hover:text-white hover:bg-purple-950/30"
                )}
              >
                <Icon className="w-4 h-4 text-slate-400" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {/* User Preview Box */}
          <div className="mt-3 p-2.5 rounded-xl bg-purple-950/30 border border-purple-900/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-purple-800 flex items-center justify-center font-bold text-xs text-white border border-purple-500/40">
                AM
              </div>
              <div className="text-xs">
                <p className="font-semibold text-white truncate max-w-[110px]">Alex Morgan</p>
                <p className="text-[10px] text-slate-400">PRO Account</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </aside>
    </>
  );
}
