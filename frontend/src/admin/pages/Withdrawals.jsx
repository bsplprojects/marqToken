import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../adminApi";
import { useAdminAuth } from "../AdminAuth";
import { useAdminData, AHeader, Panel, Table, Pill, Empty, fmt, dt } from "../ui";
import { toast } from "sonner";
import { Check, X, Pause, Play, RotateCcw, ExternalLink } from "lucide-react";
import { TreasuryPanel } from "./TreasuryPanel";

export default function Withdrawals() {
  const [status, setStatus] = useState("pending");
  const qc = useQueryClient();
  const { can } = useAdminAuth();
  const { data } = useAdminData(["adm-withdrawals", status], `/withdrawals?status=${status}`);
  const canEdit = can("withdrawals", true);

  const filters = ["pending", "under_review", "sent", "completed", "payout_failed", "rejected", "all"];

  const act = async (id, action) => {
    let reason = null;
    if (action === "reject" || action === "hold") {
      reason = window.prompt(`Reason for ${action}:`) || "";
      if (!reason) return;
    }
    try {
      const { data: res } = await adminApi.post(`/withdrawals/${id}/action`, { action, reason });
      if (res.status === "payout_failed") toast.error(`Approved, but payout failed: ${res.reason}`);
      else if (res.status === "sent") toast.success("MERQ sent on-chain");
      else toast.success(`Withdrawal ${action}d`);
      qc.invalidateQueries({ queryKey: ["adm-withdrawals", status] });
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  return (
    <div>
      <AHeader title="Withdrawals" subtitle="Real MERQ payouts from the treasury wallet. Small withdrawals send automatically; larger ones need approval." />
      <TreasuryPanel canEdit={canEdit} />
      <Panel>
        <div className="flex gap-1 px-5 py-3.5 border-b border-white/5 overflow-x-auto">
          {filters.map((f) => (
            <button key={f} data-testid={`wd-filter-${f}`} onClick={() => setStatus(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize whitespace-nowrap transition-colors ${
                status === f ? "bg-amber-400/10 text-amber-300" : "text-slate-400 hover:text-white"}`}>{f.replace("_", " ")}</button>
          ))}
        </div>
        {data && data.length ? (
          <Table testid="withdrawals-table" columns={[{ label: "Request" }, { label: "Member" }, { label: "Amount", right: true },
            { label: "Fee", right: true }, { label: "Net", right: true }, { label: "Status" }, { label: "Date" }, { label: "Actions" }]}>
            {data.map((w) => (
              <tr key={w.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-5 py-3 font-mono-merq text-xs text-amber-300">{w.id}</td>
                <td className="px-5 py-3 font-mono-merq text-slate-300">{w.address}</td>
                <td className="px-5 py-3 text-right font-mono-merq text-white">{fmt(w.amount)}</td>
                <td className="px-5 py-3 text-right font-mono-merq text-slate-500">{fmt(w.fee + w.protocol_fee)}</td>
                <td className="px-5 py-3 text-right font-mono-merq text-emerald-400">{fmt(w.net)}</td>
                <td className="px-5 py-3">
                  <Pill status={w.status} />
                  {w.reason && <div className="text-[10px] text-rose-300 mt-1 max-w-[220px]">{w.reason}</div>}
                  {w.bscscan_url && <a href={w.bscscan_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-amber-400 mt-1">BscScan <ExternalLink className="h-3 w-3" /></a>}
                </td>
                <td className="px-5 py-3 text-slate-500 text-xs">{dt(w.created_at)}</td>
                <td className="px-5 py-3">
                  {canEdit && ["pending", "under_review"].includes(w.status) ? (
                    <div className="flex gap-1.5">
                      <button data-testid={`wd-approve-${w.id}`} onClick={() => act(w.id, "approve")} title="Approve" className="h-7 w-7 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 flex items-center justify-center"><Check className="h-4 w-4" /></button>
                      <button data-testid={`wd-reject-${w.id}`} onClick={() => act(w.id, "reject")} title="Reject" className="h-7 w-7 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 flex items-center justify-center"><X className="h-4 w-4" /></button>
                      {w.status === "pending"
                        ? <button onClick={() => act(w.id, "hold")} title="Hold" className="h-7 w-7 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 flex items-center justify-center"><Pause className="h-4 w-4" /></button>
                        : <button onClick={() => act(w.id, "release")} title="Release" className="h-7 w-7 rounded-lg bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 flex items-center justify-center"><Play className="h-4 w-4" /></button>}
                    </div>
                  ) : canEdit && w.status === "payout_failed" ? (
                    <div className="flex gap-1.5">
                      <button data-testid={`wd-retry-${w.id}`} onClick={() => act(w.id, "retry")} title="Retry payout" className="h-7 w-7 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 flex items-center justify-center"><RotateCcw className="h-4 w-4" /></button>
                      <button data-testid={`wd-reject-${w.id}`} onClick={() => act(w.id, "reject")} title="Reject & refund" className="h-7 w-7 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 flex items-center justify-center"><X className="h-4 w-4" /></button>
                    </div>
                  ) : <span className="text-slate-600 text-xs">—</span>}
                </td>
              </tr>
            ))}
          </Table>
        ) : <Empty text="No withdrawal requests." />}
      </Panel>
    </div>
  );
}
