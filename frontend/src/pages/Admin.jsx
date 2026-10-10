import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fmt, fmtDate } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";
import {
  Users, Coins, Activity, TrendingUp, Save, Loader2, Power, Sliders,
} from "lucide-react";

const NUM_FIELDS = [
  { key: "referral_pct", label: "Referral %" },
  { key: "profit_growth_daily_pct", label: "Growth Daily %" },
  { key: "profit_growth_term_days", label: "Growth Term (days)" },
  { key: "pg_commission_pct", label: "PG Commission %" },
  { key: "pg_commission_min_directs", label: "PG Min Directs" },
  { key: "min_withdraw", label: "Min Withdraw" },
  { key: "withdraw_fee_pct", label: "Withdraw Fee %" },
  { key: "protocol_fee_pct", label: "Protocol Fee %" },
  { key: "daily_withdraw_limit", label: "Daily Withdraw Limit" },
  { key: "withdraw_cooldown_hours", label: "Cooldown (hours)" },
  { key: "autopool_entry", label: "Autopool Entry" },
  { key: "autopool_capacity", label: "Autopool Capacity" },
  { key: "autopool_reward", label: "Autopool Reward" },
  { key: "merq_price_usd", label: "MERQ Price (USD)" },
  { key: "starting_wallet_balance", label: "Demo Start Balance" },
];

export default function Admin() {
  const qc = useQueryClient();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const { data: analytics } = useQuery({ queryKey: ["analytics"], queryFn: async () => (await api.get("/admin/analytics")).data });
  const { data: settings } = useQuery({ queryKey: ["admin-settings"], queryFn: async () => (await api.get("/admin/settings")).data });
  const { data: members } = useQuery({ queryKey: ["admin-members"], queryFn: async () => (await api.get("/admin/members")).data });

  useEffect(() => { if (settings) setForm(settings); }, [settings]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {};
      NUM_FIELDS.forEach((f) => { payload[f.key] = Number(form[f.key]); });
      payload.paused = !!form.paused;
      await api.put("/admin/settings", payload);
      toast.success("Protocol rules updated");
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (address, status) => {
    try {
      await api.post("/admin/member/status", { address, status });
      toast.success("Member status updated");
      qc.invalidateQueries({ queryKey: ["admin-members"] });
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Update failed");
    }
  };

  const stats = [
    { label: "Total Members", value: analytics?.total_members ?? 0, icon: Users, accent: "text-amber-400 bg-amber-400/10" },
    { label: "Active Members", value: analytics?.active_members ?? 0, icon: Activity, accent: "text-emerald-400 bg-emerald-400/10" },
    { label: "TVL (MERQ)", value: fmt(analytics?.tvl, 0), icon: Coins, accent: "text-cyan-400 bg-cyan-400/10" },
    { label: "Income Paid", value: fmt(analytics?.total_income_paid, 0), icon: TrendingUp, accent: "text-violet-400 bg-violet-400/10" },
  ];

  return (
    <div>
      <PageHeader eyebrow="Governance" title="Admin Panel"
        subtitle="Configure protocol rules, monitor the ecosystem, and manage member status." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-2xl border border-white/8 p-5">
            <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${s.accent}`}><s.icon className="h-4 w-4" /></span>
            <div className="font-mono-merq text-2xl font-bold text-white mt-3">{s.value}</div>
            <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* rules */}
        <div className="lg:col-span-7 glass rounded-2xl border border-white/8 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-semibold text-white flex items-center gap-2"><Sliders className="h-5 w-5 text-amber-400" /> Protocol Rules</h3>
            <button
              onClick={() => setForm((f) => ({ ...f, paused: !f.paused }))}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-mono-merq uppercase tracking-widest transition-colors ${
                form.paused ? "bg-rose-500/15 text-rose-300 border border-rose-400/30" : "bg-emerald-500/10 text-emerald-300 border border-emerald-400/20"}`}>
              <Power className="h-3.5 w-3.5" /> {form.paused ? "Paused" : "Live"}
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {NUM_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">{f.label}</label>
                <input
                  data-testid={`admin-field-${f.key}`}
                  type="number" value={form[f.key] ?? ""}
                  onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                  className="mt-1.5 w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 font-mono-merq text-sm text-white focus:border-amber-400/40 outline-none"
                />
              </div>
            ))}
          </div>
          <button data-testid="admin-rule-save-button" disabled={saving} onClick={save}
            className="mt-6 flex items-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold px-6 py-3 transition-colors disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Rules
          </button>
        </div>

        {/* income distribution */}
        <div className="lg:col-span-5 glass rounded-2xl border border-white/8 p-6">
          <h3 className="font-display font-semibold text-white mb-4">Income Distribution</h3>
          <div className="space-y-3">
            {analytics && Object.entries(analytics.income_distribution).map(([k, v]) => {
              const max = Math.max(...Object.values(analytics.income_distribution), 1);
              return (
                <div key={k}>
                  <div className="flex justify-between font-mono-merq text-xs text-slate-400 mb-1">
                    <span className="capitalize">{k.replace("_", " ")}</span><span>{fmt(v, 0)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300" style={{ width: `${(v / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-4 border-t border-white/5 flex justify-between font-mono-merq text-sm">
            <span className="text-slate-500">Total Transactions</span>
            <span className="text-white">{analytics?.total_transactions ?? 0}</span>
          </div>
        </div>
      </div>

      {/* members */}
      <div className="glass rounded-2xl border border-white/8 overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-white/5 font-display font-semibold text-white">Members ({members?.length ?? 0})</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="admin-members-table">
            <thead>
              <tr className="text-left font-mono-merq text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/5">
                <th className="px-6 py-3">Member</th><th className="px-6 py-3">Sponsor</th>
                <th className="px-6 py-3">Rank</th><th className="px-6 py-3 text-right">Principal</th>
                <th className="px-6 py-3 text-right">Team</th><th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {(members || []).map((m) => (
                <tr key={m.address} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-3 font-mono-merq text-slate-200">{m.short}{m.is_admin && <span className="ml-2 text-[9px] text-amber-400">ADMIN</span>}</td>
                  <td className="px-6 py-3 font-mono-merq text-slate-500">{m.sponsor || "—"}</td>
                  <td className="px-6 py-3 text-slate-300">{m.rank}</td>
                  <td className="px-6 py-3 text-right font-mono-merq text-amber-300">{fmt(m.principal, 0)}</td>
                  <td className="px-6 py-3 text-right font-mono-merq text-slate-300">{m.team_count}</td>
                  <td className="px-6 py-3"><span className={`text-xs capitalize ${m.status === "active" ? "text-emerald-400" : m.status === "suspended" ? "text-rose-400" : "text-slate-500"}`}>{m.status}</span></td>
                  <td className="px-6 py-3">
                    <select
                      data-testid={`admin-status-${m.address}`}
                      value={m.status}
                      onChange={(e) => setStatus(m.address, e.target.value)}
                      className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none focus:border-amber-400/40">
                      <option value="active">active</option>
                      <option value="inactive">inactive</option>
                      <option value="suspended">suspended</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
