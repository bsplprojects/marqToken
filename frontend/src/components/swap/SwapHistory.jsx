import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ExternalLink, ArrowRight } from "lucide-react";

const TONE = { confirmed: "text-emerald-400 border-emerald-400/30", pending: "text-amber-300 border-amber-400/30", failed: "text-rose-400 border-rose-400/30" };

export const SwapHistory = () => {
  const { data = [] } = useQuery({ queryKey: ["swap-history"], queryFn: async () => (await api.get("/swap/history")).data, refetchInterval: 20000 });
  return (
    <div data-testid="swap-history" className="glass rounded-3xl border border-white/8 p-6">
      <div className="font-display text-lg font-bold text-white mb-4">My Swaps</div>
      {!data.length ? (
        <div data-testid="swap-history-empty" className="text-sm text-slate-500 py-10 text-center">No swaps yet. Your completed swaps will appear here.</div>
      ) : (
        <div className="space-y-2">
          {data.map((s) => {
            const [a, b] = s.direction.split("_TO_");
            return (
              <div key={s.tx_hash} data-testid="swap-history-row" className="flex flex-wrap items-center gap-3 rounded-xl border border-white/8 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-white font-medium">
                  {s.amount_in.toLocaleString()} {a} <ArrowRight className="h-3.5 w-3.5 text-amber-400" /> ~{s.amount_out_est.toLocaleString(undefined, { maximumFractionDigits: 4 })} {b}
                </div>
                <span className={`rounded-full border px-2 py-0.5 font-mono-merq text-[10px] uppercase tracking-widest ${TONE[s.status]}`}>{s.status}</span>
                <span className="ml-auto font-mono-merq text-[11px] text-slate-500">{new Date(s.created_at).toLocaleString()}</span>
                <a href={s.bscscan_url} target="_blank" rel="noreferrer" data-testid="swap-bscscan-link" className="text-amber-400 hover:text-amber-300"><ExternalLink className="h-4 w-4" /></a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
