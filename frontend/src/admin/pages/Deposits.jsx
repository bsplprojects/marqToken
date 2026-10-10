import { useState } from "react";
import { useAdminData, AHeader, Panel, Table, Pill, Empty, fmt, dt } from "../ui";
import { Search, ExternalLink } from "lucide-react";

export default function Deposits() {
  const [search, setSearch] = useState("");
  const { data } = useAdminData(["adm-deposits", search], `/deposits?search=${search}`);
  return (
    <div>
      <AHeader title="Deposits" subtitle="Deposits are auto-verified from chain (simulated in v1). Read-only ledger." />
      <Panel>
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/5">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 flex-1">
            <Search className="h-4 w-4 text-slate-500" />
            <input data-testid="deposits-search" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search wallet or tx hash…" className="bg-transparent text-sm text-white outline-none w-full font-mono-merq" />
          </div>
        </div>
        {data && data.length ? (
          <Table testid="deposits-table" columns={[{ label: "Tx Hash" }, { label: "Wallet" }, { label: "Amount", right: true },
            { label: "Conf." }, { label: "Status" }, { label: "Recon." }, { label: "Date" }, { label: "", right: true }]}>
            {data.map((t) => (
              <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-5 py-3 font-mono-merq text-xs text-slate-400">{t.tx_hash.slice(0, 10)}…</td>
                <td className="px-5 py-3 font-mono-merq text-slate-300">{t.address}</td>
                <td className="px-5 py-3 text-right font-mono-merq text-emerald-400">+{fmt(t.amount)}</td>
                <td className="px-5 py-3 font-mono-merq text-slate-500">{t.confirmations}</td>
                <td className="px-5 py-3"><Pill status={t.status} /></td>
                <td className="px-5 py-3"><Pill status={t.reconciliation} /></td>
                <td className="px-5 py-3 text-slate-500 text-xs">{dt(t.date)}</td>
                <td className="px-5 py-3 text-right"><a href={t.bscscan_url} target="_blank" rel="noreferrer" className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 text-xs">BscScan <ExternalLink className="h-3 w-3" /></a></td>
              </tr>
            ))}
          </Table>
        ) : <Empty />}
      </Panel>
    </div>
  );
}
