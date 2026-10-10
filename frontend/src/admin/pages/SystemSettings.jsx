import { useState, useEffect } from "react";
import { adminApi } from "../adminApi";
import { useAdminAuth } from "../AdminAuth";
import { useAdminData, AHeader, Panel, Btn } from "../ui";
import { toast } from "sonner";
import { Save } from "lucide-react";

const FIELDS = [
  ["platform_name", "Platform Name", "text"],
  ["timezone", "Timezone", "text"],
  ["block_confirmations", "Block Confirmations", "number"],
  ["token_contract", "Token Contract", "text"],
  ["merq_price_usd", "MERQ Price (USD)", "number"],
  ["starting_wallet_balance", "Demo Start Balance", "number"],
];

export default function SystemSettings() {
  const { can } = useAdminAuth();
  const { data } = useAdminData("adm-system", "/system");
  const [form, setForm] = useState({});
  const canEdit = can("settings", true);
  useEffect(() => { if (data) setForm(data); }, [data]);

  const save = async () => {
    const payload = {};
    FIELDS.forEach(([k, , type]) => { payload[k] = type === "number" ? Number(form[k]) : form[k]; });
    payload.maintenance_mode = !!form.maintenance_mode;
    try { await adminApi.put("/system", payload); toast.success("System settings saved"); }
    catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  return (
    <div>
      <AHeader title="System Settings" subtitle="General platform, blockchain and display configuration.">
        {canEdit && <Btn testid="system-save" onClick={save}><Save className="h-4 w-4" /> Save</Btn>}
      </AHeader>

      <div className="grid lg:grid-cols-2 gap-5">
        <Panel title="General & Blockchain" className="p-5">
          <div className="grid sm:grid-cols-2 gap-4">
            {FIELDS.map(([k, label, type]) => (
              <div key={k}>
                <label className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">{label}</label>
                <input disabled={!canEdit} type={type} value={form[k] ?? ""} data-testid={`system-${k}`}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 font-mono-merq text-sm text-white outline-none focus:border-amber-400/40" />
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Mode" className="p-5">
          <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/5 px-4 py-3">
            <div>
              <div className="text-white text-sm font-medium">Maintenance Mode</div>
              <div className="text-xs text-slate-500">Show a maintenance banner to members.</div>
            </div>
            <button disabled={!canEdit} data-testid="system-maintenance" onClick={() => setForm({ ...form, maintenance_mode: !form.maintenance_mode })}
              className={`h-6 w-11 rounded-full transition-colors relative ${form.maintenance_mode ? "bg-amber-400" : "bg-slate-700"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${form.maintenance_mode ? "left-6" : "left-0.5"}`} />
            </button>
          </div>
          <div className="mt-4 text-xs text-slate-500 space-y-1 font-mono-merq">
            <div>Chain ID: {data?.chain_id}</div>
            <div>Network: BNB Smart Chain</div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
