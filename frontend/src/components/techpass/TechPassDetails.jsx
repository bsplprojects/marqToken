import { CheckCircle2, Clock, ExternalLink, Ticket } from "lucide-react";
import { fmt } from "@/lib/format";

export const TechPassDetails = ({ p }) => {
  const confirmed = p.status === "confirmed";
  const rows = [
    ["Pass ID", p.id], ["Paid", `${fmt(p.merq_amount, 6)} MERQ`], ["Value", `$${fmt(p.price_usd)}`],
    ["MERQ price used", `$${Number(p.merq_price).toFixed(6)}`],
    ["Purchased", new Date(p.created_at).toLocaleString()],
  ];
  return (
    <div data-testid="techpass-details" className="glass gold-glow rounded-3xl border border-amber-400/20 p-7 relative overflow-hidden">
      <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl" />
      <div className="relative flex items-center gap-3 mb-6">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/15 text-amber-400"><Ticket className="h-6 w-6" /></span>
        <div>
          <div className="font-display text-xl font-black text-white">Merq <span className="gold-text">TechPass</span></div>
          <div data-testid="techpass-status" className={`flex items-center gap-1.5 text-xs mt-0.5 ${confirmed ? "text-emerald-400" : "text-amber-300"}`}>
            {confirmed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
            {confirmed ? "Active" : "Payment confirming on-chain…"}
          </div>
        </div>
      </div>
      <div className="relative space-y-2.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-3 text-sm">
            <span className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">{k}</span>
            <span className="font-mono-merq text-slate-200 text-right">{v}</span>
          </div>
        ))}
        <a href={p.bscscan_url} target="_blank" rel="noreferrer" data-testid="techpass-bscscan-link"
          className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 pt-2">
          View payment on BscScan <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
};
