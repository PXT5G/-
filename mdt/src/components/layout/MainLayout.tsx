"use client";

import { Sidebar } from "./Sidebar";
import { MdtProvider } from "@/context/MdtContext";
import { ProcessFineModal } from "@/components/modals/ProcessFineModal";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <MdtProvider>
      <div className="flex h-screen overflow-hidden bg-mdt-bg">
        <Sidebar />
        <main className="mdt-scroll flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1600px] p-6">{children}</div>
        </main>
      </div>
      <ProcessFineModal />
    </MdtProvider>
  );
}
