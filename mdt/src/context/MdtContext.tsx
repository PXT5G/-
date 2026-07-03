"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { DutyStatus } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { departmentToJob, type JobType } from "@/lib/config/jobs";

interface MdtContextValue {
  dutyStatus: DutyStatus;
  toggleDuty: () => void;
  job: JobType;
  fineModalOpen: boolean;
  openFineModal: () => void;
  closeFineModal: () => void;
}

const MdtContext = createContext<MdtContextValue | null>(null);

export function MdtProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [dutyStatus, setDutyStatus] = useState<DutyStatus>("off_duty");
  const [fineModalOpen, setFineModalOpen] = useState(false);

  const job = user ? departmentToJob(user.officer.department) : "police";

  const toggleDuty = useCallback(() => {
    setDutyStatus((prev) => {
      const next = prev === "on_duty" ? "off_duty" : "on_duty";
      // Discord Bot API: POST /duty-logs — auto duty log like FiveM MDT
      fetch("/api/mdt/duty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: next }),
      }).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      dutyStatus,
      toggleDuty,
      job,
      fineModalOpen,
      openFineModal: () => setFineModalOpen(true),
      closeFineModal: () => setFineModalOpen(false),
    }),
    [dutyStatus, job, fineModalOpen, toggleDuty],
  );

  return <MdtContext.Provider value={value}>{children}</MdtContext.Provider>;
}

export function useMdt() {
  const ctx = useContext(MdtContext);
  if (!ctx) throw new Error("useMdt must be used within MdtProvider");
  return ctx;
}
