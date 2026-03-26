"use client";

import { useState, useCallback, useMemo } from "react";
import { dismissAlertApi } from "@/lib/api";
import type { GhostAlert } from "@/lib/types";

type FilterCategory = "all" | "threat" | "fuel" | "shell" | "tutorial";

export function useAlerts(
  alerts: GhostAlert[],
  walletAddress: string | null
) {
  const [filter, setFilter] = useState<FilterCategory>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return alerts.filter((a) => !a.dismissed);
    return alerts.filter((a) => !a.dismissed && a.category === filter);
  }, [alerts, filter]);

  const dismiss = useCallback(
    async (alertId: string) => {
      if (!walletAddress) return;
      await dismissAlertApi(walletAddress, alertId);
    },
    [walletAddress]
  );

  return { alerts: filtered, filter, setFilter, dismiss };
}
