import { useState } from "react";
import { useAdminData, AHeader, Panel, Table, Pill, KCard, Empty, fmt, dt } from "../ui";
import { INCOME_META } from "@/lib/format";
import { ExternalLink } from "lucide-react";

export default function Income() {
  const [range, setRange] = useState("all");
  const { data } = useAdminData(["adm-income", range], `/income?range=${range}`);
  const ranges = ["today", "week", "month", "all"];

  return (
    <div>
      <AHeader title="Income Management" subtitle="All income generated across the five streams.">
        <div className="flex gap-1">
          {ranges.map((r) => (
            <button key={r} data-testid={`income-range-${r}`} onClick={() => setRange(r)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${range === r ? "bg-amber-400/10 text-amber-300" : "text-slate-400 hover:text-white"}`}>{r}</button>
          ))}
        </div>
      </AHeader>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-5">
        <KCard label="Total Generated" value={fmt(data?.total_generated, 0)} accent="amber" />
        {data && Object.entries(data.by_type).map(([k, v]) => (
          <KCard key={k} label={INCOME_META[k]?.label} value={fmt(v, 0)} accent={k === "profit_growth" ? "emerald" : k === "pg_commission" ? "cyan" : k === "reward" ? "violet" : k === "autopool" ? "rose" : "amber"} />
        ))}
      </div>

      <Panel title={`Recent Income (${data?.count || 0})`}>
        {data?.recent?.length ? (
          <Table columns={[{ label: "Date" }, { label: "Type" }, { label: "Member" }, { label: "Amount", right: true }, { label: "Status" }, { label: "Tx", right: true }]}>
            {data.recent.map((t, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-5 py-2.5 text-slate-500 text-xs">{dt(t.created_at)}</td>
                <td className="px-5 py-2.5"><span className="inline-flex items-center gap-2 text-slate-200"><span className="h-2 w-2 rounded-full" style={{ background: INCOME_META[t.type]?.color }} />{INCOME_META[t.type]?.label}</span></td>
                <td className="px-5 py-2.5 font-mono-merq text-slate-300">{t.address}</td>
                <td className="px-5 py-2.5 text-right font-mono-merq text-emerald-400">+{fmt(t.amount)}</td>
                <td className="px-5 py-2.5"><Pill status={t.status} /></td>
                <td className="px-5 py-2.5 text-right"><a href={t.bscscan_url} target="_blank" rel="noreferrer" className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 text-xs">View <ExternalLink className="h-3 w-3" /></a></td>
              </tr>
            ))}
          </Table>
        ) : <Empty />}
      </Panel>
    </div>
  );
}
