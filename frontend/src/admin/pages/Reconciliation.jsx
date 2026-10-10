import { useAdminData, AHeader, Panel, Table, Pill, KCard, Empty, fmt, dt } from "../ui";
import { ExternalLink } from "lucide-react";

export default function Reconciliation() {
  const { data } = useAdminData("adm-recon", "/reconciliation");
  const s = data?.summary;
  return (
    <div>
      <AHeader title="Reconciliation" subtitle="Compares the internal ledger against on-chain transactions (simulated in v1)." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KCard label="Matched" value={s?.matched ?? 0} accent="emerald" />
        <KCard label="Mismatch" value={s?.mismatch ?? 0} accent="rose" />
        <KCard label="Pending" value={s?.pending ?? 0} accent="amber" />
        <KCard label="Manual Review" value={s?.manual_review ?? 0} accent="violet" />
      </div>
      <Panel title="Ledger ↔ Chain">
        {data?.rows?.length ? (
          <Table columns={[{ label: "Tx Hash" }, { label: "Ledger", right: true }, { label: "Chain", right: true }, { label: "Status" }, { label: "Date" }, { label: "", right: true }]}>
            {data.rows.map((r, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-5 py-2.5 font-mono-merq text-xs text-slate-400">{r.tx_hash.slice(0, 12)}…</td>
                <td className="px-5 py-2.5 text-right font-mono-merq text-slate-300">{fmt(r.ledger_amount)}</td>
                <td className="px-5 py-2.5 text-right font-mono-merq text-slate-300">{fmt(r.chain_amount)}</td>
                <td className="px-5 py-2.5"><Pill status={r.status} /></td>
                <td className="px-5 py-2.5 text-slate-500 text-xs">{dt(r.created_at)}</td>
                <td className="px-5 py-2.5 text-right"><a href={r.bscscan_url} target="_blank" rel="noreferrer" className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 text-xs">BscScan <ExternalLink className="h-3 w-3" /></a></td>
              </tr>
            ))}
          </Table>
        ) : <Empty />}
      </Panel>
    </div>
  );
}
