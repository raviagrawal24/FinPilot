"use client";

import React, { useState } from "react";
import { Upload, X, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface StatementUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StatementUploadModal({ isOpen, onClose }: StatementUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleUpload = () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setIsSuccess(true);
    }, 1500);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setIsSuccess(false);
    setIsUploading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md glass-panel rounded-2xl p-6 relative border border-purple-500/30 shadow-2xl space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-purple-950/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-purple-400" />
            Upload Bank Statement
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            FinPilot AI automatically parses CSV or PDF statements to categorize transactions and update health scores.
          </p>
        </div>

        {isSuccess ? (
          <div className="p-6 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="font-semibold text-white">Statement Processed!</h4>
            <p className="text-xs text-emerald-300">
              Successfully extracted 24 new transactions and updated spending categories.
            </p>
            <Button variant="primary" size="sm" onClick={() => { handleReset(); onClose(); }}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files?.[0]) setSelectedFile(e.dataTransfer.files[0]);
              }}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                dragActive
                  ? "border-purple-400 bg-purple-950/60"
                  : selectedFile
                  ? "border-purple-500/60 bg-purple-950/30"
                  : "border-purple-900/50 bg-purple-950/10 hover:border-purple-500/40"
              }`}
            >
              <FileText className="w-10 h-10 text-purple-400 mx-auto mb-2" />
              {selectedFile ? (
                <div>
                  <p className="text-sm font-semibold text-white truncate max-w-xs mx-auto">
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] text-purple-300 mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Ready to parse
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-white">
                    Drag & drop your statement here, or <span className="text-purple-400 underline">browse</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Supports PDF, CSV, XLSX (HDFC, ICICI, SBI, Axis)</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-purple-900/30">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!selectedFile || isUploading}
                onClick={handleUpload}
              >
                {isUploading ? "Parsing Statement..." : "Start Parsing"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
