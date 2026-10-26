import { useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fmt } from "@/lib/format";
import { findStream } from "@/lib/incomes";
import { PageHeader } from "@/components/PageHeader";
import { MbBoards } from "@/components/MbBoards";
import { PortIncomeInfo } from "@/components/PortIncomeInfo";
import { Clock, ExternalLink } from "lucide-react";

export default function IncomeStream() {
  const { slug } = useParams();
  const found = findStream(slug);
  const { data } = useQuery({
    queryKey: ["income-stream", found?.item.key],
    queryFn: async () => (await api.get(`/income/stream/${found.item.key}`)).data,
    enabled: !!found,
  });
  if (!found) return <Navigate to="/dashboard" replace />;
  const { group, item } = found;
  const Icon = item.icon;

  return (
    <div>
      <PageHeader eyebrow={group.label} title={item.label} subtitle={item.desc} />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass gold-glow rounded-3xl border border-amber-400/15 p-7">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400 mb-5"><Icon className="h-6 w-6" /></span>
          <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">Total earned</div>
          <div data-testid="income-stream-total" className="font-mono-merq text-4xl font-black gold-text mt-1">{fmt(data?.total ?? 0)}</div>
          <div className="text-sm text-slate-500 mt-1">MERQ</div>
          <div data-testid="income-stream-total-usd" className="font-mono-merq text-lg text-slate-300 mt-3">${fmt(data?.total_usd ?? 0)} <span className="text-xs text-slate-500">earned value</span></div>
          {data && !data.rules_configured && (
            <div data-testid="income-stream-pending" className="flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 mt-6 text-xs text-amber-200 leading-relaxed">
              <Clock className="h-4 w-4 flex-shrink-0" /> Earning rules for this income are being finalised. Earnings will appear here once it goes live.
            </div>
          )}
        </div>
        <div className="lg:col-span-2 glass rounded-3xl border border-white/8 p-6">
          <div className="font-display text-lg font-bold text-white mb-4">Earnings History</div>
          {!data?.history?.length ? (
            <div data-testid="income-stream-empty" className="text-sm text-slate-500 py-14 text-center">No {item.label.toLowerCase()} earnings yet.</div>
          ) : (
            <div className="space-y-2">
              {data.history.map((h) => (
                <div key={h.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 px-4 py-3">
                  <span className="font-mono-merq text-emerald-400 font-semibold">+{fmt(h.amount)} MERQ</span>
                  {h.usd != null && <span className="font-mono-merq text-xs text-slate-300">${fmt(h.usd)}</span>}
                  {(h.board || h.level || h.rank || h.port) && <span className="rounded-full border border-amber-400/25 px-2 py-0.5 font-mono-merq text-[10px] uppercase text-amber-300">{h.board || h.rank || (h.level ? `Level ${h.level}` : `${h.port} port`)}</span>}
                  {h.from && <span className="font-mono-merq text-[11px] text-slate-500">from {h.from.slice(0, 6)}…{h.from.slice(-4)}</span>}
                  <span className="ml-auto font-mono-merq text-[11px] text-slate-500">{new Date(h.created_at).toLocaleString()}</span>
                  {h.bscscan_url && <a href={h.bscscan_url} target="_blank" rel="noreferrer" className="text-amber-400"><ExternalLink className="h-4 w-4" /></a>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {data?.boards && <MbBoards boards={data.boards} />}
      {data?.port_info && <PortIncomeInfo info={data.port_info} stream={item.key} />}
    </div>
  );
}
