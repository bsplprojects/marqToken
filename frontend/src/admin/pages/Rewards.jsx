import { useState, useEffect } from "react";
import { adminApi } from "../adminApi";
import { useAdminAuth } from "../AdminAuth";
import { useAdminData, AHeader, Panel, Table, KCard, Btn, Empty, fmt, dt } from "../ui";
import { toast } from "sonner";
import { Save, Plus, Trash2 } from "lucide-react";

export default function Rewards() {
  const { can } = useAdminAuth();
  const { data } = useAdminData("adm-rewards", "/rewards");
  const [tiers, setTiers] = useState([]);
  const canEdit = can("rewards", true);

  useEffect(() => { if (data?.tiers) setTiers(data.tiers); }, [data]);

  const upd = (i, k, v) => setTiers((t) => t.map((x, idx) => idx === i ? { ...x, [k]: ["reward", "threshold"].includes(k) ? Number(v) : v } : x));
  const add = () => setTiers((t) => [...t, { key: `custom_${Date.now()}`, title: "New Reward", metric: "team_volume", threshold: 1000, reward: 100, icon: "award" }]);
  const remove = (i) => setTiers((t) => t.filter((_, idx) => idx !== i));
  const save = async () => {
    try { await adminApi.put("/rewards/config", { tiers }); toast.success("Rewards config saved (new rule version)"); }
    catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  const metrics = ["deposit_count", "direct_count", "team_count", "team_volume"];

  return (
    <div>
      <AHeader title="Rewards Management" subtitle="Achievement-based rewards. Saving creates a new rule version.">
        {canEdit && <Btn testid="rewards-save" onClick={save}><Save className="h-4 w-4" /> Save Config</Btn>}
      </AHeader>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        <KCard label="Total Distributed" value={fmt(data?.total_distributed, 0)} accent="violet" />
        <KCard label="Claim Count" value={data?.claim_count ?? 0} accent="amber" />
        <KCard label="Active Tiers" value={tiers.length} accent="emerald" />
      </div>

      <Panel title="Reward Tiers" className="p-5 mb-5">
        <div className="space-y-3">
          {tiers.map((t, i) => (
            <div key={i} className="grid sm:grid-cols-12 gap-2 items-center rounded-xl border border-white/8 bg-white/5 p-3" data-testid={`reward-tier-${t.key}`}>
              <input disabled={!canEdit} value={t.title} onChange={(e) => upd(i, "title", e.target.value)}
                className="sm:col-span-4 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-amber-400/40" />
              <select disabled={!canEdit} value={t.metric} onChange={(e) => upd(i, "metric", e.target.value)}
                className="sm:col-span-3 bg-slate-900 border border-white/10 rounded-lg px-2 py-2 text-sm text-slate-200 outline-none">
                {metrics.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <input disabled={!canEdit} type="number" value={t.threshold} onChange={(e) => upd(i, "threshold", e.target.value)} placeholder="threshold"
                className="sm:col-span-2 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 font-mono-merq text-sm text-white outline-none" />
              <input disabled={!canEdit} type="number" value={t.reward} onChange={(e) => upd(i, "reward", e.target.value)} placeholder="reward"
                className="sm:col-span-2 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 font-mono-merq text-sm text-amber-300 outline-none" />
              {canEdit && <button onClick={() => remove(i)} className="text-rose-400 hover:text-rose-300 sm:col-span-1"><Trash2 className="h-4 w-4" /></button>}
            </div>
          ))}
          {canEdit && <Btn variant="ghost" onClick={add}><Plus className="h-4 w-4" /> Add Tier</Btn>}
        </div>
      </Panel>

      <Panel title="Recent Claims">
        {data?.claims?.length ? (
          <Table columns={[{ label: "Member" }, { label: "Achievement" }, { label: "Amount", right: true }, { label: "Date" }]}>
            {data.claims.map((c, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-5 py-2.5 font-mono-merq text-slate-300">{c.member}</td>
                <td className="px-5 py-2.5 text-slate-300">{c.achievement || "—"}</td>
                <td className="px-5 py-2.5 text-right font-mono-merq text-amber-300">+{fmt(c.amount)}</td>
                <td className="px-5 py-2.5 text-slate-500 text-xs">{dt(c.created_at)}</td>
              </tr>
            ))}
          </Table>
        ) : <Empty text="No claims yet." />}
      </Panel>
    </div>
  );
}
