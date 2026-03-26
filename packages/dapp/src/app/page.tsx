"use client";

import { useState, useCallback, Suspense } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { WalletConnect } from "@/components/WalletConnect";
import { TabNav } from "@/components/TabNav";
import { StatusPanel } from "@/components/StatusPanel";
import { IntelFeed } from "@/components/IntelFeed";
import { GhostChat } from "@/components/GhostChat";
import { useGhost } from "@/hooks/useGhost";
import { useTerminal } from "@/hooks/useTerminal";
import { DEMO_MODE } from "@/lib/config";
import type { TabId } from "@/lib/types";

function GhostApp() {
  const account = useCurrentAccount();
  const { itemId } = useTerminal();
  const [activeTab, setActiveTab] = useState<TabId>("status");

  // In demo mode, use a fake address if wallet not connected
  const walletAddress = account?.address || (DEMO_MODE ? "0xDEMO" : null);

  const ghost = useGhost(walletAddress, itemId);

  const handleConnect = useCallback(
    (_addr: string) => {
      if (!ghost.connected && !ghost.connecting) {
        ghost.connect();
      }
    },
    [ghost]
  );

  const handleDismissAlert = useCallback(
    (alertId: string) => {
      // Local dismiss — in production this calls the API
    },
    []
  );

  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-ghost-border">
        <div className="flex items-center gap-2">
          <span className="text-ghost-accent font-mono text-sm font-bold tracking-wider">
            GHOST
          </span>
          <span className="text-[10px] text-ghost-text-secondary font-mono">
            v0.1
          </span>
        </div>
        {!DEMO_MODE && (
          <WalletConnect onConnect={handleConnect} />
        )}
        {DEMO_MODE && !ghost.connected && (
          <button
            onClick={() => ghost.connect()}
            className="px-3 py-1 bg-ghost-surface-2 border border-ghost-border rounded text-xs font-mono text-ghost-accent hover:border-ghost-accent"
          >
            DEMO CONNECT
          </button>
        )}
        {ghost.connected && DEMO_MODE && (
          <span className="text-[10px] text-ghost-accent font-mono">DEMO MODE</span>
        )}
      </div>

      {/* Tabs */}
      <TabNav
        active={activeTab}
        onChange={setActiveTab}
        alertCount={ghost.alerts.filter((a) => !a.dismissed).length}
      />

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!ghost.connected && !DEMO_MODE ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="text-ghost-accent font-mono text-2xl mb-3 tracking-widest">
              GHOST
            </div>
            <div className="text-ghost-text-secondary text-sm mb-1">
              Guided Heuristic Onboard Survival Tactician
            </div>
            <div className="text-ghost-text-secondary text-xs mb-6">
              Connect your EVE Vault wallet to initialize
            </div>
            <div className="w-16 h-px bg-ghost-border mb-4" />
            <div className="text-[10px] text-ghost-text-secondary font-mono">
              EVE Frontier x Sui Hackathon 2026
            </div>
          </div>
        ) : (
          <>
            {activeTab === "status" && (
              <StatusPanel
                context={ghost.context}
                alerts={ghost.alerts}
                wsStatus={ghost.wsStatus}
                onDismissAlert={handleDismissAlert}
              />
            )}
            {activeTab === "intel" && (
              <IntelFeed
                alerts={ghost.alerts}
                walletAddress={walletAddress}
              />
            )}
            {activeTab === "chat" && (
              <GhostChat
                walletAddress={walletAddress}
                connected={ghost.connected}
              />
            )}
          </>
        )}
      </div>

      {/* Footer */}
      {ghost.error && (
        <div className="px-3 py-1 bg-ghost-surface border-t border-ghost-critical text-[10px] text-ghost-critical font-mono">
          {ghost.error}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-black">
          <span className="text-ghost-accent font-mono animate-pulse-glow">
            GHOST initializing...
          </span>
        </div>
      }
    >
      <GhostApp />
    </Suspense>
  );
}
