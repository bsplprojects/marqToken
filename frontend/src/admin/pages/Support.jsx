import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../adminApi";
import { useAdminAuth } from "../AdminAuth";
import { useAdminData, AHeader, Panel, Table, Pill, Empty, dt } from "../ui";
import { toast } from "sonner";

export default function Support() {
  const [status, setStatus] = useState("all");
  const qc = useQueryClient();
  const { can } = useAdminAuth();
  const { data } = useAdminData(["adm-tickets", status], `/tickets?status=${status}`);
  const canEdit = can("support", true);
  const filters = ["all", "open", "in_progress", "resolved", "closed"];

  const change = async (id, newStatus) => {
    try { await adminApi.put(`/tickets/${id}`, { status: newStatus }); toast.success("Ticket updated");
      qc.invalidateQueries({ queryKey: ["adm-tickets", status] }); }
    catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  const prColor = { high: "text-rose-400", medium: "text-amber-400", low: "text-slate-400" };

  return (
    <div>
      <AHeader title="Support" subtitle="Member complaints and support tickets." />
      <Panel>
        <div className="flex gap-1 px-5 py-3.5 border-b border-white/5 overflow-x-auto">
          {filters.map((f) => (
            <button key={f} onClick={() => setStatus(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize whitespace-nowrap transition-colors ${status === f ? "bg-amber-400/10 text-amber-300" : "text-slate-400 hover:text-white"}`}>{f.replace("_", " ")}</button>
          ))}
        </div>
        {data && data.length ? (
          <Table testid="tickets-table" columns={[{ label: "ID" }, { label: "Category" }, { label: "Subject" }, { label: "Priority" },
            { label: "Status" }, { label: "Created" }, { label: "Action" }]}>
            {data.map((t) => (
              <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-5 py-3 font-mono-merq text-xs text-amber-300">{t.id}</td>
                <td className="px-5 py-3 text-slate-300">{t.category}</td>
                <td className="px-5 py-3 text-slate-200">{t.subject}</td>
                <td className={`px-5 py-3 text-xs font-semibold uppercase ${prColor[t.priority]}`}>{t.priority}</td>
                <td className="px-5 py-3"><Pill status={t.status} /></td>
                <td className="px-5 py-3 text-slate-500 text-xs">{dt(t.created_at)}</td>
                <td className="px-5 py-3">
                  {canEdit ? (
                    <select data-testid={`ticket-status-${t.id}`} value={t.status} onChange={(e) => change(t.id, e.target.value)}
                      className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none focus:border-amber-400/40">
                      {["open", "in_progress", "waiting", "resolved", "closed"].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : <span className="text-slate-600 text-xs">—</span>}
                </td>
              </tr>
            ))}
          </Table>
        ) : <Empty text="No tickets." />}
      </Panel>
    </div>
  );
}
