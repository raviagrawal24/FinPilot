"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { MOCK_EXPENSE_CATEGORIES } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { PieChart as PieIcon } from "lucide-react";

export function ExpenseBreakdownChart() {
  const totalExpense = MOCK_EXPENSE_CATEGORIES.reduce((acc, c) => acc + c.amount, 0);

  return (
    <Card variant="glass" className="space-y-4">
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-purple-400" />
            Expense Breakdown
          </CardTitle>
          <CardDescription>Categorized monthly spending analysis.</CardDescription>
        </div>
        <span className="text-xs font-semibold text-purple-300 bg-purple-950/60 px-2.5 py-1 rounded-full border border-purple-800/40">
          Total: {formatCurrency(totalExpense)}
        </span>
      </CardHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Donut Pie Chart */}
        <div className="h-56 w-full relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={MOCK_EXPENSE_CATEGORIES}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="amount"
              >
                {MOCK_EXPENSE_CATEGORIES.map((cat, index) => (
                  <Cell key={`cell-${index}`} fill={cat.color} stroke="#090514" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="glass-panel p-2.5 rounded-xl shadow-lg text-xs space-y-0.5 border border-purple-500/30">
                        <p className="font-bold text-white">{data.name}</p>
                        <p className="text-purple-300">{formatCurrency(data.amount)} ({data.percentage}%)</p>
                        <p className="text-[10px] text-slate-400">{data.isEssential ? "Essential" : "Discretionary"}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs text-slate-400">Top Category</span>
            <span className="text-sm font-bold text-white">Housing (40.5%)</span>
          </div>
        </div>

        {/* Category List Details */}
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {MOCK_EXPENSE_CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              className="flex items-center justify-between p-2 rounded-xl bg-purple-950/20 border border-purple-900/20 text-xs hover:border-purple-500/30 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="font-medium text-slate-200">{cat.name}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-white block">{formatCurrency(cat.amount)}</span>
                <span className="text-[10px] text-slate-400">{cat.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
