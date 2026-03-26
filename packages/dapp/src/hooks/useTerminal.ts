"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

// Try to import EVE Frontier dApp kit hooks if available
let useSmartObject: (() => { assembly: any; loading: boolean }) | undefined;
let useConnection: (() => { isConnected: boolean; handleConnect: () => void }) | undefined;
try {
  const kit = require("@evefrontier/dapp-kit");
  useSmartObject = kit.useSmartObject;
  useConnection = kit.useConnection;
} catch {
  // @evefrontier/dapp-kit not installed — fall back to raw params
}

export function useTerminal() {
  const searchParams = useSearchParams();

  return useMemo(() => {
    const tenant = searchParams.get("tenant");
    const itemId = searchParams.get("itemId");
    const isInGame = !!tenant && !!itemId;

    return { tenant, itemId, isInGame };
  }, [searchParams]);
}

export { useSmartObject, useConnection };
