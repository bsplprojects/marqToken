import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { adminApi, ADMIN_API } from "../adminApi";
import { useAdminAuth } from "../AdminAuth";
import { useAdminData, AHeader, Panel, Btn, Table, Pill, KCard, Empty, fmt, dt } from "../ui";
import { toast } from "sonner";
import { Save, Download, ExternalLink } from "lucide-react";

const STATUSES = ["", "confirmed", "pending", "failed", "invalid", "expired"];
const TABS = [["entry", "Entry Port"], ["unity", "Unity Port"]];
const inputCls = "mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 font-mono-merq text-sm text-white outline-none focus:border-amber-400/40";

export default function PortsReport() {
  const { can } = useAdminAuth();
  const qc = useQueryClient();
  const [port, setPort] = useState("entry");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const { data } = useAdminData(["adm-ports", port, status, q], `/ports/${port}?${new URLSearchParams({ ...(status && { status }), ...(q && { q }) })}`);
  const [form, setForm] = useState(null);
  const canEdit = can("deposits", true);
  useEffect(() => { setForm(null); }, [port]);
  useEffect(() => { if (data && !form) setForm(data.config); }, [data, form]);
  const s = data?.summary || {};

  const save = async () => {
    try {
      await adminApi.put(`/ports/${port}/config`, { min_usd: Number(form.min_usd), max_usd: Number(form.max_usd), enabled: !!form.enabled });
      toast.success("Port settings saved");
      qc.invalidateQueries({ queryKey: ["adm-ports"] });
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed to save"); }
  };

  const exportCsv = () => {
    fetch(`${ADMIN_API}/ports/${port}/export`, { headers: { Authorization: `Bearer ${localStorage.getItem("merqon_admin_jwt")}` } })
      .then((r) => r.blob()).then((b) => { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `merqon_${port}_port.csv`; a.click(); });
  };

  return (
    <div>
      <AHeader title="Entry & Unity Port Sales" subtitle="USDT-valued purchases paid in real MERQ, sent to the TechPass receiving address.">
        <Btn testid="ports-export" variant="ghost" onClick={exportCsv}><Download className="h-4 w-4" /> Export CSV</Btn>
      </AHeader>
      <div className="flex gap-2 mb-5">
        {TABS.map(([k, l]) => (
          <button key={k} data-testid={`ports-tab-${k}`} onClick={() => setPort(k)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${port === k ? "bg-amber-400 text-slate-950" : "border border-white/10 text-slate-400 hover:text-white"}`}>{l}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-5">
        <KCard testid="ports-kpi-purchases" label="Purchases" value={s.purchases ?? 0} accent="amber" />
        <KCard testid="ports-kpi-buyers" label="Buyers" value={s.buyers ?? 0} accent="violet" />
        <KCard testid="ports-kpi-usd" label="Total Value" value={`$${fmt(s.total_usd ?? 0)}`} accent="emerald" />
        <KCard testid="ports-kpi-merq" label="MERQ Received" value={fmt(s.total_merq ?? 0, 4)} accent="cyan" />
        <KCard testid="ports-kpi-pending" label="Pending" value={s.pending ?? 0} accent="violet" />
        <KCard testid="ports-kpi-failed" label="Failed / Expired" value={s.failed ?? 0} accent="rose" />
      </div>
      {form && (
        <Panel title={`${data?.name} Settings`} className="p-5 mb-5">
          <div className="grid md:grid-cols-4 gap-4 items-end">
            <div><label className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">Minimum (USDT)</label>
              <input data-testid="ports-min-usd" type="number" disabled={!canEdit} value={form.min_usd} onChange={(e) => setForm({ ...form, min_usd: e.target.value })} className={inputCls} /></div>
            <div><label className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">Maximum (USDT)</label>
              <input data-testid="ports-max-usd" type="number" disabled={!canEdit} value={form.max_usd} onChange={(e) => setForm({ ...form, max_usd: e.target.value })} className={inputCls} /></div>
            <div className="flex items-center gap-3">
              <button data-testid="ports-enabled" disabled={!canEdit} onClick={() => setForm({ ...form, enabled: !form.enabled })}
                className={`h-6 w-11 rounded-full transition-colors relative ${form.enabled ? "bg-amber-400" : "bg-slate-700"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${form.enabled ? "left-6" : "left-0.5"}`} />
              </button>
              <span className="text-sm text-slate-300">{form.enabled ? "Sales on" : "Sales paused"}</span>
            </div>
            {canEdit && <Btn testid="ports-save" onClick={save} className="justify-self-end"><Save className="h-4 w-4" /> Save</Btn>}
          </div>
          <p className="text-xs text-slate-500 mt-3">MERQ is sent to the receiving address set on the TechPass Sales page. Buyers need an active TechPass.</p>
        </Panel>
      )}
      <Panel title="Purchases" action={
        <div className="flex gap-2">
          <input data-testid="ports-search" placeholder="Search wallet" value={q} onChange={(e) => setQ(e.target.value)} className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none" />
          <select data-testid="ports-status-filter" value={status} onChange={(e) => setStatus(e.target.value)} className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none">
            {STATUSES.map((x) => <option key={x} value={x}>{x || "All statuses"}</option>)}
          </select>
        </div>
      }>
        {data?.rows?.length ? (
          <Table columns={[{ label: "ID" }, { label: "Wallet" }, { label: "USDT", right: true }, { label: "MERQ", right: true }, { label: "Price" }, { label: "Status" }, { label: "Date" }, { label: "" }]}>
            {data.rows.map((p) => (
              <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-5 py-2.5 font-mono-merq text-xs text-amber-300">{p.id}</td>
                <td className="px-5 py-2.5 font-mono-merq text-xs text-slate-400">{p.address}</td>
                <td className="px-5 py-2.5 text-right font-mono-merq text-slate-200">${fmt(p.amount_usd)}</td>
                <td className="px-5 py-2.5 text-right font-mono-merq text-slate-200">{fmt(p.merq_amount, 4)}</td>
                <td className="px-5 py-2.5 text-xs text-slate-500">${Number(p.merq_price).toFixed(6)} · {p.price_source === "pancakeswap_pool" ? "pool" : "admin"}</td>
                <td className="px-5 py-2.5"><Pill status={p.status} /></td>
                <td className="px-5 py-2.5 text-xs text-slate-500">{dt(p.created_at)}</td>
                <td className="px-5 py-2.5 text-right"><a href={p.bscscan_url} target="_blank" rel="noreferrer" className="text-amber-400"><ExternalLink className="h-3.5 w-3.5 inline" /></a></td>
              </tr>
            ))}
          </Table>
        ) : <Empty text="No purchases yet." />}
      </Panel>
    </div>
  );
}
