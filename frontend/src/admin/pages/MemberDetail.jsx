import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../adminApi";
import { useAdminAuth } from "../AdminAuth";
import { useAdminData, AHeader, Panel, Table, Pill, KCard, Btn, Loading, fmt, dt } from "../ui";
import { INCOME_META } from "@/lib/format";
import { ArrowLeft, Ban, CheckCircle2, Pause, StickyNote, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function MemberDetail() {
  const { address } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { can } = useAdminAuth();
  const [note, setNote] = useState("");
  const { data, isLoading } = useAdminData(["adm-member", address], `/members/${address}`);
  const canEdit = can("members", true);

  const act = async (action, extra = {}) => {
    try {
      await adminApi.post(`/members/${address}/action`, { action, ...extra });
      toast.success("Action applied");
      qc.invalidateQueries({ queryKey: ["adm-member", address] });
      setNote("");
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  if (isLoading || !data) return <Loading />;
  const o = data.overview, f = data.financial, n = data.network;

  return (
    <div>
      <button onClick={() => navigate("/admin/members")} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Members
      </button>
      <AHeader title={o.member_id} subtitle={o.address}>
        <Pill status={o.status} />
      </AHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KCard label="Total Deposits" value={fmt(f.total_deposits, 0)} accent="emerald" />
        <KCard label="Total Withdrawals" value={fmt(f.total_withdrawals, 0)} accent="rose" />
        <KCard label="Available" value={fmt(f.available, 0)} accent="amber" />
        <KCard label="Total Earned" value={fmt(f.total_earned, 0)} accent="cyan" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Panel title="Income Breakdown" className="p-5">
          <div className="space-y-2">
            {Object.entries(f.income).map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-400">
                  <span className="h-2 w-2 rounded-full" style={{ background: INCOME_META[k]?.color }} />{INCOME_META[k]?.label}</span>
                <span className="font-mono-merq text-white">{fmt(v)}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Network" className="p-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info l="Direct" v={n.direct} /><Info l="Team" v={n.team} />
            <Info l="Left Members" v={n.left.members} /><Info l="Right Members" v={n.right.members} />
            <Info l="Left Volume" v={fmt(n.left.volume, 0)} /><Info l="Right Volume" v={fmt(n.right.volume, 0)} />
            <Info l="Rank" v={o.rank} /><Info l="Team Volume" v={fmt(n.team_volume, 0)} />
          </div>
        </Panel>

        <Panel title="Admin Actions" className="p-5">
          {canEdit ? (
            <div className="space-y-2">
              <Btn testid="member-activate" variant="emerald" className="w-full" onClick={() => act("activate")}><CheckCircle2 className="h-4 w-4" /> Activate</Btn>
              <Btn testid="member-suspend" variant="ghost" className="w-full" onClick={() => act("suspend")}><Pause className="h-4 w-4" /> Suspend</Btn>
              <Btn testid="member-block" variant="danger" className="w-full" onClick={() => act("block")}><Ban className="h-4 w-4" /> Block</Btn>
              <div className="pt-3 border-t border-white/5 mt-3">
                <textarea data-testid="member-note-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add internal note…"
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-amber-400/40" rows={2} />
                <Btn testid="member-note-save" variant="ghost" className="w-full mt-2" disabled={!note} onClick={() => act("note", { note })}>
                  <StickyNote className="h-4 w-4" /> Save Note
                </Btn>
              </div>
            </div>
          ) : <p className="text-sm text-slate-500">Your role has read-only access to members.</p>}
          {data.notes?.length > 0 && (
            <div className="mt-4 space-y-2">
              {data.notes.map((nt, i) => (
                <div key={i} className="text-xs text-slate-400 rounded-lg bg-white/5 p-2">
                  "{nt.note}" <span className="text-slate-600">— {nt.by}, {dt(nt.at)}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Recent Activity" className="mt-5">
        {data.activity.length ? (
          <Table columns={[{ label: "Type" }, { label: "Amount", right: true }, { label: "Status" }, { label: "Date" }, { label: "Tx", right: true }]}>
            {data.activity.map((t, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-5 py-2.5 text-slate-200">{INCOME_META[t.type]?.label || t.type}</td>
                <td className={`px-5 py-2.5 text-right font-mono-merq ${t.amount < 0 ? "text-rose-400" : "text-emerald-400"}`}>{t.amount < 0 ? "" : "+"}{fmt(t.amount)}</td>
                <td className="px-5 py-2.5"><Pill status={t.status} /></td>
                <td className="px-5 py-2.5 text-slate-500 text-xs">{dt(t.created_at)}</td>
                <td className="px-5 py-2.5 text-right"><a href={t.bscscan_url} target="_blank" rel="noreferrer" className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 text-xs">View <ExternalLink className="h-3 w-3" /></a></td>
              </tr>
            ))}
          </Table>
        ) : <div className="py-8 text-center text-slate-500 text-sm">No activity.</div>}
      </Panel>
    </div>
  );
}

function Info({ l, v }) {
  return <div><div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">{l}</div><div className="font-mono-merq text-white mt-0.5">{v}</div></div>;
}
