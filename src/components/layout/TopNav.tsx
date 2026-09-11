"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Bell, Menu, Sparkles, Plus, Upload, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MOCK_USER, MOCK_ALERTS } from "@/lib/mock-data";

interface TopNavProps {
  onToggleMobileMenu: () => void;
  onOpenUploadModal?: () => void;
}

export function TopNav({ onToggleMobileMenu, onOpenUploadModal }: TopNavProps) {
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const unreadAlerts = MOCK_ALERTS.length;

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#06040a]/80 backdrop-blur-xl border-b border-purple-900/30 px-4 md:px-8 flex items-center justify-between">
      {/* Left side: Mobile menu toggle + Search bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-purple-950/40 md:hidden"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full max-w-xs md:max-w-md hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search transactions, insights, liabilities..."
            className="w-full pl-10 pr-10 py-1.5 text-xs bg-purple-950/20 border border-purple-900/40 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-purple-900/40 text-slate-400 px-1.5 py-0.5 rounded border border-purple-800/40">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right side: Actions, Notification, User */}
      <div className="flex items-center gap-3">
        {/* Quick Statement Upload */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenUploadModal}
          icon={<Upload className="w-3.5 h-3.5 text-purple-400" />}
          className="hidden lg:inline-flex"
        >
          Upload Statement
        </Button>

        {/* AI Quick Prompt */}
        <Link href="/assistant">
          <Button
            variant="primary"
            size="sm"
            icon={<Sparkles className="w-3.5 h-3.5" />}
            className="shadow-sm shadow-purple-900/50"
          >
            Ask FinPilot
          </Button>
        </Link>

        {/* Notifications Dropdown Container */}
        <div className="relative">
          <button
            onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
            className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-purple-950/40 border border-purple-900/30 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-purple-300" />
            {unreadAlerts > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          {showAlertsDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-panel rounded-2xl p-4 shadow-2xl z-50 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-purple-900/30">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white">Active Alerts</h4>
                  <Badge variant="danger">{unreadAlerts} New</Badge>
                </div>
                <Link
                  href="/alerts"
                  onClick={() => setShowAlertsDropdown(false)}
                  className="text-xs text-purple-400 hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {MOCK_ALERTS.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-900/30 text-xs space-y-1 hover:border-purple-500/40 transition-all"
                  >
                    <div className="flex items-center justify-between font-medium text-white">
                      <span>{alert.title}</span>
                      <span className="text-[10px] text-slate-400">{alert.date}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">{alert.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <Link href="/settings" className="flex items-center gap-2.5 pl-2 border-l border-purple-900/30">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 p-0.5 shadow-md">
            <div className="w-full h-full rounded-full bg-purple-950 flex items-center justify-center text-xs font-bold text-white">
              AM
            </div>
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-medium text-white leading-tight">{MOCK_USER.name}</p>
            <p className="text-[10px] text-purple-400 font-semibold">Health Score: 78/100</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
