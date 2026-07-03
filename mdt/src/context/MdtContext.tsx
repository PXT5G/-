"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { DutyStatus } from "@/types";
import { currentUser as mockUser } from "@/lib/data/mock";

interface MdtContextValue {
  dutyStatus: DutyStatus;
  toggleDuty: () => void;
  user: typeof mockUser;
  fineModalOpen: boolean;
  openFineModal: () => void;
  closeFineModal: () => void;
}

const MdtContext = createContext<MdtContextValue | null>(null);

export function MdtProvider({ children }: { children: React.ReactNode }) {
  const [dutyStatus, setDutyStatus] = useState<DutyStatus>(mockUser.dutyStatus);
  const [fineModalOpen, setFineModalOpen] = useState(false);

  const toggleDuty = useCallback(() => {
    setDutyStatus((prev) => (prev === "on_duty" ? "off_duty" : "on_duty"));
    // Discord Bot API: PATCH /officers/{id}/duty — sync duty status to backend
  }, []);

  const value = useMemo(
    () => ({
      dutyStatus,
      toggleDuty,
      user: { ...mockUser, dutyStatus },
      fineModalOpen,
      openFineModal: () => setFineModalOpen(true),
      closeFineModal: () => setFineModalOpen(false),
    }),
    [dutyStatus, fineModalOpen, toggleDuty],
  );

  return <MdtContext.Provider value={value}>{children}</MdtContext.Provider>;
}

export function useMdt() {
  const ctx = useContext(MdtContext);
  if (!ctx) throw new Error("useMdt must be used within MdtProvider");
  return ctx;
}
