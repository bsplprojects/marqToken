import { useState, useEffect } from "react";
import { adminApi } from "../adminApi";
import { useAdminAuth } from "../AdminAuth";
import { useAdminData, AHeader, Panel, Table, Btn, Pill, fmt, dt } from "../ui";
import { toast } from "sonner";
import { Save, History } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const RULE_DEFS = {
  referral: [["direct_referral_pct", "Direct Referral %"]],
  growth: [["daily_pct", "Daily %"], ["term_days", "Term (days)"]],
  commission: [["pct", "Commission %"], ["min_directs", "Min Directs"]],
  autopool: [["entry", "Entry"], ["capacity", "Capacity"], ["reward", "Reward"]],
  withdrawal: [["min", "Min"], ["max_daily", "Max Daily"], ["fee_pct", "Fee %"],
               ["cooldown_hours", "Cooldown (h)"], ["auto_approve_under", "Auto-Approve Under"]],
};

export default function Rules() {
  const { can } = useAdminAuth();
  const qc = useQueryClient();
  const { data } = useAdminData("adm-rules", "/rules");
  const [forms, setForms] = useState({});
  const canEdit = can("rules", true);

  useEffect(() => { if (data?.current) setForms(data.current); }, [data]);

  const setField = (type, key, val) => setForms((f) => ({ ...f, [type]: { ...f[type], [key]: val } }));

  const submit = async (type) => {
    try {
      await adminApi.post("/rules/version", { type, params: forms[type] });
      toast.success(`${type} rule — new version created`);
      qc.invalidateQueries({ queryKey: ["adm-rules"] });
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  return (
    <div>
      <AHeader title="Business Rules" subtitle="The control center. Changes create a new rule version — historical transactions keep their original version." />

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        {Object.entries(RULE_DEFS).map(([type, fields]) => (
          <Panel key={type} title={type.charAt(0).toUpperCase() + type.slice(1)} className="p-5" testid={`rule-${type}`}>
            <div className="grid grid-cols-2 gap-3">
              {fields.map(([key, label]) => (
                <div key={key}>
                  <label className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">{label}</label>
                  <input disabled={!canEdit} type="number" value={forms[type]?.[key] ?? ""} data-testid={`rule-${type}-${key}`}
                    onChange={(e) => setField(type, key, Number(e.target.value))}
                    className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 font-mono-merq text-sm text-white outline-none focus:border-amber-400/40" />
                </div>
              ))}
            </div>
            {canEdit && <Btn testid={`rule-save-${type}`} className="mt-4" onClick={() => submit(type)}><Save className="h-4 w-4" /> New Version</Btn>}
          </Panel>
        ))}
      </div>

      <Panel title="Rule Version History">
        {data?.versions?.length ? (
          <Table columns={[{ label: "Type" }, { label: "Version" }, { label: "Params" }, { label: "Active" }, { label: "By" }, { label: "Effective" }]}>
            {data.versions.map((v) => (
              <tr key={v.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-5 py-2.5 text-slate-200 capitalize">{v.type}</td>
                <td className="px-5 py-2.5 font-mono-merq text-amber-300">V{v.version}</td>
                <td className="px-5 py-2.5 font-mono-merq text-xs text-slate-500 max-w-xs truncate">{JSON.stringify(v.params)}</td>
                <td className="px-5 py-2.5">{v.active ? <Pill status="active" /> : <span className="text-slate-600 text-xs">archived</span>}</td>
                <td className="px-5 py-2.5 text-slate-400 text-xs">{v.created_by}</td>
                <td className="px-5 py-2.5 text-slate-500 text-xs">{dt(v.effective_from)}</td>
              </tr>
            ))}
          </Table>
        ) : <div className="py-8 text-center text-slate-500 text-sm"><History className="h-6 w-6 mx-auto mb-2 text-slate-700" />No versions.</div>}
      </Panel>
    </div>
  );
}
