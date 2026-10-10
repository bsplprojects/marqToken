import { useAdminData, AHeader, Panel, Table, Pill, KCard, Empty, fmt, dt } from "../ui";
import { INCOME_META } from "@/lib/format";
import { ExternalLink, AlertTriangle } from "lucide-react";

export default function Token() {
  const { data: t } = useAdminData("adm-token", "/token");
  const { data: bc } = useAdminData("adm-blockchain", "/blockchain", { refetchInterval: 15000 });

  const info = [
    ["Name", t?.name], ["Symbol", t?.symbol], ["Decimals", t?.decimals],
    ["Network", t?.network], ["Chain ID", t?.chain_id], ["Total Supply", fmt(t?.total_supply, 0)],
    ["Contract", t?.contract], ["Verified", t?.verified ? "Yes" : "No"],
  ];
  return (
    <div>
      <AHeader title="Token & Blockchain" subtitle="Monitoring view (simulated in v1 — no live contract deployed yet).">
        <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 font-mono-merq text-[10px] uppercase tracking-widest text-cyan-300"><AlertTriangle className="h-3 w-3" /> Simulated</span>
      </AHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KCard label="Latest Block" value={fmt(bc?.latest_block, 0)} accent="amber" />
        <KCard label="Pending Tx" value={bc?.pending ?? 0} accent="cyan" />
        <KCard label="Failed Tx" value={bc?.failed ?? 0} accent="rose" />
        <KCard label="RPC" value={bc?.rpc_status || "—"} accent="violet" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Panel title="Token Information" className="p-5">
          <div className="space-y-2">
            {info.map(([l, v]) => (
              <div key={l} className="flex justify-between gap-3 text-sm">
                <span className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">{l}</span>
                <span className="font-mono-merq text-slate-200 truncate">{v}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Recent Transfers" className="lg:col-span-2">
          {bc?.transfers?.length ? (
            <Table columns={[{ label: "Tx" }, { label: "Type" }, { label: "Wallet" }, { label: "Amount", right: true }, { label: "Status" }, { label: "" }]}>
              {bc.transfers.slice(0, 20).map((tx, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-5 py-2.5 font-mono-merq text-xs text-slate-500">{tx.tx_hash.slice(0, 10)}…</td>
                  <td className="px-5 py-2.5 text-slate-300">{INCOME_META[tx.type]?.label || tx.type}</td>
                  <td className="px-5 py-2.5 font-mono-merq text-slate-400">{tx.address}</td>
                  <td className={`px-5 py-2.5 text-right font-mono-merq ${tx.amount < 0 ? "text-rose-400" : "text-emerald-400"}`}>{tx.amount < 0 ? "" : "+"}{fmt(tx.amount)}</td>
                  <td className="px-5 py-2.5"><Pill status={tx.status} /></td>
                  <td className="px-5 py-2.5 text-right"><a href={tx.bscscan_url} target="_blank" rel="noreferrer" className="text-amber-400 hover:text-amber-300"><ExternalLink className="h-3.5 w-3.5 inline" /></a></td>
                </tr>
              ))}
            </Table>
          ) : <Empty />}
        </Panel>
      </div>
    </div>
  );
}
