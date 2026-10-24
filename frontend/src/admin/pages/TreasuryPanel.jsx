import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../adminApi";
import { useAdminData, Panel, Btn, fmt } from "../ui";
import { toast } from "sonner";
import { Save, Landmark, AlertTriangle } from "lucide-react";

export const TreasuryPanel = ({ canEdit }) => {
  const qc = useQueryClient();
  const { data: t } = useAdminData("adm-wd-treasury", "/withdrawals/treasury");
  const [limit, setLimit] = useState("");
  useEffect(() => { if (t) setLimit(String(t.auto_approve_under)); }, [t]);

  const save = async () => {
    try {
      await adminApi.put("/withdrawals/auto-approve", { auto_approve_under: Number(limit) });
      toast.success("Approval limit saved");
      qc.invalidateQueries({ queryKey: ["adm-wd-treasury"] });
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed to save"); }
  };

  const warn = !t ? null : !t.configured ? "Treasury wallet key is not added yet — approved withdrawals will wait as 'payout failed' until it is."
    : !t.merq_live ? "MERQ contract isn't set yet (Admin → Swap Settings)." : null;

  return (
    <Panel title="Treasury Payout Wallet" className="p-5 mb-5">
      <div className="grid md:grid-cols-4 gap-4 items-end">
        <div className="md:col-span-2">
          <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">Sending wallet</div>
          <div data-testid="treasury-address" className="flex items-center gap-2 font-mono-merq text-sm text-white mt-1 break-all">
            <Landmark className="h-4 w-4 text-amber-400 flex-shrink-0" /> {t?.address || "Not configured"}
          </div>
          <div className="flex gap-6 mt-2 font-mono-merq text-xs text-slate-400">
            <span data-testid="treasury-merq">MERQ: <span className="text-amber-300">{t?.merq_balance == null ? "—" : fmt(t.merq_balance, 4)}</span></span>
            <span data-testid="treasury-bnb">BNB (gas): <span className="text-amber-300">{t?.bnb_balance == null ? "—" : t.bnb_balance.toFixed(4)}</span></span>
          </div>
        </div>
        <div>
          <label className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">Needs approval above (MERQ)</label>
          <input data-testid="wd-auto-approve-input" type="number" disabled={!canEdit} value={limit} onChange={(e) => setLimit(e.target.value)}
            className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 font-mono-merq text-sm text-white outline-none focus:border-amber-400/40" />
        </div>
        {canEdit && <Btn testid="wd-auto-approve-save" onClick={save} className="justify-self-start"><Save className="h-4 w-4" /> Save</Btn>}
      </div>
      {warn && (
        <div data-testid="treasury-warning" className="flex items-start gap-2 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 mt-4 text-xs text-amber-200">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {warn}
        </div>
      )}
    </Panel>
  );
};
