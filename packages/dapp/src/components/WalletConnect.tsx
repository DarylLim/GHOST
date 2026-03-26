"use client";

import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";

export function WalletConnect({
  onConnect,
}: {
  onConnect: (address: string) => void;
}) {
  const account = useCurrentAccount();

  if (account) {
    onConnect(account.address);
  }

  return (
    <div className="flex items-center gap-3">
      <ConnectButton
        connectText="Connect Wallet"
        className="!bg-ghost-surface-2 !border !border-ghost-border !text-ghost-text !rounded !px-3 !py-1.5 !text-sm hover:!border-ghost-accent"
      />
      {account && (
        <span className="text-ghost-text-secondary text-xs font-mono">
          {account.address.slice(0, 6)}...{account.address.slice(-4)}
        </span>
      )}
    </div>
  );
}
