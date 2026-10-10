import { useState } from "react";
import { useAdminData, AHeader, Panel, Table, Btn, Empty } from "../ui";
import { ADMIN_API } from "../adminApi";
import { Download, FileBarChart } from "lucide-react";

const TYPES = ["deposits", "withdrawals", "income", "members"];

export default function Reports() {
  const [type, setType] = useState("deposits");
  const { data } = useAdminData(["adm-report", type], `/reports/${type}`);

  const exportCsv = () => {
    const token = localStorage.getItem("merqon_admin_jwt");
    fetch(`${ADMIN_API}/reports/${type}/export`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob()).then((b) => {
        const url = URL.createObjectURL(b);
        const a = document.createElement("a");
        a.href = url; a.download = `merqon_${type}.csv`; a.click();
        URL.revokeObjectURL(url);
      });
  };

  return (
    <div>
      <AHeader title="Reports" subtitle="Financial, member and blockchain reports with CSV export.">
        <Btn testid="report-export" onClick={exportCsv}><Download className="h-4 w-4" /> Export CSV</Btn>
      </AHeader>

      <div className="flex gap-1 mb-4">
        {TYPES.map((t) => (
          <button key={t} data-testid={`report-type-${t}`} onClick={() => setType(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${type === t ? "bg-amber-400/10 text-amber-300" : "text-slate-400 hover:text-white"}`}>{t}</button>
        ))}
      </div>

      <Panel title={`${type} report · ${data?.total ?? 0} records`}>
        {data?.rows?.length ? (
          <Table columns={data.columns.map((c) => ({ label: c }))}>
            {data.rows.map((row, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                {row.map((cell, j) => (
                  <td key={j} className="px-5 py-2.5 font-mono-merq text-xs text-slate-300 truncate max-w-[220px]">{String(cell)}</td>
                ))}
              </tr>
            ))}
          </Table>
        ) : <Empty />}
      </Panel>
    </div>
  );
}
