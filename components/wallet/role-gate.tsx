"use client";

import type { ReactNode } from "react";
import { useWallet, type Wallet } from "@/lib/wallet/use-wallet";
import { ConnectGate, GateCard } from "./connect-gate";

const DENIED = {
  issuer: "This wallet is not an approved issuer. Ask the registrar admin to add it.",
  admin: "This wallet is not the registrar admin. Connect the admin wallet.",
};

type Props = {
  role: "issuer" | "admin";
  /** A function child receives the connected wallet, so pages need no second useWallet(). */
  children: ReactNode | ((wallet: Wallet) => ReactNode);
};

/** Renders children only for a connected wallet holding `role` on chain. Admin also passes the issuer gate. */
export function RoleGate({ role, children }: Props) {
  const wallet = useWallet();
  const allowed = role === "admin" ? wallet.isAdmin : wallet.isIssuer || wallet.isAdmin;
  return (
    <ConnectGate wallet={wallet}>
      {allowed ? (
        typeof children === "function" ? children(wallet) : children
      ) : (
        <GateCard title="Not allowed" description={DENIED[role]} />
      )}
    </ConnectGate>
  );
}
