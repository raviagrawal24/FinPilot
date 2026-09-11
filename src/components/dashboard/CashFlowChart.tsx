"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { MOCK_CASH_FLOW } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

export function CashFlowChart() {
  return (
    <Card variant="glass" className="space-y-4">
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            Cash Flow & Monthly Projection
          </CardTitle>
          <CardDescription>
            Historical income vs expenses with month-end net balance projection.
          </CardDescription>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-3 h-3 rounded-full bg-purple-500 inline-block" />
            Income
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
            Expenses
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-3 h-3 rounded bg-emerald-400 inline-block" />
            Projected Balance
          </div>
        </div>
      </CardHeader>

      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={MOCK_CASH_FLOW} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.2} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "rgba(139, 92, 246, 0.2)" }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="glass-panel p-3 rounded-xl shadow-xl border border-purple-500/30 text-xs space-y-1.5">
                      <p className="font-bold text-white border-b border-purple-900/40 pb-1">{label}</p>
                      <p className="text-purple-300">
                        Income: <span className="font-semibold">{formatCurrency(payload[0]?.value as number)}</span>
                      </p>
                      <p className="text-rose-400">
                        Expenses: <span className="font-semibold">{formatCurrency(payload[1]?.value as number)}</span>
                      </p>
                      <p className="text-emerald-400 font-semibold pt-1 border-t border-purple-900/40">
                        Cumul. Balance: {formatCurrency(payload[2]?.value as number)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Bar dataKey="income" fill="url(#incomeGrad)" radius={[6, 6, 0, 0]} barSize={20} />
            <Bar dataKey="expenses" fill="url(#expenseGrad)" radius={[6, 6, 0, 0]} barSize={20} />
            <Line
              type="monotone"
              dataKey="projectedBalance"
              stroke="#34d399"
              strokeWidth={3}
              dot={{ r: 4, fill: "#34d399", stroke: "#06040a", strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
