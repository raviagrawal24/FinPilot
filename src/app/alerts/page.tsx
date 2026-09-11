"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { AlertCard } from "@/components/dashboard/AlertCard";
import { Button } from "@/components/ui/Button";
import { MOCK_ALERTS } from "@/lib/mock-data";
import { BellRing, CheckCircle, ShieldAlert, Filter } from "lucide-react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [selectedPriority, setSelectedPriority] = useState("ALL");

  const handleDismiss = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const filteredAlerts = alerts.filter(
    (a) => selectedPriority === "ALL" || a.priority === selectedPriority
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <BellRing className="w-6 h-6 text-purple-400" />
              Alerts & Notifications
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Prioritized system alerts, overspending warnings, EMI reminders, and fraud detection flags.
            </p>
          </div>
          {alerts.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAlerts([])}
              icon={<CheckCircle className="w-4 h-4 text-emerald-400" />}
            >
              Clear All Alerts
            </Button>
          )}
        </div>

        {/* Priority Filter Buttons */}
        <div className="flex items-center gap-2">
          {["ALL", "HIGH", "MEDIUM", "LOW"].map((prio) => (
            <button
              key={prio}
              onClick={() => setSelectedPriority(prio)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                selectedPriority === prio
                  ? "bg-purple-600 text-white"
                  : "bg-purple-950/40 text-slate-400 hover:text-white border border-purple-900/40"
              }`}
            >
              {prio === "ALL" ? "All Priorities" : `${prio} Priority`}
            </button>
          ))}
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} onDismiss={handleDismiss} />
            ))
          ) : (
            <Card variant="glass" className="py-12 text-center space-y-2">
              <ShieldAlert className="w-12 h-12 text-emerald-400 mx-auto opacity-80" />
              <h3 className="text-lg font-bold text-white">All Clear!</h3>
              <p className="text-xs text-slate-400">No active priority alerts requiring your attention.</p>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
