import { useState } from "react";
import { ExternalLink, Lock, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { fmt } from "@/lib/format";

const TONE = { confirmed: "text-emerald-400 border-emerald-400/30", pending: "text-amber-300 border-amber-400/30" };

const Principal = ({ p, onChange }) => {
  const [busy, setBusy] = useState(false);
  if (p.status !== "confirmed" || !p.principal_status) return null;
  if (p.principal_status === "withdrawn") return <span className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">Principal returned</span>;
  if (!p.can_withdraw_principal) return <span className="inline-flex items-center gap-1 text-[11px] text-slate-400"><Lock className="h-3 w-3" /> until {p.lock_until?.slice(0, 10)}</span>;
  const go = async () => {
    if (!window.confirm(`Withdraw $${fmt(p.amount_usd)} principal? Daily earnings on this purchase will stop.`)) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/ports/principal/${p.id}/withdraw`);
      toast.success(`${fmt(data.merq, 4)} MERQ added to your withdrawable balance`);
      onChange?.();
    } catch (e) { toast.error(e?.response?.data?.detail || "Could not withdraw principal"); }
    setBusy(false);
  };
  return (
    <button data-testid={`port-principal-withdraw-${p.id}`} disabled={busy} onClick={go}
      className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 px-3 py-1 text-[11px] text-amber-300 hover:bg-amber-400/10 transition-colors disabled:opacity-50">
      <Undo2 className="h-3 w-3" /> Withdraw principal
    </button>
  );
};

export const PortHistory = ({ rows, onChange }) => (
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
            {p.daily_pct != null && <span className="font-mono-merq text-[11px] text-emerald-300">{fmt(p.daily_pct)}%/day · earned ${fmt(p.earned_usd)}</span>}
            <Principal p={p} onChange={onChange} />
            <span className="ml-auto font-mono-merq text-[11px] text-slate-500">{new Date(p.created_at).toLocaleString()}</span>
            <a href={p.bscscan_url} target="_blank" rel="noreferrer" className="text-amber-400"><ExternalLink className="h-4 w-4" /></a>
          </div>
        ))}
      </div>
    )}
  </div>
);
