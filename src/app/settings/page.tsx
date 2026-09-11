"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MOCK_USER } from "@/lib/mock-data";
import { Settings, User, Bell, Shield, Landmark, Save, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [name, setName] = useState(MOCK_USER.name);
  const [email, setEmail] = useState(MOCK_USER.email);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-purple-400" />
            Account Settings & Preferences
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Manage user profile credentials, notification alerts, and linked bank accounts.
          </p>
        </div>

        {/* Profile Card */}
        <Card variant="glass" className="space-y-4">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-purple-400" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal info and avatar.</CardDescription>
            </div>
            {saved && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Saved Successfully
              </span>
            )}
          </CardHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 bg-purple-950/30 border border-purple-900/40 rounded-xl text-white focus:outline-none focus:border-purple-500/60"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 bg-purple-950/30 border border-purple-900/40 rounded-xl text-white focus:outline-none focus:border-purple-500/60"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button variant="primary" size="sm" onClick={handleSave} icon={<Save className="w-4 h-4" />}>
              Save Profile
            </Button>
          </div>
        </Card>

        {/* Linked Accounts */}
        <Card variant="glass" className="space-y-4">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-purple-400" />
                Linked Bank Accounts
              </CardTitle>
              <CardDescription>Connected financial institutions via Open Banking API.</CardDescription>
            </div>
          </CardHeader>

          <div className="space-y-2">
            {[
              { name: "HDFC Salary Account", acc: "•••• 4892", status: "Sync Active" },
              { name: "ICICI Savings Account", acc: "•••• 1029", status: "Sync Active" },
              { name: "HDFC Regalia Credit Card", acc: "•••• 8831", status: "Sync Active" },
            ].map((acc) => (
              <div
                key={acc.acc}
                className="p-3 rounded-xl bg-purple-950/30 border border-purple-900/30 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-white">{acc.name}</p>
                  <p className="text-slate-400 text-[10px]">{acc.acc}</p>
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
