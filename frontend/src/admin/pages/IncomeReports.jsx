import { useState } from "react";
import { ADMIN_API } from "../adminApi";
import { useAdminData, AHeader, Panel, Btn, Table, KCard, Empty, fmt, dt } from "../ui";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";

export const STREAM_LABEL = {
  tp_partner_onboarding: "TechPass · Partner Onboarding", tp_momentum_booster: "TechPass · Momentum Booster",
  tp_global_momentum: "TechPass · Global Momentum", port_daily_earnings: "Port · Daily Earnings",
  port_partner_onboarding_rewards: "Port · Partner Onboarding", port_level_income: "Port · Level Income",
  port_rank_rewards: "Port · Rank Rewards",
};
const inp = "bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-amber-400/40";

export default function IncomeReports() {
  const [fl, setFl] = useState({ stream: "", q: "", start: "", end: "" });
  const [page, setPage] = useState(1);
  const qs = new URLSearchParams(Object.entries(fl).filter(([, v]) => v)).toString();
  const { data } = useAdminData(["adm-income-report", qs, page], `/income-report?${qs}&page=${page}`);
  const set = (k, v) => { setFl({ ...fl, [k]: v }); setPage(1); };
  const exportCsv = () => {
    fetch(`${ADMIN_API}/income-report/export?${qs}`, { headers: { Authorization: `Bearer ${localStorage.getItem("merqon_admin_jwt")}` } })
      .then((r) => r.blob()).then((b) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(b); a.download = "merqon_income_report.csv"; a.click();
      });
  };
  const totalUsd = data ? Object.values(data.summary).reduce((s, v) => s + v.usd, 0) : 0;

  return (
    <div>
      <AHeader title="Income Reports" subtitle="Every income paid across Merq TechPass and Entry & Unity Ports.">
        <Btn testid="income-report-export" variant="ghost" onClick={exportCsv}><Download className="h-4 w-4" /> Export CSV</Btn>
      </AHeader>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KCard testid="income-report-total" label="Total paid (filtered)" value={`$${fmt(totalUsd)}`} sub={`${data?.total ?? 0} payouts`} accent="amber" />
        {data && data.streams.map((k) => (
          <button key={k} data-testid={`income-report-card-${k}`} onClick={() => set("stream", fl.stream === k ? "" : k)} className={`text-left rounded-2xl ${fl.stream === k ? "ring-1 ring-amber-400/60" : ""}`}>
            <KCard label={STREAM_LABEL[k]} value={`$${fmt(data.summary[k].usd)}`} sub={`${fmt(data.summary[k].merq, 2)} MERQ · ${data.summary[k].earners} earners`} accent={k.startsWith("tp_") ? "cyan" : "emerald"} />
          </button>
        ))}
      </div>
      <Panel testid="income-report-panel">
        <div className="flex flex-wrap gap-2 p-4 border-b border-white/5">
          <select data-testid="income-report-stream" value={fl.stream} onChange={(e) => set("stream", e.target.value)} className={inp}>
            <option value="">All incomes</option>
            {Object.entries(STREAM_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <input data-testid="income-report-search" placeholder="Search wallet…" value={fl.q} onChange={(e) => set("q", e.target.value)} className={`${inp} flex-1 min-w-[180px]`} />
          <input data-testid="income-report-start" type="date" value={fl.start} onChange={(e) => set("start", e.target.value)} className={inp} />
          <input data-testid="income-report-end" type="date" value={fl.end} onChange={(e) => set("end", e.target.value)} className={inp} />
        </div>
        {data?.rows.length ? (
          <Table testid="income-report-table" columns={[{ label: "Wallet" }, { label: "Income" }, { label: "USD", right: true }, { label: "MERQ", right: true }, { label: "From" }, { label: "Detail" }, { label: "Date" }]}>
            {data.rows.map((t) => (
              <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-5 py-2.5 font-mono-merq text-xs text-slate-400">{t.address.slice(0, 8)}…{t.address.slice(-4)}</td>
                <td className="px-5 py-2.5 text-slate-200">{STREAM_LABEL[t.type]}</td>
                <td className="px-5 py-2.5 text-right font-mono-merq text-slate-200">${fmt(t.usd ?? 0, 4)}</td>
                <td className="px-5 py-2.5 text-right font-mono-merq text-amber-300">{fmt(t.merq, 4)}</td>
                <td className="px-5 py-2.5 font-mono-merq text-xs text-slate-500">{t.from ? `${t.from.slice(0, 6)}…${t.from.slice(-4)}` : "—"}</td>
                <td className="px-5 py-2.5 text-xs text-slate-400">{t.detail || "—"}</td>
                <td className="px-5 py-2.5 text-xs text-slate-500">{dt(t.created_at)}</td>
              </tr>
            ))}
          </Table>
        ) : <Empty text="No income payouts match these filters." />}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-end gap-2 p-3 text-xs text-slate-400">
            <button data-testid="income-report-prev" disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-1 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
            <span data-testid="income-report-page">Page {page} / {data.pages}</span>
            <button data-testid="income-report-next" disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="p-1 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
          </div>
        )}
      </Panel>
    </div>
  );
}
