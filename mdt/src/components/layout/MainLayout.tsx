"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { MdtProvider } from "@/context/MdtContext";
import { ProcessFineModal } from "@/components/modals/ProcessFineModal";
import { useAuth } from "@/context/AuthContext";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { messages } from "@/lib/i18n/messages";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-mdt-bg text-mdt-muted">
        {messages.common.loading}
      </div>
    );
  }

  return (
    <MdtProvider>
      <div className="flex h-screen overflow-hidden bg-mdt-bg">
        <Sidebar />
        <main className="mdt-scroll flex flex-1 flex-col overflow-hidden">
          <header className="flex shrink-0 items-center gap-4 border-b border-mdt-panel-border bg-slate-950/50 px-6 py-3">
            <GlobalSearch />
          </header>
          <div className="mdt-scroll flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[1600px] p-6">{children}</div>
          </div>
        </main>
      </div>
      <ProcessFineModal />
    </MdtProvider>
  );
}
