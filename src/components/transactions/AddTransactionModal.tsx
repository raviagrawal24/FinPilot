"use client";

import React, { useState } from "react";
import { Plus, X, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId?: string;
}

export function AddTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  userId,
}: AddTransactionModalProps) {
  const [merchant, setMerchant] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<"EXPENSE" | "INCOME" | "TRANSFER">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [isRecurring, setIsRecurring] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!merchant.trim() || !amount || parseFloat(amount) <= 0) {
      setErrorMessage("Please enter a valid merchant and positive amount.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          merchant: merchant.trim(),
          description: description.trim() || merchant.trim(),
          date,
          type,
          amount: parseFloat(amount),
          category,
          isRecurring,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create transaction.");
      }

      // Reset form
      setMerchant("");
      setDescription("");
      setAmount("");
      setCategory("Food");
      setIsRecurring(false);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Add transaction error:", err);
      setErrorMessage(err?.message || "Failed to save transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoriesList = [
    "Food",
    "Shopping",
    "Transport",
    "Housing",
    "Utilities",
    "Subscriptions",
    "Entertainment",
    "Healthcare",
    "Salary",
    "Freelance",
    "Other",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-md glass-panel rounded-2xl p-6 relative border border-[var(--border-subtle)] shadow-2xl space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Plus className="w-5 h-5 text-purple-500" />
            Add New Transaction
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Manually enter a transaction record into your PostgreSQL database.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-[var(--text-secondary)]">Transaction Type</label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)]">
              {(["EXPENSE", "INCOME", "TRANSFER"] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setType(t)}
                  className={`py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                    type === t
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-[var(--text-secondary)]">Merchant / Payee *</label>
              <input
                type="text"
                placeholder="e.g. Swiggy, Uber"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-purple-500/60"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[var(--text-secondary)]">Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-purple-500/60"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-[var(--text-secondary)]">Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-purple-500/60"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[var(--text-secondary)]">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-purple-500/60"
              >
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[var(--text-secondary)]">Description / Note</label>
            <input
              type="text"
              placeholder="e.g. Lunch with team"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-purple-500/60"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isRecurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="accent-purple-600 w-4 h-4 rounded cursor-pointer"
            />
            <label htmlFor="isRecurring" className="text-xs text-[var(--text-secondary)] font-medium cursor-pointer">
              Recurring Monthly Subscription / Expense
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={isSubmitting}
              icon={isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <Plus className="w-4 h-4 text-white" />}
            >
              {isSubmitting ? "Saving..." : "Save Transaction"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
