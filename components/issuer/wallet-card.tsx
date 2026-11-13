"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHAIN_ID } from "@/lib/contract/config";
import { useWallet } from "@/lib/wallet/use-wallet";

/** "Your wallet" card on /issuer: address, network, role. */
export function WalletCard() {
  const wallet = useWallet(); // the layout's RoleGate has already checked the role
  const role = wallet.isAdmin ? "Registrar admin" : "Approved issuer";

  return (
    <Card className="flex-[1_1_320px]">
      <CardHeader>
        <CardTitle>Your wallet</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-cc-muted">Address</dt>
          <dd className="break-all font-mono">{wallet.address ?? "…"}</dd>
          <dt className="text-cc-muted">Network</dt>
          <dd>BSC Testnet ({CHAIN_ID})</dd>
          <dt className="text-cc-muted">Role</dt>
          <dd>{wallet.status === "ready" ? role : "…"}</dd>
        </dl>
      </CardContent>
    </Card>
  );
}
