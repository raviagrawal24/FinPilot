"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Settings, User, Landmark, Save, CheckCircle2, AlertCircle, Sun, Moon, Globe, Palette, Loader2 } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function SettingsPage() {
  const { theme, setTheme, language, setLanguage, t, user, setUser, refreshUser } = useApp();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const initProfile = async () => {
      let currentUser = user;
      if (!currentUser) {
        currentUser = await refreshUser();
      }
      if (!currentUser) {
        try {
          const res = await fetch("/api/users");
          if (res.ok) {
            const json = await res.json();
            if (json?.user) {
              currentUser = json.user;
              setUser(json.user);
            }
          }
        } catch (e) {
          console.error("Failed to load active user profile:", e);
        }
      }
      if (currentUser) {
        setName(currentUser.name || "");
        setEmail(currentUser.email || "");
      }
      setLoadingInitial(false);
    };

    initProfile();
  }, []);

  // Sync state if user in context updates externally
  useEffect(() => {
    if (user && !saving) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setSuccessMessage(null);
    setErrorMessage(null);

    // Front-end validation
    if (!name.trim()) {
      setErrorMessage(t("auth.fullName") + " is required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || t("settings.profileError"));
      }

      if (json.user) {
        // Update user state globally in AppContext immediately
        setUser(json.user);
        setName(json.user.name);
        setEmail(json.user.email);
      }

      setSuccessMessage(t("settings.profileSuccess"));
    } catch (err: any) {
      console.error("Profile save error:", err);
      setErrorMessage(err.message || t("settings.profileError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-purple-500" />
            {t("settings.title")}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            {t("settings.subtitle")}
          </p>
        </div>

        {/* Appearance Theme Preference Card */}
        <Card variant="glass" className="space-y-4">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-500" />
                {t("settings.appearance")}
              </CardTitle>
              <CardDescription>{t("settings.appearanceDesc")}</CardDescription>
            </div>
            <Badge variant="primary" className="capitalize">
              {theme === "dark" ? t("topNav.darkMode") : t("topNav.lightMode")}
            </Badge>
          </CardHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dark Theme Option */}
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                theme === "dark"
                  ? "dark:bg-purple-950/70 bg-purple-900/10 border-purple-500 ring-2 ring-purple-500/40 text-[var(--text-primary)] shadow-md"
                  : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-purple-500/40"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-xl bg-purple-900/40 text-amber-400">
                  <Moon className="w-5 h-5" />
                </div>
                {theme === "dark" && (
                  <span className="text-xs bg-purple-600 text-white font-bold px-2 py-0.5 rounded-full shadow-sm">
                    Active
                  </span>
                )}
              </div>
              <div className="mt-4 space-y-1">
                <h4 className="font-bold text-sm text-[var(--text-primary)]">{t("settings.darkTheme")}</h4>
                <p className="text-xs text-[var(--text-muted)]">{t("settings.darkThemeDesc")}</p>
              </div>
            </button>

            {/* Light Theme Option */}
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                theme === "light"
                  ? "bg-purple-50 border-purple-500 ring-2 ring-purple-500/40 text-slate-900 shadow-md"
                  : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-purple-500/40"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600">
                  <Sun className="w-5 h-5" />
                </div>
                {theme === "light" && (
                  <span className="text-xs bg-purple-600 text-white font-bold px-2 py-0.5 rounded-full shadow-sm">
                    Active
                  </span>
                )}
              </div>
              <div className="mt-4 space-y-1">
                <h4 className="font-bold text-sm text-[var(--text-primary)]">{t("settings.lightTheme")}</h4>
                <p className="text-xs text-[var(--text-muted)]">{t("settings.lightThemeDesc")}</p>
              </div>
            </button>
          </div>
        </Card>

        {/* Application Language Preference Card */}
        <Card variant="glass" className="space-y-4">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-purple-500" />
                {t("settings.language")}
              </CardTitle>
              <CardDescription>{t("settings.languageDesc")}</CardDescription>
            </div>
            <Badge variant="info">{language === "en" ? "English" : "हिन्दी (Hindi)"}</Badge>
          </CardHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* English Language Option */}
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                language === "en"
                  ? "dark:bg-purple-600/20 bg-purple-50 border-purple-500 ring-2 ring-purple-500/40 text-[var(--text-primary)] shadow-sm"
                  : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-purple-500/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌐</span>
                <div>
                  <p className="font-bold text-sm text-[var(--text-primary)]">{t("settings.english")}</p>
                  <p className="text-xs text-[var(--text-muted)]">Default System Language</p>
                </div>
              </div>
              {language === "en" && <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
            </button>

            {/* Hindi Language Option */}
            <button
              type="button"
              onClick={() => setLanguage("hi")}
              className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                language === "hi"
                  ? "dark:bg-purple-600/20 bg-purple-50 border-purple-500 ring-2 ring-purple-500/40 text-[var(--text-primary)] shadow-sm"
                  : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-purple-500/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🇮🇳</span>
                <div>
                  <p className="font-bold text-sm text-[var(--text-primary)]">{t("settings.hindi")}</p>
                  <p className="text-xs text-[var(--text-muted)]">प्राकृतिक हिंदी भाषा</p>
                </div>
              </div>
              {language === "hi" && <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
            </button>
          </div>
        </Card>

        {/* User Profile Card */}
        <Card variant="glass" className="space-y-4">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-purple-500" />
                {t("settings.userProfile")}
              </CardTitle>
              <CardDescription>
                Update your personal name and email address securely.
              </CardDescription>
            </div>
          </CardHeader>

          {/* Feedback Alerts */}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[var(--text-secondary)] font-semibold">{t("auth.fullName")}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (successMessage) setSuccessMessage(null);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  disabled={loadingInitial || saving}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition-all disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[var(--text-secondary)] font-semibold">{t("auth.email")}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (successMessage) setSuccessMessage(null);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  disabled={loadingInitial || saving}
                  placeholder="e.g. alex@finpilot.ai"
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={loadingInitial || saving}
                icon={
                  saving ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Save className="w-4 h-4 text-white" />
                  )
                }
              >
                {saving ? t("common.saving") : t("settings.saveChanges")}
              </Button>
            </div>
          </form>
        </Card>

        {/* Linked Bank Accounts */}
        <Card variant="glass" className="space-y-4">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-purple-500" />
                Linked Bank Accounts
              </CardTitle>
              <CardDescription>Connected financial institutions via Open Banking API.</CardDescription>
            </div>
          </CardHeader>

          <div className="space-y-2.5">
            {[
              { name: "HDFC Salary Account", acc: "•••• 4892", status: "Sync Active" },
              { name: "ICICI Savings Account", acc: "•••• 1029", status: "Sync Active" },
              { name: "HDFC Regalia Credit Card", acc: "•••• 8831", status: "Sync Active" },
            ].map((acc) => (
              <div
                key={acc.acc}
                className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between text-xs transition-colors hover:border-purple-500/30"
              >
                <div>
                  <p className="font-bold text-[var(--text-primary)]">{acc.name}</p>
                  <p className="text-[var(--text-muted)] text-[10px]">{acc.acc}</p>
                </div>
                <Badge variant="success">{acc.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
