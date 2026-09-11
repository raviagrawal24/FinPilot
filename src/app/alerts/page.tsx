"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { AlertCard } from "@/components/dashboard/AlertCard";
import { Button } from "@/components/ui/Button";
import { AlertItem } from "@/types";
import {
  BellRing,
  CheckCircle,
  ShieldAlert,
  AlertTriangle,
  Play,
  Sparkles,
  RefreshCw,
  Trash2,
  Check,
} from "lucide-react";

interface AlertsApiResponse {
  success: boolean;
  hasAlerts: boolean;
  totalAlerts: number;
  unreadCount: number;
  alerts: AlertItem[];
}

export default function AlertsPage() {
  const [data, setData] = useState<AlertsApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/alerts");
      if (!res.ok) {
        throw new Error(`Failed to load alerts: ${res.statusText}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      console.error("Error fetching alerts:", err);
      setError(err instanceof Error ? err.message : "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Run Alert Analysis Action
  const handleRunAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      setStatusMessage(null);
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analyze" }),
      });

      if (!res.ok) {
        throw new Error("Alert analysis failed.");
      }

      const json = await res.json();
      setStatusMessage(json.message || `Analysis complete â€” ${json.alertsDetected} alerts detected.`);
      fetchAlerts();
    } catch (err: unknown) {
      setStatusMessage(err instanceof Error ? err.message : "Error running analysis");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Load Demo Alert Scenario Action
  const handleLoadDemoScenario = async () => {
    try {
      setIsAnalyzing(true);
      setStatusMessage(null);
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "load_demo" }),
      });

      if (!res.ok) {
        throw new Error("Failed to load demo scenario.");
      }

      const json = await res.json();
      setStatusMessage(json.message || "Demo Alert Scenario Loaded successfully!");
      fetchAlerts();
    } catch (err: unknown) {
      setStatusMessage(err instanceof Error ? err.message : "Error loading demo scenario");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Clear Demo Scenario Action
  const handleClearDemoScenario = async () => {
    try {
      setIsAnalyzing(true);
      setStatusMessage(null);
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_demo" }),
      });

      if (!res.ok) {
        throw new Error("Failed to clear demo scenario.");
      }

      const json = await res.json();
      setStatusMessage("Demo Alert Scenario Cleared cleanly.");
      fetchAlerts();
    } catch (err: unknown) {
      setStatusMessage(err instanceof Error ? err.message : "Error clearing demo scenario");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      const res = await fetch(`/api/alerts?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to dismiss alert.");
      }
      fetchAlerts();
    } catch (err: unknown) {
      console.error("Error dismissing alert:", err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all alerts?")) return;

    try {
      const res = await fetch("/api/alerts?clearAll=true", {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to clear alerts.");
      }
      fetchAlerts();
    } catch (err: unknown) {
      console.error("Error clearing alerts:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (!res.ok) {
        throw new Error("Failed to mark all as read.");
      }
      fetchAlerts();
    } catch (err: unknown) {
      console.error("Error marking all read:", err);
    }
  };

  const filteredAlerts = (data?.alerts || []).filter(
    (a) => selectedPriority === "ALL" || a.priority === selectedPriority
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header & Hackathon Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
              <BellRing className="w-6 h-6 text-purple-400" />
              Actionable System Alerts
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Prioritized overspending warnings, subscription renewals, EMI reminders, and cash flow risk flags.
            </p>
          </div>

          {/* Action Buttons: Run Analysis & Demo Scenario */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              disabled={isAnalyzing}
              onClick={handleRunAnalysis}
              icon={<Play className="w-4 h-4 text-purple-200" />}
            >
              {isAnalyzing ? "Analyzing..." : "Run Alert Analysis"}
            </Button>

            <button
              onClick={handleLoadDemoScenario}
              disabled={isAnalyzing}
              className="px-3.5 py-2 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border border-purple-700/50 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
              title="Populate demo data & trigger all alert rules for demonstration"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Load Demo Alert Scenario
            </button>

            <button
              onClick={handleClearDemoScenario}
              disabled={isAnalyzing}
              className="px-3 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/40 text-xs font-medium transition-colors"
              title="Remove demo scenario data"
            >
              Clear Demo
            </button>
          </div>
        </div>

        {/* Status Message Notification */}
        {statusMessage && (
          <div className="p-3.5 rounded-2xl bg-purple-950/80 border border-purple-500/40 text-xs text-purple-200 flex items-center justify-between shadow-lg animate-in fade-in duration-200">
            <div className="flex items-center gap-2 font-semibold">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-white text-xs font-bold px-1"
            >
              âœ•
            </button>
          </div>
        )}

        {/* Secondary Bar: Filter + Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Priority Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {["ALL", "HIGH", "MEDIUM", "LOW"].map((prio) => (
              <button
                key={prio}
                onClick={() => setSelectedPriority(prio)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedPriority === prio
                    ? "bg-purple-600 text-white shadow-md"
                    : "bg-purple-950/40 text-slate-400 hover:text-white border border-purple-900/40"
                }`}
              >
                {prio === "ALL" ? "All Priorities" : `${prio} Priority`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {data && data.unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-purple-300 bg-purple-950/60 hover:bg-purple-900/60 px-3 py-1.5 rounded-xl border border-purple-800/40 transition-colors"
              >
                Mark All Read ({data.unreadCount})
              </button>
            )}
            {data && data.totalAlerts > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClearAll}
                icon={<CheckCircle className="w-4 h-4 text-emerald-400" />}
              >
                Clear All Alerts
              </Button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <Card variant="glass" className="p-6 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Error Loading Alerts</h3>
            <p className="text-sm text-[var(--text-secondary)]">{error}</p>
            <button
              onClick={fetchAlerts}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Retry
            </button>
          </Card>
        )}

        {/* Alerts List View */}
        {!loading && !error && (
          <div className="space-y-3">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} onDismiss={handleDismiss} />
              ))
            ) : (
              <Card variant="glass" className="py-12 text-center space-y-3">
                <ShieldAlert className="w-12 h-12 text-emerald-400 mx-auto opacity-80" />
                <h3 className="text-lg font-bold text-[var(--text-primary)]">All Clear!</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  No active priority alerts found. Click "Run Alert Analysis" to scan your transactions or "Load Demo Alert Scenario" to test rules.
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleRunAnalysis}
                    icon={<Play className="w-4 h-4" />}
                  >
                    Run Alert Analysis
                  </Button>
                  <button
                    onClick={handleLoadDemoScenario}
                    className="px-3.5 py-2 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border border-purple-700/50 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    Load Demo Alert Scenario
                  </button>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
