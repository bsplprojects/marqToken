import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fmt } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { PortBuy } from "@/components/ports/PortBuy";
import { PortHistory } from "@/components/ports/PortHistory";
import { SwapNotice } from "@/components/swap/SwapNotice";
import { Ticket, ArrowRight } from "lucide-react";

const TechPassRequired = () => (
  <div data-testid="port-techpass-required" className="glass gold-glow rounded-3xl border border-amber-400/15 p-8 text-center">
    <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-400 mb-5"><Ticket className="h-7 w-7" /></span>
    <div className="font-display text-xl font-bold text-white">Merq TechPass required</div>
    <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">Activate your Merq TechPass first to unlock Entry Port and Unity Port purchases.</p>
    <Link to="/techpass" data-testid="port-go-techpass" className="inline-flex items-center gap-2 mt-6 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold px-6 py-3 transition-colors">
      Activate TechPass <ArrowRight className="h-4 w-4" />
    </Link>
  </div>
);

export default function Port() {
  const { port: key } = useParams();
  const { member } = useAuth();
  const qc = useQueryClient();
  const { data: s, isLoading } = useQuery({ queryKey: ["ports"], queryFn: async () => (await api.get("/ports/status")).data, refetchInterval: 20000 });
  if (!["entry", "unity"].includes(key)) return <Navigate to="/dashboard" replace />;
  const port = s?.ports?.[key];
  const t = s?.totals?.[key];

  const body = () => {
    if (isLoading || !s) return <SwapNotice state="loading" />;
    if (!s.merq_live) return <SwapNotice state="not_live" />;
    if (!s.techpass_active) return <TechPassRequired />;
    if (!port.enabled) return <SwapNotice state="disabled" />;
    return <PortBuy portKey={key} port={port} status={s} member={member} onDone={() => qc.invalidateQueries({ queryKey: ["ports"] })} />;
  };

  return (
    <div>
      <PageHeader eyebrow="Merq Entry & Unity Port" title={port?.name || (key === "entry" ? "Merq Entry Port" : "Merq Unity Port")}
        subtitle="Enter any USDT amount. We convert it to MERQ at the live price and deduct it from your wallet." />
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[["Purchases", t?.count ?? 0, "port-total-count"], ["Total value", `$${fmt(t?.usd ?? 0)}`, "port-total-usd"], ["MERQ paid", fmt(t?.merq ?? 0, 4), "port-total-merq"]].map(([l, v, id]) => (
          <div key={l} className="glass rounded-2xl border border-white/8 p-4">
            <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">{l}</div>
            <div data-testid={id} className="font-mono-merq text-xl font-bold text-white mt-1">{v}</div>
          </div>
        ))}
      </div>
      <div className="grid xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2">{body()}</div>
        <div className="xl:col-span-3"><PortHistory rows={(s?.history || []).filter((p) => p.port === key)} /></div>
      </div>
    </div>
  );
}
