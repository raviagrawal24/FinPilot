"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatementUploadModal } from "@/components/transactions/StatementUploadModal";
import { AddTransactionModal } from "@/components/transactions/AddTransactionModal";
import { formatCurrency } from "@/lib/utils";
import { TransactionItem } from "@/types";
import {
  Search,
  Plus,
  Upload,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  CheckCircle2,
  Trash2,
  Eye,
  X,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Receipt,
  Wallet,
} from "lucide-react";

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedTxDetail, setSelectedTxDetail] = useState<TransactionItem | null>(null);

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [summary, setSummary] = useState({
    totalTransactions: 0,
    totalIncome: 0,
    totalExpenses: 0,
    netCashFlow: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch transactions from API
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append("search", searchTerm.trim());
      if (categoryFilter !== "ALL") params.append("category", categoryFilter);
      if (typeFilter !== "ALL") params.append("type", typeFilter);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.transactions && Array.isArray(data.transactions)) {
          const mapped: TransactionItem[] = data.transactions.map((tx: any) => ({
            id: tx.id,
            date: new Date(tx.date).toISOString().slice(0, 10),
            merchant: tx.merchant,
            description: tx.description || tx.merchant,
            category: tx.category?.name || "Other",
            account: tx.account?.name || "Bank Account",
            type: tx.type as "INCOME" | "EXPENSE" | "TRANSFER",
            amount: tx.amount,
            isRecurring: tx.isRecurring,
          }));
          setTransactions(mapped);
        }
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (err) {
      console.error("Error loading transactions:", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, categoryFilter, typeFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Handle Delete transaction
  const handleDelete = async (id: string, merchant: string) => {
    if (!confirm(`Are you sure you want to delete the transaction for "${merchant}"?`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/transactions?id=${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete transaction.");
      }

      setToastMessage(`Transaction for "${merchant}" deleted successfully.`);
      setTimeout(() => setToastMessage(null), 4000);
      fetchTransactions();
    } catch (err: any) {
      console.error("Delete error:", err);
      alert(err?.message || "Failed to delete transaction.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRefresh = (msg: string) => {
    fetchTransactions();
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sort transactions
  const sortedTransactions = [...transactions].sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
  });

  const categories = [
    "ALL",
    "Food",
    "Salary",
    "Shopping",
    "Housing",
    "Subscriptions",
    "Transport",
    "Utilities",
    "Healthcare",
    "Entertainment",
    "Freelance",
    "Other",
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Transactions Hub</h1>
            <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-2">
              Real-time audit log of income, expenses, and statement uploads.
              {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAddOpen(true)}
              icon={<Plus className="w-4 h-4 text-purple-300" />}
            >
              Add Transaction
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

        {/* Toast Alert */}
        {toastMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <Badge variant="success">Updated Live</Badge>
          </div>
        )}

        {/* 6. Summary Cards at the top */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="glass">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">Total Transactions</span>
              <Receipt className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="text-2xl font-extrabold text-white mt-2">{summary.totalTransactions}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Recorded in database</p>
          </Card>

          <Card variant="glass">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">Total Income</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-extrabold text-emerald-400 mt-2">{formatCurrency(summary.totalIncome)}</h3>
            <p className="text-[11px] text-emerald-300 mt-1">Credits & salary</p>
          </Card>

          <Card variant="glass">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">Total Expenses</span>
              <TrendingDown className="w-4 h-4 text-rose-400" />
            </div>
            <h3 className="text-2xl font-extrabold text-rose-400 mt-2">{formatCurrency(summary.totalExpenses)}</h3>
            <p className="text-[11px] text-rose-300 mt-1">Debits & charges</p>
          </Card>

          <Card variant="glass">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">Net Cash Flow</span>
              <Wallet className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className={`text-2xl font-extrabold mt-2 ${summary.netCashFlow >= 0 ? "text-purple-300" : "text-rose-400"}`}>
              {formatCurrency(summary.netCashFlow)}
            </h3>
            <p className="text-[11px] text-purple-400 mt-1">
              {summary.netCashFlow >= 0 ? "+ Positive Surplus" : "- Net Deficit"}
            </p>
          </Card>
        </div>

        {/* 7. Search, Type, Category, and Sorting Toolbar */}
        <Card variant="glass" className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search merchant, description..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-purple-950/30 border border-purple-900/40 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-500/60"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Type Filter */}
              <div className="flex items-center gap-1 bg-purple-950/40 p-1 rounded-xl border border-purple-900/40 text-xs">
                {["ALL", "INCOME", "EXPENSE", "TRANSFER"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                      typeFilter === t
                        ? "bg-purple-600 text-white shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {t === "ALL" ? "All Types" : t}
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

              {/* Sort Order Toggle */}
              <button
                onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                className="px-3 py-2 text-xs bg-purple-950/40 border border-purple-900/40 rounded-xl text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <span>Date: {sortOrder === "desc" ? "Newest First" : "Oldest First"}</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Transactions Data Table */}
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
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/20 text-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin text-purple-400 mx-auto mb-2" />
                      Loading live transactions from PostgreSQL database...
                    </td>
                  </tr>
                ) : sortedTransactions.length > 0 ? (
                  sortedTransactions.map((tx) => (
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
                        ) : tx.type === "TRANSFER" ? (
                          <span className="text-purple-300 font-semibold flex items-center gap-1">
                            Transfer
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
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedTxDetail(tx)}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-purple-900/40 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            disabled={deletingId === tx.id}
                            onClick={() => handleDelete(tx.id, tx.merchant)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors disabled:opacity-50"
                            title="Delete Transaction"
                          >
                            {deletingId === tx.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-rose-400" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 space-y-2">
                      <Receipt className="w-10 h-10 text-purple-400 mx-auto opacity-70" />
                      <p className="font-semibold text-white">No transactions found.</p>
                      <p className="text-xs">Add a new transaction or upload a bank statement to get started.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* View Transaction Details Modal */}
        {selectedTxDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-md glass-panel rounded-2xl p-6 relative border border-purple-500/30 shadow-2xl space-y-4">
              <button
                onClick={() => setSelectedTxDetail(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-purple-950/50"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-purple-400" />
                Transaction Detail
              </h3>

              <div className="space-y-3 text-xs pt-2">
                <div className="flex justify-between border-b border-purple-900/30 pb-2">
                  <span className="text-slate-400">Merchant</span>
                  <span className="font-bold text-white">{selectedTxDetail.merchant}</span>
                </div>
                <div className="flex justify-between border-b border-purple-900/30 pb-2">
                  <span className="text-slate-400">Description</span>
                  <span className="text-slate-200">{selectedTxDetail.description}</span>
                </div>
                <div className="flex justify-between border-b border-purple-900/30 pb-2">
                  <span className="text-slate-400">Date</span>
                  <span className="text-slate-200">{selectedTxDetail.date}</span>
                </div>
                <div className="flex justify-between border-b border-purple-900/30 pb-2">
                  <span className="text-slate-400">Category</span>
                  <Badge variant="neutral">{selectedTxDetail.category}</Badge>
                </div>
                <div className="flex justify-between border-b border-purple-900/30 pb-2">
                  <span className="text-slate-400">Type</span>
                  <span className="font-bold text-purple-300">{selectedTxDetail.type}</span>
                </div>
                <div className="flex justify-between border-b border-purple-900/30 pb-2">
                  <span className="text-slate-400">Amount</span>
                  <span className="font-extrabold text-white text-sm">{formatCurrency(selectedTxDetail.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Recurring</span>
                  <span className="text-slate-200">{selectedTxDetail.isRecurring ? "Yes (Monthly)" : "No"}</span>
                </div>
              </div>

              <Button variant="secondary" size="sm" className="w-full mt-4" onClick={() => setSelectedTxDetail(null)}>
                Close
              </Button>
            </div>
          </div>
        )}

        {/* Statement Upload Modal */}
        <StatementUploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onSuccess={() => handleRefresh("Bank statement uploaded and saved into database!")}
        />

        {/* Add Transaction Modal */}
        <AddTransactionModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onSuccess={() => handleRefresh("Transaction saved into database!")}
        />
      </div>
    </AppLayout>
  );
}
