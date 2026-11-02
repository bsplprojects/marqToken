import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, ShieldCheck, ShieldAlert } from "lucide-react";
import { adminApi } from "../adminApi";
import { useAdminAuth } from "../AdminAuth";
import { useAdminData, AHeader, Panel, Btn, fmt } from "../ui";

const inp = "w-full mt-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 font-mono-merq text-sm text-white outline-none focus:border-amber-400/40 disabled:opacity-60";

const F = ({ label, k, form, set, disabled, placeholder, type = "text" }) => (
  <div>
    <label className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">{label}</label>
    <input data-testid={`wallets-${k}`} type={type} step="any" disabled={disabled} placeholder={placeholder}
      value={form[k] ?? ""} onChange={(e) => set({ ...form, [k]: e.target.value })} className={inp} />
  </div>
);

const SWAP_KEYS = ["merq_token_address", "usdt_token_address", "wbnb_address", "router_address", "factory_address", "rpc_url", "fee_wallet", "fee_pct", "default_slippage_pct"];

const Treasury = ({ t }) => (
  <Panel testid="wallets-treasury" title="Withdrawal Treasury" className="p-5">
    <div className={`flex items-center gap-2 text-sm ${t.configured ? "text-emerald-300" : "text-rose-300"}`}>
      {t.configured ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
      <span data-testid="wallets-treasury-status">{t.configured ? "Private key is valid — withdrawals can be sent" : t.key_set ? "Saved private key is invalid — withdrawals are blocked" : "No private key saved — withdrawals are blocked"}</span>
    </div>
    <div className="grid sm:grid-cols-3 gap-3 mt-4 font-mono-merq text-xs">
      <div><div className="text-slate-500 uppercase tracking-widest text-[10px]">Treasury wallet</div><div data-testid="wallets-treasury-address" className="text-slate-200 break-all mt-1">{t.address || "—"}</div></div>
      <div><div className="text-slate-500 uppercase tracking-widest text-[10px]">MERQ balance</div><div className="text-amber-300 mt-1">{t.merq_balance == null ? "—" : fmt(t.merq_balance, 4)}</div></div>
      <div><div className="text-slate-500 uppercase tracking-widest text-[10px]">BNB (gas)</div><div className="text-amber-300 mt-1">{t.bnb_balance == null ? "—" : fmt(t.bnb_balance, 5)}</div></div>
    </div>
    <p className="text-xs text-slate-500 mt-4">For security the private key is never stored in the database or shown here. It is kept in the server's encrypted secrets; the wallet address above is derived from it.</p>
  </Panel>
);

export default function WalletsContracts() {
  const { can } = useAdminAuth();
  const qc = useQueryClient();
  const { data } = useAdminData("adm-wallets", "/wallets");
  const [form, setForm] = useState(null);
  const canEdit = can("token", true);
  useEffect(() => {
    if (data && !form) setForm({ ...Object.fromEntries(SWAP_KEYS.map((k) => [k, data.swap[k]])), techpass_wallet: data.techpass_receive_wallet,
      entry_wallet: data.ports.entry.receive_wallet, unity_wallet: data.ports.unity.receive_wallet });
  }, [data, form]);
  if (!form) return null;

  const save = async () => {
    try {
      await adminApi.put("/wallets", { ...form, fee_pct: Number(form.fee_pct), default_slippage_pct: Number(form.default_slippage_pct) });
      toast.success("Wallets & contracts saved");
      setForm(null);
      qc.invalidateQueries({ queryKey: ["adm-wallets"] });
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed to save"); }
  };
  const p = { form, set: setForm, disabled: !canEdit };

  return (
    <div>
      <AHeader title="Wallets & Contracts" subtitle="All token contracts, receiving wallets and the withdrawal treasury in one place.">
        {canEdit && <Btn testid="wallets-save" onClick={save}><Save className="h-4 w-4" /> Save all</Btn>}
      </AHeader>
      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <Panel title="Token Contracts" className="p-5 space-y-3">
          <F label="MERQ Token Contract" k="merq_token_address" placeholder="0x…" {...p} />
          <F label="USDT Contract" k="usdt_token_address" placeholder="0x…" {...p} />
          <F label="WBNB Contract" k="wbnb_address" placeholder="0x…" {...p} />
          <F label="PancakeSwap Factory" k="factory_address" placeholder="0x…" {...p} />
          <F label="PancakeSwap Router" k="router_address" placeholder="0x…" {...p} />
          <F label="BSC RPC URL" k="rpc_url" placeholder="https://…" {...p} />
        </Panel>
        <Panel title="Receiving Wallets" className="p-5 space-y-3">
          <F label="TechPass Sale Receive Wallet" k="techpass_wallet" placeholder="0x…" {...p} />
          <F label="Entry Port Receive Token Wallet" k="entry_wallet" placeholder={`Blank = TechPass wallet`} {...p} />
          <F label="Unity Port Receive Token Wallet" k="unity_wallet" placeholder={`Blank = TechPass wallet`} {...p} />
          <F label="Swap Fee Receive Wallet" k="fee_wallet" placeholder="0x…" {...p} />
          <div className="grid grid-cols-2 gap-3">
            <F label="Swap Fee (%)" k="fee_pct" type="number" {...p} />
            <F label="Default Slippage (%)" k="default_slippage_pct" type="number" {...p} />
          </div>
        </Panel>
      </div>
      <Treasury t={data.treasury} />
    </div>
  );
}
