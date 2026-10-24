import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../adminApi";
import { useAdminAuth } from "../AdminAuth";
import { useAdminData, AHeader, Panel, Btn, Table, Pill, Empty, fmt, dt } from "../ui";
import { toast } from "sonner";
import { Save, ExternalLink } from "lucide-react";

const FIELDS = [
  ["merq_token_address", "MERQ Token Contract", "text", "0x… (leave blank until MERQ is live)"],
  ["fee_wallet", "Fee Receiving Wallet", "text", "0x…"],
  ["fee_pct", "Swap Fee (%)", "number", "0.1"],
  ["default_slippage_pct", "Default Slippage (%)", "number", "1"],
  ["usdt_token_address", "USDT Token Contract", "text", ""],
  ["router_address", "PancakeSwap Router", "text", ""],
  ["factory_address", "PancakeSwap Factory", "text", ""],
  ["rpc_url", "BSC RPC URL", "text", "https://…"],
];

export default function SwapSettings() {
  const { can } = useAdminAuth();
  const qc = useQueryClient();
  const { data } = useAdminData("adm-swap", "/swap");
  const [form, setForm] = useState({});
  const canEdit = can("token", true);
  useEffect(() => { if (data) setForm(data.config); }, [data]);

  const save = async () => {
    try {
      await adminApi.put("/swap", { ...form, fee_pct: Number(form.fee_pct), default_slippage_pct: Number(form.default_slippage_pct) });
      toast.success("Swap settings saved");
      qc.invalidateQueries({ queryKey: ["adm-swap"] });
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed to save"); }
  };

  const status = !form.enabled ? "Paused" : form.merq_token_address ? "Live" : "Waiting for MERQ contract";

  return (
    <div>
      <AHeader title="Swap Settings" subtitle="USDT ⇄ MERQ on-chain swap via PancakeSwap. Contract, fee wallet and fee are editable here.">
        {canEdit && <Btn testid="swap-settings-save" onClick={save}><Save className="h-4 w-4" /> Save</Btn>}
      </AHeader>
      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        <Panel title="Configuration" className="p-5 lg:col-span-2">
          <div className="grid sm:grid-cols-2 gap-4">
            {FIELDS.map(([k, label, type, ph]) => (
              <div key={k} className={type === "text" ? "sm:col-span-2" : ""}>
                <label className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">{label}</label>
                <input disabled={!canEdit} type={type} step="any" value={form[k] ?? ""} placeholder={ph} data-testid={`swap-setting-${k}`}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 font-mono-merq text-sm text-white outline-none focus:border-amber-400/40" />
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Status" className="p-5">
          <div data-testid="swap-settings-status" className="font-display text-xl font-bold text-amber-300">{status}</div>
          <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/5 px-4 py-3 mt-4">
            <div>
              <div className="text-white text-sm font-medium">Swaps enabled</div>
              <div className="text-xs text-slate-500">Turn off to pause the swap page for members.</div>
            </div>
            <button disabled={!canEdit} data-testid="swap-setting-enabled" onClick={() => setForm({ ...form, enabled: !form.enabled })}
              className={`h-6 w-11 rounded-full transition-colors relative ${form.enabled ? "bg-amber-400" : "bg-slate-700"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${form.enabled ? "left-6" : "left-0.5"}`} />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-4 leading-relaxed">
            The fee is sent from the member's wallet to the fee wallet in a separate transfer before each swap.
            Swaps only work once a MERQ/USDT pool with liquidity exists on PancakeSwap.
          </p>
        </Panel>
      </div>
      <Panel title="Recent Member Swaps">
        {data?.recent?.length ? (
          <Table columns={[{ label: "Wallet" }, { label: "Direction" }, { label: "In", right: true }, { label: "Out (est)", right: true }, { label: "Fee", right: true }, { label: "Status" }, { label: "Time" }, { label: "" }]}>
            {data.recent.map((s) => (
              <tr key={s.tx_hash} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-5 py-2.5 font-mono-merq text-xs text-slate-400">{s.address.slice(0, 8)}…{s.address.slice(-4)}</td>
                <td className="px-5 py-2.5 text-slate-300">{s.direction === "USDT_TO_MERQ" ? "USDT → MERQ" : "MERQ → USDT"}</td>
                <td className="px-5 py-2.5 text-right font-mono-merq text-slate-200">{fmt(s.amount_in, 4)}</td>
                <td className="px-5 py-2.5 text-right font-mono-merq text-slate-200">{fmt(s.amount_out_est, 4)}</td>
                <td className="px-5 py-2.5 text-right font-mono-merq text-amber-300">{fmt(s.fee_amount, 4)}</td>
                <td className="px-5 py-2.5"><Pill status={s.status} /></td>
                <td className="px-5 py-2.5 text-xs text-slate-500">{dt(s.created_at)}</td>
                <td className="px-5 py-2.5 text-right"><a href={s.bscscan_url} target="_blank" rel="noreferrer" className="text-amber-400"><ExternalLink className="h-3.5 w-3.5 inline" /></a></td>
              </tr>
            ))}
          </Table>
        ) : <Empty text="No swaps yet." />}
      </Panel>
    </div>
  );
}
