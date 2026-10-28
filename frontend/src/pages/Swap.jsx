import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { SwapForm } from "@/components/swap/SwapForm";
import { SwapHistory } from "@/components/swap/SwapHistory";
import { SwapNotice } from "@/components/swap/SwapNotice";
import { loadMarket, getBalances } from "@/lib/swap";

export default function Swap() {
  const { member } = useAuth();
  const qc = useQueryClient();
  const { data: cfg, isLoading } = useQuery({ queryKey: ["swap-config"], queryFn: async () => (await api.get("/swap/config")).data });
  const [market, setMarket] = useState(null);
  const [marketErr, setMarketErr] = useState(false);
  const [balances, setBalances] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!cfg?.live) return;
    let live = true;
    loadMarket(cfg).then((m) => { if (live) { setMarket(m); setMarketErr(false); } }).catch(() => live && setMarketErr(true));
    return () => { live = false; };
  }, [cfg, tick]);

  useEffect(() => {
    if (!market?.dec || !member?.address) return;
    getBalances(cfg, member.address, market.dec).then(setBalances).catch(() => {});
  }, [market, member, cfg]);

  const refresh = () => { setTick((t) => t + 1); qc.invalidateQueries({ queryKey: ["swap-history"] }); };
  const state = useMemo(() => {
    if (isLoading) return "loading";
    if (!cfg?.enabled) return "disabled";
    if (!cfg?.merq_token_address) return "not_live";
    if (marketErr) return "error";
    if (!market) return "loading";
    if (!market.pair) return "no_pool";
    return "ready";
  }, [cfg, market, marketErr, isLoading]);

  return (
    <div>
      <PageHeader eyebrow="On-chain · PancakeSwap" title="Swap" subtitle="Swap BNB and MERQ directly from your wallet on BNB Smart Chain." />
      <div className="grid xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2">
          {state === "ready" ? (
            <SwapForm cfg={cfg} market={market} balances={balances} member={member} onDone={refresh} />
          ) : (
            <SwapNotice state={state} onRetry={refresh} />
          )}
        </div>
        <div className="xl:col-span-3"><SwapHistory /></div>
      </div>
    </div>
  );
}
