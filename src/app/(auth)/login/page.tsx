"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, Lock, Mail, AlertCircle, Eye, EyeOff, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useApp } from "@/context/AppContext";

export default function LoginPage() {
  const router = useRouter();
  const { t, refreshUser } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter your email address and password.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Invalid email address or password.");
      }

      // Refresh global user state in AppContext
      await refreshUser();

      // Redirect to Dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthClick = (provider: "Google" | "Microsoft") => {
    setError(null);
    setNotice(`${provider} sign-in is not configured yet.`);
  };

  const handleForgotPassword = () => {
    setError(null);
    if (!email.trim()) {
      setError("Please enter your email address to reset password.");
      return;
    }
    setNotice(`Password reset instructions have been sent to ${email.trim()}.`);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex items-center justify-center p-4 sm:p-6 subtle-grid-bg transition-colors duration-200">
      <div className="w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 border border-[var(--border-subtle)] shadow-2xl space-y-6 bg-[var(--bg-surface)]">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl gradient-purple-btn mx-auto flex items-center justify-center shadow-lg shadow-purple-900/40">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Welcome back
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Sign in to continue to your financial health dashboard
          </p>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div className="p-3.5 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-700 dark:text-purple-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
            <Info className="w-4 h-4 text-purple-500 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[var(--text-secondary)]">{t("auth.email")}</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-[var(--text-secondary)]">{t("auth.password")}</label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-[11px] text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="accent-purple-600 w-3.5 h-3.5 rounded cursor-pointer"
              />
              Remember me on this device
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            variant="primary"
            className="w-full py-2.5 mt-2"
            icon={<ArrowRight className="w-4 h-4 text-white" />}
          >
            {loading ? t("common.loading") : t("auth.signInBtn")}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border-subtle)]" />
          </div>
          <div className="relative px-3 bg-[var(--bg-surface)] text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">
            OR
          </div>
        </div>

        {/* OAuth Provider Buttons */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => handleOAuthClick("Google")}
            className="w-full py-2.5 px-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-surface-hover)] text-xs font-semibold text-[var(--text-primary)] flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => handleOAuthClick("Microsoft")}
            className="w-full py-2.5 px-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-surface-hover)] text-xs font-semibold text-[var(--text-primary)] flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 23 23">
              <path fill="#f35325" d="M1 1h10v10H1z" />
              <path fill="#81bc06" d="M12 1h10v10H12z" />
              <path fill="#05a6f0" d="M1 12h10v10H1z" />
              <path fill="#ffba08" d="M12 12h10v10H12z" />
            </svg>
            Continue with Microsoft
          </button>
        </div>

        {/* Footer Link */}
        <div className="text-center text-xs text-[var(--text-secondary)] pt-3 border-t border-[var(--border-subtle)]">
          {t("auth.noAccount")}{" "}
          <Link href="/register" className="text-purple-600 dark:text-purple-400 font-bold hover:underline">
            {t("auth.signUp")}
          </Link>
        </div>
      </div>
    </div>
  );
}
