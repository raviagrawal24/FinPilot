"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, FileText, CheckCircle2, AlertCircle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface RowErrorItem {
  rowNumber: number;
  merchant: string;
  rawDate: any;
  rawAmount: any;
  reason: string;
}

interface StatementUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userId?: string;
}

export function StatementUploadModal({
  isOpen,
  onClose,
  onSuccess,
  userId,
}: StatementUploadModalProps) {
  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showErrorsList, setShowErrorsList] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    imported: number;
    skipped: number;
    errors: number;
    rowErrors?: RowErrorItem[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMessage(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const name = file.name.toLowerCase();
      if (name.endsWith(".csv") || name.endsWith(".xlsx") || name.endsWith(".xls")) {
        setSelectedFile(file);
        setErrorMessage(null);
      } else {
        setErrorMessage("Please select a supported file (.csv, .xlsx, .xls)");
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (userId) {
        formData.append("userId", userId);
      }

      const response = await fetch("/api/statements/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to upload and parse statement.");
      }

      setUploadResult({
        imported: data.imported ?? 0,
        skipped: data.skipped ?? data.skippedDuplicates ?? 0,
        errors: data.errors ?? data.errorsCount ?? 0,
        rowErrors: data.rowErrors || [],
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error("Upload failed:", err);
      setErrorMessage(err?.message || "An unexpected error occurred during statement upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setIsUploading(false);
    setErrorMessage(null);
    setShowErrorsList(false);
  };

  const handleViewTransactions = () => {
    handleReset();
    onClose();
    router.push("/transactions");
    router.refresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-lg glass-panel rounded-3xl p-6 relative border border-[var(--border-subtle)] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto bg-[var(--bg-surface)]">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Close Button */}
        <button
          onClick={() => {
            handleReset();
            onClose();
          }}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Upload className="w-5 h-5 text-purple-500" />
            Upload Bank Statement
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Import CSV or Excel (.xlsx/.xls) bank statements directly into your FinPilot database.{" "}
            <a
              href="/sample-statement.csv"
              download
              className="text-purple-500 hover:underline font-semibold"
            >
              Download sample CSV
            </a>
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-700 dark:text-rose-300 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {uploadResult ? (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <div>
              <h4 className="font-bold text-[var(--text-primary)] text-base">
                ✓ Statement processed successfully
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Your bank statement was parsed, auto-categorized, and saved.
              </p>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border-subtle)] text-xs">
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block uppercase font-bold">Imported</span>
                <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{uploadResult.imported}</span>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/15 border border-purple-500/30">
                <span className="text-[10px] text-purple-700 dark:text-purple-300 block uppercase font-bold">Skipped (Dup)</span>
                <span className="text-xl font-extrabold text-purple-600 dark:text-purple-400">{uploadResult.skipped}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-500/15 border border-slate-500/30">
                <span className="text-[10px] text-[var(--text-muted)] block uppercase font-bold">Errors</span>
                <span className="text-xl font-extrabold text-[var(--text-primary)]">{uploadResult.errors}</span>
              </div>
            </div>

            {/* Expandable Row Errors */}
            {uploadResult.rowErrors && uploadResult.rowErrors.length > 0 && (
              <div className="text-left rounded-xl bg-rose-500/10 border border-rose-500/30 overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setShowErrorsList(!showErrorsList)}
                  className="w-full p-3 flex items-center justify-between font-bold text-rose-700 dark:text-rose-300 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    Row-Level Errors ({uploadResult.rowErrors.length})
                  </span>
                  {showErrorsList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showErrorsList && (
                  <div className="p-3 pt-0 space-y-1.5 max-h-40 overflow-y-auto border-t border-rose-500/20">
                    {uploadResult.rowErrors.map((err, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/20 text-[11px] text-rose-800 dark:text-rose-200">
                        <span className="font-bold">Row {err.rowNumber}:</span> {err.reason || `Invalid transaction date/amount`}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Button
              variant="primary"
              size="sm"
              className="w-full py-2.5 mt-2"
              onClick={handleViewTransactions}
            >
              View Transactions
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                dragActive
                  ? "border-purple-500 bg-purple-500/10"
                  : selectedFile
                  ? "border-purple-500/60 bg-purple-500/5"
                  : "border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:border-purple-500/40"
              }`}
            >
              <FileText className="w-10 h-10 text-purple-500 mx-auto mb-2" />
              {selectedFile ? (
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)] truncate max-w-xs mx-auto">
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Click or drop to change
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Drag & drop your statement here, or <span className="text-purple-600 dark:text-purple-400 font-bold underline">browse</span>
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">Supports CSV, XLSX, XLS bank statements</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--border-subtle)]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  handleReset();
                  onClose();
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!selectedFile || isUploading}
                onClick={handleUpload}
                icon={isUploading ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <Upload className="w-4 h-4 text-white" />}
              >
                {isUploading ? "Uploading & Parsing..." : "Start Parsing"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
