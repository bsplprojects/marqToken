import { ExternalLink } from "lucide-react";
import { fmt } from "@/lib/format";

const TONE = { confirmed: "text-emerald-400 border-emerald-400/30", pending: "text-amber-300 border-amber-400/30" };

export const PortHistory = ({ rows }) => (
  <div data-testid="port-history" className="glass rounded-3xl border border-white/8 p-6">
    <div className="font-display text-lg font-bold text-white mb-4">My Purchases</div>
    {!rows.length ? (
      <div data-testid="port-history-empty" className="text-sm text-slate-500 py-10 text-center">No purchases yet.</div>
    ) : (
      <div className="space-y-2">
        {rows.map((p) => (
          <div key={p.id} data-testid="port-history-row" className="flex flex-wrap items-center gap-3 rounded-xl border border-white/8 bg-white/5 px-4 py-3">
            <span className="font-mono-merq text-xs text-amber-300">{p.id}</span>
            <span className="text-sm text-white font-medium">${fmt(p.amount_usd)}</span>
            <span className="font-mono-merq text-xs text-slate-400">{fmt(p.merq_amount, 4)} MERQ</span>
            <span className={`rounded-full border px-2 py-0.5 font-mono-merq text-[10px] uppercase tracking-widest ${TONE[p.status] || "text-rose-400 border-rose-400/30"}`}>{p.status}</span>
            <span className="ml-auto font-mono-merq text-[11px] text-slate-500">{new Date(p.created_at).toLocaleString()}</span>
            <a href={p.bscscan_url} target="_blank" rel="noreferrer" className="text-amber-400"><ExternalLink className="h-4 w-4" /></a>
          </div>
        ))}
      </div>
    )}
  </div>
);
