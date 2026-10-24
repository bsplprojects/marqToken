import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fmt } from "@/lib/format";
import { Ticket, CheckCircle2, Clock, ArrowRight } from "lucide-react";

export const TechPassCard = () => {
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ["techpass"], queryFn: async () => (await api.get("/techpass/status")).data });
  const p = data?.purchase;
  return (
    <button data-testid="dashboard-techpass-card" onClick={() => navigate("/techpass")}
      className="w-full text-left glass card-hover rounded-2xl border border-amber-400/20 p-5 mt-6 flex flex-wrap items-center gap-4">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/15 text-amber-400"><Ticket className="h-5 w-5" /></span>
      <div className="flex-1 min-w-[200px]">
        <div className="font-display font-bold text-white">Merq TechPass</div>
        {p ? (
          <div className={`flex items-center gap-1.5 text-xs mt-0.5 ${p.status === "confirmed" ? "text-emerald-400" : "text-amber-300"}`}>
            {p.status === "confirmed" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
            {p.status === "confirmed" ? "Active" : "Confirming"} · {fmt(p.merq_amount, 4)} MERQ paid (${fmt(p.price_usd, 0)}) · {p.id}
          </div>
        ) : (
          <div className="text-xs text-slate-500 mt-0.5">Not activated · start with ${fmt(data?.price_usd ?? 120, 0)} paid in MERQ</div>
        )}
      </div>
      <span className={`flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold ${p ? "border border-white/10 text-slate-300" : "bg-amber-400 text-slate-950"}`}>
        {p ? "View details" : "Activate"} <ArrowRight className="h-4 w-4" />
      </span>
    </button>
  );
};
