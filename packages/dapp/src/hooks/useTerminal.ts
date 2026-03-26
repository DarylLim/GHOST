"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export function useTerminal() {
  const searchParams = useSearchParams();

  return useMemo(() => {
    const tenant = searchParams.get("tenant");
    const itemId = searchParams.get("itemId");
    const isInGame = !!tenant && !!itemId;

    return { tenant, itemId, isInGame };
  }, [searchParams]);
}
