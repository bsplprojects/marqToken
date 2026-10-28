import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../adminApi";
import { useAdminAuth } from "../AdminAuth";
import { useAdminData, AHeader, Panel, Btn, Table, KCard, Empty, fmt, dt } from "../ui";
import { toast } from "sonner";
import { Save, RotateCcw, Play, Plus, Trash2 } from "lucide-react";

const cell = "w-full bg-slate-900 border border-white/10 rounded-md px-2 py-1.5 font-mono-merq text-xs text-white outline-none focus:border-amber-400/40";
const LABEL = { port_daily_earnings: "Daily Earnings", port_partner_onboarding_rewards: "Partner Onboarding (Unity)", port_level_income: "Level Income", port_rank_rewards: "Rank Rewards" };

const Field = ({ label, value, onChange, disabled, testid }) => (
  <div>
    <label className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">{label}</label>
    <input data-testid={testid} type="number" step="any" disabled={disabled} value={value} onChange={(e) => onChange(e.target.value)} className={`${cell} mt-1 text-sm py-2`} />
  </div>
);

const Tiers = ({ f, setF, canEdit }) => {
  const set = (i, k, v) => setF({ ...f, unity_tiers: f.unity_tiers.map((t, j) => (j === i ? { ...t, [k]: v } : t)) });
  return (
    <div className="space-y-2">
      <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">Unity daily rate by amount</div>
      {f.unity_tiers.map((t, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-slate-500 w-10">From $</span>
          <input data-testid={`rule-unity-tier-${i}-min`} type="number" disabled={!canEdit} value={t.min_usd} onChange={(e) => set(i, "min_usd", e.target.value)} className={cell} />
          <input data-testid={`rule-unity-tier-${i}-pct`} type="number" step="any" disabled={!canEdit} value={t.daily_pct} onChange={(e) => set(i, "daily_pct", e.target.value)} className={cell} />
          <span className="text-xs text-slate-500">%/day</span>
          {canEdit && f.unity_tiers.length > 1 && <button data-testid={`rule-unity-tier-${i}-remove`} onClick={() => setF({ ...f, unity_tiers: f.unity_tiers.filter((_, j) => j !== i) })} className="text-rose-400 p-1"><Trash2 className="h-3.5 w-3.5" /></button>}
        </div>
      ))}
      {canEdit && <button data-testid="rule-unity-tier-add" onClick={() => setF({ ...f, unity_tiers: [...f.unity_tiers, { min_usd: 0, daily_pct: 0.5 }] })} className="inline-flex items-center gap-1 text-xs text-amber-300"><Plus className="h-3 w-3" /> Add tier</button>}
    </div>
  );
};

const RankTable = ({ f, setF, canEdit }) => {
  const set = (i, k, v) => setF({ ...f, ranks: f.ranks.map((r, j) => (j === i ? { ...r, [k]: v } : r)) });
  return (
    <Table columns={[{ label: "Rank" }, { label: "Each of 2 legs $" }, { label: "Needs rank" }, { label: "Needs count" }, { label: "Reward %" }, { label: "One-time $", right: true }]}>
      {f.ranks.map((r, i) => (
        <tr key={i} className="border-b border-white/5">
          <td className="px-4 py-2 font-display font-bold text-amber-300">{r.name}</td>
          <td className="px-2 py-2"><input data-testid={`rule-rank-${i}-leg`} type="number" disabled={!canEdit} value={r.leg_usd} onChange={(e) => set(i, "leg_usd", e.target.value)} className={cell} /></td>
          <td className="px-2 py-2">
            <select data-testid={`rule-rank-${i}-need-rank`} disabled={!canEdit} value={r.need_rank} onChange={(e) => set(i, "need_rank", e.target.value)} className={cell}>
              <option value={0}>None</option>
              {f.ranks.slice(0, i).map((x, j) => <option key={j} value={j + 1}>{x.name}</option>)}
            </select>
          </td>
          <td className="px-2 py-2"><input data-testid={`rule-rank-${i}-need-count`} type="number" disabled={!canEdit} value={r.need_count} onChange={(e) => set(i, "need_count", e.target.value)} className={cell} /></td>
          <td className="px-2 py-2"><input data-testid={`rule-rank-${i}-pct`} type="number" step="any" disabled={!canEdit} value={r.pct} onChange={(e) => set(i, "pct", e.target.value)} className={cell} /></td>
          <td className="px-4 py-2 text-right font-mono-merq text-xs text-slate-300">${fmt((r.leg_usd * r.pct) / 100, 0)}</td>
        </tr>
      ))}
    </Table>
  );
};

