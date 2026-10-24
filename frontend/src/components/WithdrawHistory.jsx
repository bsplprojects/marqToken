import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fmt } from "@/lib/format";
import { ExternalLink } from "lucide-react";

const LABEL = { pending: "Awaiting approval", under_review: "Under review", approved: "Approved", processing: "Sending",
  sent: "Confirming", completed: "Completed", payout_failed: "Queued", rejected: "Rejected" };
const TONE = { completed: "text-emerald-400 border-emerald-400/30", rejected: "text-rose-400 border-rose-400/30" };

export const WithdrawHistory = () => {
  const { data = [] } = useQuery({ queryKey: ["withdraw-history"], queryFn: async () => (await api.get("/withdraw/history")).data, refetchInterval: 15000 });
  return (
    <div data-testid="withdraw-history" className="glass rounded-2xl border border-white/8 p-6">
      <div className="font-display text-lg font-bold text-white mb-4">My Withdrawals</div>
      {!data.length ? (
        <div data-testid="withdraw-history-empty" className="text-sm text-slate-500 py-8 text-center">No withdrawals yet.</div>
      ) : (
        <div className="space-y-2">
          {data.map((w) => (
            <div key={w.id} data-testid="withdraw-history-row" className="flex flex-wrap items-center gap-3 rounded-xl border border-white/8 bg-white/5 px-4 py-3">
              <span className="font-mono-merq text-xs text-amber-300">{w.id}</span>
              <span className="text-sm text-white">{fmt(w.amount)} MERQ</span>
              <span className="font-mono-merq text-xs text-slate-400">receive {fmt(w.net)} MERQ</span>
              <span className={`rounded-full border px-2 py-0.5 font-mono-merq text-[10px] uppercase tracking-widest ${TONE[w.status] || "text-amber-300 border-amber-400/30"}`}>{LABEL[w.status] || w.status}</span>
              <span className="ml-auto font-mono-merq text-[11px] text-slate-500">{new Date(w.created_at).toLocaleString()}</span>
              {w.bscscan_url && <a href={w.bscscan_url} target="_blank" rel="noreferrer" className="text-amber-400"><ExternalLink className="h-4 w-4" /></a>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
