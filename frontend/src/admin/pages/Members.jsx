import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminData, AHeader, Panel, Table, Pill, Empty, fmt, dt } from "../ui";
import { Search, Eye } from "lucide-react";

export default function Members() {
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { data } = useAdminData(["adm-members", status, search], `/members?status=${status}&search=${search}`);

  const filters = ["all", "active", "inactive", "suspended", "blocked"];

  return (
    <div>
      <AHeader title="Members" subtitle="Central registry of all platform members." testid="admin-members-page" />
      <Panel>
        <div className="flex flex-wrap items-center gap-3 px-5 py-3.5 border-b border-white/5">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-slate-500" />
            <input data-testid="members-search" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search wallet address…" className="bg-transparent text-sm text-white outline-none w-full font-mono-merq" />
          </div>
          <div className="flex gap-1">
            {filters.map((f) => (
              <button key={f} data-testid={`members-filter-${f}`} onClick={() => setStatus(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  status === f ? "bg-amber-400/10 text-amber-300" : "text-slate-400 hover:text-white"}`}>{f}</button>
            ))}
          </div>
        </div>
        {data && data.length ? (
          <Table testid="members-table" columns={[
            { label: "Member" }, { label: "Sponsor" }, { label: "Rank" }, { label: "Status" },
            { label: "Team", right: true }, { label: "Volume", right: true }, { label: "Balance", right: true },
            { label: "Joined" }, { label: "" },
          ]}>
            {data.map((m) => (
              <tr key={m.address} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-5 py-3 font-mono-merq text-slate-200">{m.short}{m.is_admin && <span className="ml-2 text-[9px] text-amber-400">ADMIN</span>}</td>
                <td className="px-5 py-3 font-mono-merq text-slate-500">{m.sponsor || "—"}</td>
                <td className="px-5 py-3 text-slate-300">{m.rank}</td>
                <td className="px-5 py-3"><Pill status={m.status} /></td>
                <td className="px-5 py-3 text-right font-mono-merq text-slate-300">{m.team_size}</td>
                <td className="px-5 py-3 text-right font-mono-merq text-amber-300">{fmt(m.business_volume, 0)}</td>
                <td className="px-5 py-3 text-right font-mono-merq text-slate-300">{fmt(m.balance, 0)}</td>
                <td className="px-5 py-3 text-slate-500 text-xs">{dt(m.joined_at)}</td>
                <td className="px-5 py-3 text-right">
                  <button data-testid={`member-view-${m.address}`} onClick={() => navigate(`/admin/members/${m.address}`)}
                    className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300">
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        ) : <Empty />}
      </Panel>
    </div>
  );
}
