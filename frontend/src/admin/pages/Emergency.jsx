import { useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../adminApi";
import { useAdminAuth } from "../AdminAuth";
import { useAdminData, AHeader, Panel } from "../ui";
import { toast } from "sonner";
import { AlertTriangle, Power } from "lucide-react";

const CONTROLS = [
  { key: "pause_withdrawals", label: "Pause Withdrawals", desc: "Blocks all member withdrawals immediately." },
  { key: "pause_deposits", label: "Pause Deposits", desc: "Stops new deposits into the protocol." },
  { key: "pause_autopool", label: "Pause Autopool", desc: "Freezes autopool entries." },
  { key: "pause_rewards", label: "Pause Rewards", desc: "Disables achievement reward claims." },
  { key: "disable_registration", label: "Disable Registration", desc: "Prevents new member sign-ups." },
];

export default function Emergency() {
  const qc = useQueryClient();
  const { can } = useAdminAuth();
  const { data } = useAdminData("adm-emergency", "/emergency");
  const canEdit = can("emergency", true);
  const controls = data?.controls || {};

  const toggle = async (key, enabled) => {
    const reason = window.prompt(`Reason to ${enabled ? "ENABLE" : "disable"} "${key}":`);
    if (!reason) return;
    try {
      await adminApi.post("/emergency", { control: key, enabled, reason });
      toast.success(`${key} ${enabled ? "enabled" : "disabled"}`);
      qc.invalidateQueries({ queryKey: ["adm-emergency"] });
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  return (
    <div>
      <AHeader title="Emergency Center" subtitle="High-authorization controls. Every toggle requires a reason and is audit-logged." />
      <div className="rounded-2xl border border-rose-400/20 bg-rose-500/5 p-4 mb-5 flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-rose-400" />
        <span className="text-sm text-rose-200">Use with caution. These controls affect all members platform-wide.</span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {CONTROLS.map((c) => {
          const active = !!controls[c.key];
          return (
            <Panel key={c.key} className="p-5" testid={`emergency-${c.key}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display font-semibold text-white">{c.label}</div>
                  <p className="text-sm text-slate-500 mt-1">{c.desc}</p>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-mono-merq uppercase tracking-wide ${active ? "bg-rose-500/15 text-rose-300" : "bg-emerald-500/10 text-emerald-300"}`}>
                  {active ? "Active" : "Normal"}
                </span>
              </div>
              {canEdit && (
                <button data-testid={`emergency-toggle-${c.key}`} onClick={() => toggle(c.key, !active)}
                  className={`mt-4 w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                    active ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950" : "bg-rose-500 hover:bg-rose-400 text-white"}`}>
                  <Power className="h-4 w-4" /> {active ? "Resume" : "Activate"}
                </button>
              )}
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
