// Mirrors CampusCred events into Supabase (alvin/09-sync). Server only.
// The chain is the source of truth for existence and status; the database only mirrors it.
import { getAddress } from "ethers";
import { DEPLOY_BLOCK, type Hex } from "@/lib/contract/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { decodeSyncLog, getBlockTimestamp, getContractLogs, getLatestBlock, type SyncEvent } from "./chain";
import { revokedFields } from "./issue";

const CHUNK = 5_000; // blocks per eth_getLogs call; public RPCs cap the range
const MAX_CHUNKS = 20; // per call, so one request stays well under the function timeout

type Db = ReturnType<typeof createAdminClient>;

/** First block to read: the one after last_block, never before the contract existed. */
export const startBlock = (lastBlock: number, deployBlock = DEPLOY_BLOCK) => Math.max(lastBlock + 1, deployBlock);

/** Applies one event. Returns false when it was skipped (no database row to mirror into). */
async function apply(db: Db, ev: SyncEvent, txHash: string, blockTime: () => Promise<number>): Promise<boolean> {
  switch (ev.kind) {
    case "issued": {
      // confirm writes the row (title, student, PDF path are not on chain); sync only checks it exists.
      const { data, error } = await db.from("credentials").select("doc_hash").eq("doc_hash", ev.docHash.toLowerCase()).maybeSingle();
      if (error) throw error;
      return !!data;
    }
    case "revoked": {
      const fields = revokedFields({ ...ev, timestamp: await blockTime() }, txHash);
      const { data, error } = await db
        .from("credentials")
        .update(fields)
        .eq("doc_hash", ev.docHash.toLowerCase())
        .select("doc_hash");
      if (error) throw error;
      return data.length > 0;
    }
    case "issuerAdded": {
      const { error } = await db
        .from("issuers")
        .upsert({ wallet: getAddress(ev.wallet), display_name: ev.name, active: true });
      if (error) throw error;
      return true;
    }
    case "issuerRemoved": {
      const { error } = await db.from("issuers").update({ active: false }).eq("wallet", getAddress(ev.wallet));
      if (error) throw error;
      return true;
    }
  }
}

/**
 * Reads logs from sync_state.last_block + 1 up to the latest block in chunks, applies them in
 * order and advances last_block after each chunk. Idempotent: every write sets absolute values.
 */
export async function runSync() {
  const db = createAdminClient();
  const state = await db.from("sync_state").select("last_block").eq("id", 1).single();
  if (state.error) throw state.error;

  const fromBlock = startBlock(Number(state.data.last_block));
  const latest = await getLatestBlock();
  let from = fromBlock;
  let applied = 0;
  let skipped = 0;
  const times = new Map<number, number>();

  for (let i = 0; i < MAX_CHUNKS && from <= latest; i++) {
    const to = Math.min(from + CHUNK - 1, latest);
    for (const log of await getContractLogs(from, to)) {
      const ev = decodeSyncLog(log);
      if (!ev) continue;
      const blockTime = async () => {
        if (!times.has(log.blockNumber)) times.set(log.blockNumber, await getBlockTimestamp(log.blockNumber));
        return times.get(log.blockNumber)!;
      };
      if (await apply(db, ev, log.transactionHash, blockTime)) applied++;
      else {
        skipped++;
        const hash = "docHash" in ev ? ev.docHash : "";
        console.warn(`[sync] ${ev.kind} ${hash} in tx ${log.transactionHash as Hex}: no credentials row, skipped`);
      }
    }
    // .lt: a slower concurrent sync never moves last_block backwards.
    const { error } = await db.from("sync_state").update({ last_block: to }).eq("id", 1).lt("last_block", to);
    if (error) throw error;
    from = to + 1;
  }

  return { fromBlock, toBlock: from - 1, latest, applied, skipped, caughtUp: from > latest };
}
