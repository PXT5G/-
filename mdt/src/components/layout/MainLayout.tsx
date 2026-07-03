"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { MdtProvider, useMdt } from "@/context/MdtContext";
import { ProcessFineModal } from "@/components/modals/ProcessFineModal";
import { useAuth } from "@/context/AuthContext";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { CommandPalette, useCommandPalette } from "@/components/search/CommandPalette";
import { NotificationBell } from "./NotificationBell";
import { messages } from "@/lib/i18n/messages";
import { JOBS } from "@/lib/config/jobs";
import { DashboardSkeleton } from "@/components/ui/Skeleton";

function MainShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { job } = useMdt();
  const jobConfig = JOBS[job];
  const { open, setOpen } = useCommandPalette();
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    setMobileNav(false);
  }, [children]);

  return (
    <div className="flex h-screen overflow-hidden bg-mdt-bg" data-accent={jobConfig.accent}>
      <Sidebar mobileOpen={mobileNav} onMobileClose={() => setMobileNav(false)} />

      {mobileNav && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileNav(false)}
          aria-label={messages.common.close}
        />
      )}

      <main className="mdt-scroll flex flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center gap-3 border-b border-mdt-panel-border bg-slate-950/60 px-4 py-3 backdrop-blur-md md:gap-4 md:px-6">
          <button
            type="button"
            onClick={() => setMobileNav(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-mdt-panel-border md:hidden"
            aria-label={messages.common.menu}
          >
            <Menu className="h-5 w-5" />
          </button>
          <GlobalSearch onOpenPalette={() => setOpen(true)} />
          <div className="ms-auto flex items-center gap-2 md:gap-3">
            <span className="hidden text-[10px] uppercase tracking-widest accent-text lg:inline">
              {user?.officer.callsign}
            </span>
            <NotificationBell />
          </div>
        </header>
        <div className="mdt-scroll flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1600px] p-4 md:p-6">{children}</div>
        </div>
      </main>

      <CommandPalette open={open} onClose={() => setOpen(false)} />
      <ProcessFineModal />
    </div>
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-mdt-bg p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <MdtProvider>
      <MainShell>{children}</MainShell>
    </MdtProvider>
  );
}
