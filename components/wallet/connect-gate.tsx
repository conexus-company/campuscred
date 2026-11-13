"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mapContractError } from "@/lib/chain/write";
import type { Wallet } from "@/lib/wallet/use-wallet";

export function GateCard({ title, description, action }: { title: string; description: ReactNode; action?: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md py-16">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {action && <CardContent className="flex flex-col items-start gap-3">{action}</CardContent>}
      </Card>
    </div>
  );
}

function ActionButton({ label, onClick }: { label: string; onClick: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handle = async () => {
    setBusy(true);
    setError(null);
    try {
      await onClick();
    } catch (e) {
      setError(mapContractError(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Button variant="ink" size="pill-sm" onClick={handle} disabled={busy}>
        {busy ? "Check MetaMask…" : label}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </>
  );
}

/** Renders children only when MetaMask is connected to BSC Testnet. */
export function ConnectGate({ wallet, children }: { wallet: Wallet; children: ReactNode }) {
  switch (wallet.status) {
    case "checking":
      return (
        <p role="status" className="py-16 text-center text-sm text-muted-foreground">
          Checking your wallet…
        </p>
      );
    case "no-wallet":
      return (
        <GateCard
          title="MetaMask is not installed"
          description={
            <>
              Install{" "}
              <a href="https://metamask.io/download/" target="_blank" rel="noreferrer" className="underline">
                MetaMask
              </a>{" "}
              in this browser, then reload the page.
            </>
          }
        />
      );
    case "disconnected":
      return (
        <GateCard
          title="Connect your wallet"
          description="Issuing and admin actions are signed with your MetaMask wallet."
          action={<ActionButton label="Connect MetaMask" onClick={wallet.connect} />}
        />
      );
    case "wrong-chain":
      return (
        <GateCard
          title="Wrong network"
          description="CampusCred runs on BNB Smart Chain Testnet."
          action={<ActionButton label="Switch to BSC Testnet" onClick={wallet.ensureChain} />}
        />
      );
    case "error":
      return (
        <GateCard
          title="Could not reach BSC Testnet"
          description="We could not check your wallet's role. Check your connection and try again."
          action={<ActionButton label="Try again" onClick={wallet.refresh} />}
        />
      );
    case "ready":
      return children;
  }
}
