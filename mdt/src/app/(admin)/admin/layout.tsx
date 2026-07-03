"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAuth } from "@/context/AuthContext";
import { messages } from "@/lib/i18n/messages";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace("/");
    }
  }, [loading, user, isAdmin, router]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-mdt-bg text-mdt-muted">
        {messages.common.loading}
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
