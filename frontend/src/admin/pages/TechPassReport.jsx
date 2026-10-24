import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { adminApi, ADMIN_API } from "../adminApi";
import { useAdminAuth } from "../AdminAuth";
import { useAdminData, AHeader, Panel, Btn, Table, Pill, KCard, Empty, fmt, dt } from "../ui";
import { toast } from "sonner";
import { Save, Download, ExternalLink } from "lucide-react";

const STATUSES = ["", "confirmed", "pending", "failed", "invalid", "expired"];

export default function TechPassReport() {
  const { can } = useAdminAuth();
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const { data } = useAdminData(["adm-techpass", status, q], `/techpass?${new URLSearchParams({ ...(status && { status }), ...(q && { q }) })}`);
  const [form, setForm] = useState({});
  const canEdit = can("deposits", true);
  useEffect(() => { if (data) setForm((f) => (Object.keys(f).length ? f : data.config)); }, [data]);
  const s = data?.summary || {};

  const save = async () => {
    try {
      await adminApi.put("/techpass/config", { receive_wallet: form.receive_wallet, price_usd: Number(form.price_usd), enabled: !!form.enabled });
      toast.success("TechPass settings saved");
      qc.invalidateQueries({ queryKey: ["adm-techpass"] });
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed to save"); }
  };

  const exportCsv = () => {
    fetch(`${ADMIN_API}/techpass/export`, { headers: { Authorization: `Bearer ${localStorage.getItem("merqon_admin_jwt")}` } })
      .then((r) => r.blob()).then((b) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(b); a.download = "merqon_techpass.csv"; a.click();
      });
  };

  return (
    <div>
      <AHeader title="Merq TechPass" subtitle="$120 passes paid in real MERQ. All tokens go to the receiving address below.">
        <Btn testid="techpass-export" variant="ghost" onClick={exportCsv}><Download className="h-4 w-4" /> Export CSV</Btn>
      </AHeader>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        <KCard testid="techpass-kpi-sold" label="Passes Sold" value={s.sold ?? 0} accent="amber" />
        <KCard testid="techpass-kpi-usd" label="Total Value" value={`$${fmt(s.total_usd ?? 0)}`} accent="emerald" />
        <KCard testid="techpass-kpi-merq" label="MERQ Received" value={fmt(s.total_merq ?? 0, 4)} accent="cyan" />
        <KCard testid="techpass-kpi-pending" label="Pending" value={s.pending ?? 0} accent="violet" />
        <KCard testid="techpass-kpi-failed" label="Failed / Invalid" value={s.failed ?? 0} accent="rose" />
      </div>
      <Panel title="Settings" className="p-5 mb-5">
        <div className="grid md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">Token receiving address (all MERQ goes here)</label>
            <input data-testid="techpass-receive-wallet" disabled={!canEdit} value={form.receive_wallet ?? ""} onChange={(e) => setForm({ ...form, receive_wallet: e.target.value })}
              className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 font-mono-merq text-sm text-white outline-none focus:border-amber-400/40" />
          </div>
          <div>
            <label className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">Price (USD)</label>
            <input data-testid="techpass-price-usd" disabled={!canEdit} type="number" value={form.price_usd ?? ""} onChange={(e) => setForm({ ...form, price_usd: e.target.value })}
              className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 font-mono-merq text-sm text-white outline-none focus:border-amber-400/40" />
          </div>
          <div className="flex items-center gap-3">
            <button data-testid="techpass-enabled" disabled={!canEdit} onClick={() => setForm({ ...form, enabled: !form.enabled })}
              className={`h-6 w-11 rounded-full transition-colors relative ${form.enabled ? "bg-amber-400" : "bg-slate-700"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${form.enabled ? "left-6" : "left-0.5"}`} />
            </button>
            <span className="text-sm text-slate-300">{form.enabled ? "Sales on" : "Sales paused"}</span>
            {canEdit && <Btn testid="techpass-save" onClick={save} className="ml-auto"><Save className="h-4 w-4" /> Save</Btn>}
          </div>
        </div>
      </Panel>
      <Panel title="Purchases" action={
        <div className="flex gap-2">
          <input data-testid="techpass-search" placeholder="Search wallet" value={q} onChange={(e) => setQ(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none" />
          <select data-testid="techpass-status-filter" value={status} onChange={(e) => setStatus(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none">
            {STATUSES.map((x) => <option key={x} value={x}>{x || "All statuses"}</option>)}
          </select>
        </div>
      }>
        {data?.rows?.length ? (
          <Table columns={[{ label: "Pass" }, { label: "Wallet" }, { label: "USD", right: true }, { label: "MERQ", right: true }, { label: "Price" }, { label: "Status" }, { label: "Date" }, { label: "" }]}>
            {data.rows.map((p) => (
              <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-5 py-2.5 font-mono-merq text-xs text-amber-300">{p.id}</td>
                <td className="px-5 py-2.5 font-mono-merq text-xs text-slate-400">{p.address}</td>
                <td className="px-5 py-2.5 text-right font-mono-merq text-slate-200">${fmt(p.price_usd)}</td>
                <td className="px-5 py-2.5 text-right font-mono-merq text-slate-200">{fmt(p.merq_amount, 4)}</td>
                <td className="px-5 py-2.5 text-xs text-slate-500">${Number(p.merq_price).toFixed(6)} · {p.price_source === "pancakeswap_pool" ? "pool" : "admin"}</td>
                <td className="px-5 py-2.5"><Pill status={p.status} /></td>
                <td className="px-5 py-2.5 text-xs text-slate-500">{dt(p.created_at)}</td>
                <td className="px-5 py-2.5 text-right"><a href={p.bscscan_url} target="_blank" rel="noreferrer" className="text-amber-400"><ExternalLink className="h-3.5 w-3.5 inline" /></a></td>
              </tr>
            ))}
          </Table>
        ) : <Empty text="No TechPass purchases yet." />}
      </Panel>
    </div>
  );
}
