import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { api } from "@/lib/api";
import { fmt, fmtDateTime, INCOME_META } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { ExternalLink, TrendingUp, Filter } from "lucide-react";

export default function Income() {
  const [filter, setFilter] = useState("all");
  const { data: summary } = useQuery({ queryKey: ["income-summary"], queryFn: async () => (await api.get("/income/summary")).data });
  const { data: history } = useQuery({ queryKey: ["income-history"], queryFn: async () => (await api.get("/income/history")).data });

  const breakdown = summary?.breakdown || {};
  const pie = Object.entries(breakdown)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: INCOME_META[k]?.label || k, value: v, color: INCOME_META[k]?.color || "#64748B" }));

  const rows = (history || []).filter((h) => filter === "all" || h.type === filter);
  const types = ["all", "referral", "profit_growth", "pg_commission", "reward", "autopool"];

  return (
    <div>
      <PageHeader eyebrow="Earnings" title="Income"
        subtitle="A transparent breakdown of every income stream, each entry linked to its on-chain reference." />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* total + chart */}
        <div className="lg:col-span-5 glass rounded-2xl border border-amber-400/15 p-6 flex items-center gap-6">
          <div className="relative h-36 w-36 flex-shrink-0">
            {pie.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pie} dataKey="value" innerRadius={45} outerRadius={68} paddingAngle={3} stroke="none">
                    {pie.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full rounded-full border-4 border-dashed border-white/10" />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">Total Earned</div>
            <div className="font-mono-merq text-3xl font-black gold-text mt-1">{fmt(summary?.total_earned)}</div>
            <div className="font-mono-merq text-xs text-slate-500">MERQ</div>
          </div>
        </div>

        {/* breakdown list */}
        <div className="lg:col-span-7 glass rounded-2xl border border-white/8 p-6">
          <div className="grid sm:grid-cols-2 gap-3">
            {Object.entries(breakdown).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/5 px-4 py-3">
                <span className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: INCOME_META[k]?.color }} />
                  {INCOME_META[k]?.label}
                </span>
                <span className="font-mono-merq text-sm font-semibold text-white">{fmt(v)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* history */}
      <div className="glass rounded-2xl border border-white/8 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-white/5">
          <h3 className="font-display font-semibold text-white">Income History</h3>
          <div className="ml-auto flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <select
              data-testid="income-filter-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 font-mono-merq focus:border-amber-400/40 outline-none"
            >
              {types.map((t) => <option key={t} value={t}>{t === "all" ? "All Types" : INCOME_META[t]?.label}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="income-table">
            <thead>
              <tr className="text-left font-mono-merq text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/5">
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Tx</th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? rows.map((h) => (
                <tr key={h.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-3 text-slate-500">{fmtDateTime(h.created_at)}</td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center gap-2 text-slate-200">
                      <span className="h-2 w-2 rounded-full" style={{ background: INCOME_META[h.type]?.color }} />
                      {INCOME_META[h.type]?.label || h.type}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right font-mono-merq text-emerald-400">+{fmt(h.amount)}</td>
                  <td className="px-6 py-3"><span className="text-emerald-400 text-xs capitalize">{h.status}</span></td>
                  <td className="px-6 py-3 text-right">
                    <a data-testid="bscscan-link-button" href={h.bscscan_url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300">
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm">No income records yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
