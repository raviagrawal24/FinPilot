"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("alex.morgan@finpilot.ai");
  const [password, setPassword] = useState("password123");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#06040a] text-slate-100 flex items-center justify-center p-4 subtle-grid-bg">
      <div className="w-full max-w-md glass-panel rounded-2xl p-8 border border-purple-500/30 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl gradient-purple-btn mx-auto flex items-center justify-center shadow-lg shadow-purple-900/50">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Welcome to FinPilot AI</h1>
          <p className="text-xs text-slate-400">Sign in to access your personal financial diagnostic portal.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-purple-950/30 border border-purple-900/40 rounded-xl text-white focus:outline-none focus:border-purple-500/60"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300">Password</label>
              <a href="#" className="text-[11px] text-purple-400 hover:underline">Forgot password?</a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-purple-950/30 border border-purple-900/40 rounded-xl text-white focus:outline-none focus:border-purple-500/60"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full py-3 mt-2" icon={<ArrowRight className="w-4 h-4" />}>
            Sign In to Dashboard
          </Button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-purple-900/30">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-purple-400 font-semibold hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
