"use client";

import { AdminSidebar } from "./AdminSidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-mdt-bg">
      <AdminSidebar />
      <main className="mdt-scroll flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
