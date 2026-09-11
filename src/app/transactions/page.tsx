"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatementUploadModal } from "@/components/transactions/StatementUploadModal";
import { MOCK_TRANSACTIONS } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { Search, Filter, Upload, Download, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Filter logic
  const filteredTransactions = MOCK_TRANSACTIONS.filter((tx) => {
    const matchesSearch =
      tx.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.account.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === "ALL" || tx.category === categoryFilter;
    const matchesType = typeFilter === "ALL" || tx.type === typeFilter;

    return matchesSearch && matchesCategory && matchesType;
  });

  const categories = ["ALL", "Food", "Salary", "Shopping", "Housing", "Subscriptions", "Transport", "Utilities", "Freelance"];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Transactions History</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Review, filter, and audit all income and expense transactions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              icon={<Download className="w-4 h-4 text-purple-400" />}
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsUploadOpen(true)}
              icon={<Upload className="w-4 h-4" />}
            >
              Upload Statement
            </Button>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <Card variant="glass" className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search merchant, account, note..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-purple-950/30 border border-purple-900/40 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-500/60"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Type Filter */}
              <div className="flex items-center gap-1 bg-purple-950/40 p-1 rounded-xl border border-purple-900/40 text-xs">
                {["ALL", "INCOME", "EXPENSE"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                      typeFilter === type
                        ? "bg-purple-600 text-white shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {type === "ALL" ? "All Types" : type === "INCOME" ? "Income" : "Expense"}
                  </button>
                ))}
              </div>

              {/* Category Select Dropdown */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-purple-950/40 border border-purple-900/40 rounded-xl text-white focus:outline-none focus:border-purple-500/60"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#0f071d] text-white">
                    {cat === "ALL" ? "All Categories" : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Transactions Table */}
        <Card variant="glass" className="p-0 overflow-hidden border-purple-900/30">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-950/60 text-slate-400 font-semibold uppercase tracking-wider border-b border-purple-900/40">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Merchant</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Account</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/20 text-slate-200">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-purple-950/30 transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-medium text-slate-300 whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                        {tx.merchant}
                        {tx.isRecurring && (
                          <span title="Recurring Subscription">
                            <RefreshCw className="w-3 h-3 text-purple-400 animate-spin-slow" />
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">{tx.description}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant="neutral">{tx.category}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{tx.account}</td>
                      <td className="py-3.5 px-4">
                        {tx.type === "INCOME" ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <ArrowUpRight className="w-3.5 h-3.5" /> Income
                          </span>
                        ) : (
                          <span className="text-rose-400 font-semibold flex items-center gap-1">
                            <ArrowDownRight className="w-3.5 h-3.5" /> Expense
                          </span>
                        )}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-extrabold whitespace-nowrap ${
                          tx.type === "INCOME" ? "text-emerald-400" : "text-white"
                        }`}
                      >
                        {tx.type === "INCOME" ? "+" : "-"} {formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No transactions found matching your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Modal */}
        <StatementUploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
      </div>
    </AppLayout>
  );
}
