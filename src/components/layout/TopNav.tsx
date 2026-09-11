"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell, Menu, Sparkles, Upload, User, LogOut, Sun, Moon, Globe, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MOCK_USER, MOCK_ALERTS } from "@/lib/mock-data";
import { useApp } from "@/context/AppContext";

interface TopNavProps {
  onToggleMobileMenu: () => void;
  onOpenUploadModal?: () => void;
}

export function TopNav({ onToggleMobileMenu, onOpenUploadModal }: TopNavProps) {
  const router = useRouter();
  const { theme, toggleTheme, language, setLanguage, t, user, refreshUser } = useApp();
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

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

  const displayName = user?.name || MOCK_USER.name;
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 h-16 bg-[var(--bg-canvas)]/85 backdrop-blur-xl border-b border-[var(--border-subtle)] px-4 md:px-8 flex items-center justify-between transition-colors duration-200">
      {/* Left side: Mobile menu toggle + Search bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] md:hidden transition-colors"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full max-w-xs md:max-w-md hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
          <input
            type="text"
            placeholder={t("transactions.searchPlaceholder")}
            className="w-full pl-10 pr-10 py-1.5 text-xs bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-purple-900/30 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800/40 font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right side: Actions, Theme, Language, Notification, User */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowLangDropdown(!showLangDropdown);
              setShowAlertsDropdown(false);
              setShowUserDropdown(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] transition-colors shadow-sm"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">{language === "en" ? "English" : "हिन्दी"}</span>
            <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
          </button>

          {showLangDropdown && (
            <div className="absolute right-0 mt-2 w-36 glass-panel rounded-2xl p-1.5 shadow-2xl z-50 space-y-1 border border-[var(--border-subtle)]">
              <button
                onClick={() => {
                  setLanguage("en");
                  setShowLangDropdown(false);
                }}
                className={`w-full px-3 py-2 text-xs rounded-xl flex items-center justify-between transition-colors font-medium ${
                  language === "en"
                    ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
                }`}
              >
                <span>🌐 English</span>
                {language === "en" && <span className="text-[10px] text-purple-400">✓</span>}
              </button>
              <button
                onClick={() => {
                  setLanguage("hi");
                  setShowLangDropdown(false);
                }}
                className={`w-full px-3 py-2 text-xs rounded-xl flex items-center justify-between transition-colors font-medium ${
                  language === "hi"
                    ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
                }`}
              >
                <span>🌐 हिन्दी</span>
                {language === "hi" && <span className="text-[10px] text-purple-400">✓</span>}
              </button>
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-[var(--text-primary)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] transition-colors shadow-sm"
          title={theme === "dark" ? t("topNav.lightMode") : t("topNav.darkMode")}
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
          ) : (
            <Moon className="w-4 h-4 text-purple-600" />
          )}
        </button>

        {/* Quick Statement Upload */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenUploadModal}
          icon={<Upload className="w-3.5 h-3.5 text-purple-400" />}
          className="hidden lg:inline-flex"
        >
          {t("dashboard.uploadStatement")}
        </Button>

        {/* AI Quick Prompt */}
        <Link href="/assistant">
          <Button
            variant="primary"
            size="sm"
            icon={<Sparkles className="w-3.5 h-3.5" />}
            className="shadow-sm shadow-purple-900/50"
          >
            {t("nav.assistant")}
          </Button>
        </Link>

        {/* Notifications Dropdown Container */}
        <div className="relative">
          <button
            onClick={() => {
              setShowAlertsDropdown(!showAlertsDropdown);
              setShowUserDropdown(false);
              setShowLangDropdown(false);
            }}
            className="relative p-2 rounded-xl text-[var(--text-primary)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-purple-400" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          </button>

          {showAlertsDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-panel rounded-2xl p-4 shadow-2xl z-50 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">{t("alerts.title")}</h4>
                  <Badge variant="danger">Alerts</Badge>
                </div>
                <Link
                  href="/alerts"
                  onClick={() => setShowAlertsDropdown(false)}
                  className="text-xs text-purple-400 hover:underline font-medium"
                >
                  {t("dashboard.viewAll")}
                </Link>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {MOCK_ALERTS.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs space-y-1 hover:border-purple-500/40 transition-all"
                  >
                    <div className="flex items-center justify-between font-medium text-[var(--text-primary)]">
                      <span>{alert.title}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">{alert.date}</span>
                    </div>
                    <p className="text-[var(--text-secondary)] leading-relaxed text-[11px]">{alert.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown Container */}
        <div className="relative pl-2 border-l border-[var(--border-subtle)]">
          <button
            onClick={() => {
              setShowUserDropdown(!showUserDropdown);
              setShowAlertsDropdown(false);
              setShowLangDropdown(false);
            }}
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 p-0.5 shadow-md">
              <div className="w-full h-full rounded-full bg-purple-950 flex items-center justify-center text-xs font-bold text-white">
                {initials}
              </div>
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-medium text-[var(--text-primary)] leading-tight">{displayName}</p>
              <p className="text-[10px] text-purple-400 font-semibold">
                {t("dashboard.healthScore")}: {user?.healthScore || 78}/100
              </p>
            </div>
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-48 glass-panel rounded-2xl p-2 shadow-2xl z-50 space-y-1 border border-[var(--border-subtle)]">
              <Link
                href="/settings"
                onClick={() => setShowUserDropdown(false)}
                className="w-full px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] rounded-xl flex items-center gap-2 transition-colors font-medium"
              >
                <User className="w-4 h-4 text-purple-400" /> {t("nav.settings")}
              </Link>
              <button
                onClick={handleLogout}
                className="w-full px-3 py-2 text-xs text-rose-500 hover:bg-rose-500/10 rounded-xl flex items-center gap-2 transition-colors font-medium"
              >
                <LogOut className="w-4 h-4 text-rose-500" /> {t("nav.signOut")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
