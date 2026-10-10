import { useState, useEffect } from "react";
import { adminApi } from "../adminApi";
import { useAdminAuth } from "../AdminAuth";
import { useAdminData, AHeader, Panel, Btn, fmt } from "../ui";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";

export default function Ranks() {
  const { can } = useAdminAuth();
  const { data } = useAdminData("adm-ranks", "/ranks");
  const [tiers, setTiers] = useState([]);
  const canEdit = can("ranks", true);

  useEffect(() => { if (data?.tiers) setTiers(data.tiers); }, [data]);

  const update = (i, key, val) => setTiers((t) => t.map((x, idx) => idx === i ? { ...x, [key]: key === "name" ? val : Number(val) } : x));
  const add = () => setTiers((t) => [...t, { name: "New Rank", min_team_volume: 0 }]);
  const remove = (i) => setTiers((t) => t.filter((_, idx) => idx !== i));

  const save = async () => {
    try { await adminApi.put("/ranks", { tiers }); toast.success("Ranks updated"); }
    catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  return (
    <div>
      <AHeader title="Rank Management" subtitle="Ranks are auto-calculated by team volume. Configure thresholds below.">
        {canEdit && <Btn testid="ranks-save" onClick={save}><Save className="h-4 w-4" /> Save</Btn>}
      </AHeader>

      <div className="grid lg:grid-cols-3 gap-5">
        <Panel title="Rank Tiers" className="lg:col-span-2 p-5">
          <div className="space-y-3">
            {tiers.map((t, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 p-3">
                <input disabled={!canEdit} value={t.name} onChange={(e) => update(i, "name", e.target.value)}
                  className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-amber-400/40" />
                <div className="flex items-center gap-2">
                  <span className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">Min Volume</span>
                  <input disabled={!canEdit} type="number" value={t.min_team_volume} onChange={(e) => update(i, "min_team_volume", e.target.value)}
                    className="w-32 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 font-mono-merq text-sm text-white outline-none focus:border-amber-400/40" />
                </div>
                {canEdit && <button onClick={() => remove(i)} className="text-rose-400 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>}
              </div>
            ))}
            {canEdit && <Btn variant="ghost" onClick={add}><Plus className="h-4 w-4" /> Add Rank</Btn>}
          </div>
        </Panel>

        <Panel title="Distribution" className="p-5">
          <div className="space-y-2">
            {data && Object.entries(data.distribution).map(([rank, count]) => (
              <div key={rank} className="flex justify-between text-sm">
                <span className="text-slate-400">{rank}</span>
                <span className="font-mono-merq text-white">{count}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