export default function PortIncomeRules() {
  const { can } = useAdminAuth();
  const qc = useQueryClient();
  const { data } = useAdminData("adm-port-rules", "/port-income-rules");
  const [f, setF] = useState(null);
  const canEdit = can("settings", true);
  useEffect(() => { if (data && !f) setF(JSON.parse(JSON.stringify(data.rules))); }, [data, f]);
  if (!f) return null;

  const save = async () => {
    try {
      await adminApi.put("/port-income-rules", f);
      toast.success("Income rules saved");
      qc.invalidateQueries({ queryKey: ["adm-port-rules"] });
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed to save"); }
  };
  const accrue = async () => {
    try {
      const { data: r } = await adminApi.post("/port-income/accrue");
      toast.success(`Daily earnings run: ${r.credited} purchase(s) credited`);
      qc.invalidateQueries({ queryKey: ["adm-port-rules"] });
    } catch (e) { toast.error(e?.response?.data?.detail || "Run failed"); }
  };

  return (
    <div>
      <AHeader title="Income Rules" subtitle="Entry & Unity Port: daily earnings, Partner Onboarding (Unity only), Level Income and Rank Rewards. USD amounts credited as MERQ at the live price.">
        {canEdit && <Btn testid="port-rules-accrue" variant="ghost" onClick={accrue}><Play className="h-4 w-4" /> Run daily earnings now</Btn>}
        {canEdit && <Btn testid="port-rules-reset" variant="ghost" onClick={() => setF(JSON.parse(JSON.stringify(data.defaults)))}><RotateCcw className="h-4 w-4" /> Chart defaults</Btn>}
        {canEdit && <Btn testid="port-rules-save" onClick={save}><Save className="h-4 w-4" /> Save</Btn>}
      </AHeader>
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-5">
        {Object.entries(data.totals).map(([k, v]) => <KCard key={k} testid={`port-total-${k}`} label={LABEL[k]} value={`$${fmt(v.usd)}`} accent="amber" />)}
        <KCard testid="port-active-principal" label="Active purchases" value={data.active_principal} sub={`Last run ${dt(data.last_accrual)}`} accent="cyan" />
        <KCard testid="port-level-skipped" label="Level skipped (unqualified)" value={`$${fmt(data.level_skipped_usd)}`} accent="rose" />
      </div>
      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        <Panel title="Entry Port (Stake)" className="p-5 space-y-3">
          <Field testid="rule-entry-daily" label="Daily rate %" value={f.entry_daily_pct} disabled={!canEdit} onChange={(v) => setF({ ...f, entry_daily_pct: v })} />
          <p className="text-xs text-slate-500">No locking — principal can be withdrawn anytime.</p>
        </Panel>
        <Panel title="Unity Port (Bond)" className="p-5 space-y-3">
          <Tiers f={f} setF={setF} canEdit={canEdit} />
          <Field testid="rule-unity-lock" label="Locking period (days)" value={f.unity_lock_days} disabled={!canEdit} onChange={(v) => setF({ ...f, unity_lock_days: v })} />
          <Field testid="rule-sponsor-pct" label="Instant sponsor reward %" value={f.sponsor_pct} disabled={!canEdit} onChange={(v) => setF({ ...f, sponsor_pct: v })} />
        </Panel>
        <Panel title="Level Income (on team daily earnings)" className="p-5">
          <div className="grid grid-cols-4 gap-2">
            {f.level_pcts.map((p, i) => (
              <Field key={i} testid={`rule-level-${i + 1}`} label={`L${i + 1} %`} value={p} disabled={!canEdit} onChange={(v) => setF({ ...f, level_pcts: f.level_pcts.map((x, j) => (j === i ? v : x)) })} />
            ))}
          </div>
          <div className="mt-3"><Field testid="rule-level-min-self" label="Own port purchase needed to unlock all levels $" value={f.level_min_self_usd} disabled={!canEdit} onChange={(v) => setF({ ...f, level_min_self_usd: v })} /></div>
        </Panel>
      </div>
      <Panel title="Rank Rewards (one-time bonus = reward % × leg target)" className="mb-5">
        <RankTable f={f} setF={setF} canEdit={canEdit} />
        <p className="px-5 py-3 text-xs text-slate-500">A member qualifies when their two strongest direct legs each reach the target team business (Entry + Unity purchases) and their team has the required ranked members.</p>
      </Panel>
      <Panel title="Rank Achievements">
        {data.rank_awards.length ? (
          <Table columns={[{ label: "Wallet" }, { label: "Rank" }, { label: "Reward", right: true }, { label: "Date" }]}>
            {data.rank_awards.map((a) => (
              <tr key={a.id} className="border-b border-white/5">
                <td className="px-5 py-2.5 font-mono-merq text-xs text-slate-400">{a.member.slice(0, 8)}…{a.member.slice(-4)}</td>
                <td className="px-5 py-2.5 font-display font-bold text-amber-300">{a.rank}</td>
                <td className="px-5 py-2.5 text-right font-mono-merq text-slate-200">${fmt(a.usd)}</td>
                <td className="px-5 py-2.5 text-xs text-slate-500">{dt(a.created_at)}</td>
              </tr>
            ))}
          </Table>
        ) : <Empty text="No ranks achieved yet." />}
      </Panel>
    </div>
  );
}
