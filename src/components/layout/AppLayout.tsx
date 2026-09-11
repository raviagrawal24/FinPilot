"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { PageTransition } from "@/components/ui/PageTransition";
import { StatementUploadModal } from "@/components/transactions/StatementUploadModal";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col md:flex-row subtle-grid-bg transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        <TopNav
          onToggleMobileMenu={() => setMobileOpen(!mobileOpen)}
          onOpenUploadModal={() => setUploadModalOpen(true)}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      {/* Statement Upload Modal */}
      <StatementUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
      />
    </div>
  );
}
