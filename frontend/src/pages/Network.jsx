import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fmt, fmtDate } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import TreeView from "@/components/TreeView";
import { Users, ArrowLeftRight, GitBranch, Network as NetIcon } from "lucide-react";

export default function Network() {
  const [tab, setTab] = useState("placement");
  const { data } = useQuery({ queryKey: ["tree"], queryFn: async () => (await api.get("/network/tree")).data });
  const { data: directs } = useQuery({ queryKey: ["directs"], queryFn: async () => (await api.get("/network/directs")).data });

  const s = data?.summary;

  return (
    <div>
      <PageHeader eyebrow="Network Intelligence" title="My Network"
        subtitle="Two trees power MerqON: the sponsor tree (who referred whom) and the binary placement tree (where members sit)." />

      {/* summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass rounded-2xl p-5 border border-cyan-400/15">
          <div className="font-mono-merq text-[10px] uppercase tracking-widest text-cyan-400/70">Left Leg</div>
          <div className="font-mono-merq text-2xl font-bold text-white mt-2">{s?.left.members ?? 0}</div>
          <div className="text-xs text-slate-500 mt-1">{fmt(s?.left.volume, 0)} MERQ volume</div>
        </div>
        <div className="glass rounded-2xl p-5 border border-amber-400/15">
          <div className="font-mono-merq text-[10px] uppercase tracking-widest text-amber-400/70">Right Leg</div>
          <div className="font-mono-merq text-2xl font-bold text-white mt-2">{s?.right.members ?? 0}</div>
          <div className="text-xs text-slate-500 mt-1">{fmt(s?.right.volume, 0)} MERQ volume</div>
        </div>
        <div className="glass rounded-2xl p-5 border border-white/8">
          <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">Total Team</div>
          <div className="font-mono-merq text-2xl font-bold text-white mt-2">{s?.total_members ?? 0}</div>
          <div className="text-xs text-slate-500 mt-1">{s?.direct_members ?? 0} direct</div>
        </div>
        <div className="glass rounded-2xl p-5 border border-emerald-400/15">
          <div className="font-mono-merq text-[10px] uppercase tracking-widest text-emerald-400/70">Total Volume</div>
          <div className="font-mono-merq text-2xl font-bold text-white mt-2">{fmt(s?.total_volume, 0)}</div>
          <div className="text-xs text-slate-500 mt-1">MERQ</div>
        </div>
      </div>

      {/* tree */}
      <div className="glass rounded-2xl border border-white/8 p-4 sm:p-6 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <button
            data-testid="placement-tree-tab"
            onClick={() => setTab("placement")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              tab === "placement" ? "bg-amber-400/10 text-amber-300 border border-amber-400/20" : "text-slate-400 hover:text-white border border-transparent"
            }`}
          >
            <ArrowLeftRight className="h-4 w-4" /> Placement Tree (Binary)
          </button>
          <button
            data-testid="sponsor-tree-tab"
            onClick={() => setTab("sponsor")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              tab === "sponsor" ? "bg-amber-400/10 text-amber-300 border border-amber-400/20" : "text-slate-400 hover:text-white border border-transparent"
            }`}
          >
            <GitBranch className="h-4 w-4" /> Sponsor Tree (Referral)
          </button>
        </div>
        {tab === "placement"
          ? <TreeView root={data?.placement_tree} type="placement" />
          : <TreeView root={data?.sponsor_tree} type="sponsor" />}
      </div>

      {/* directs table */}
      <div className="glass rounded-2xl border border-white/8 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5">
          <Users className="h-5 w-5 text-amber-400" />
          <h3 className="font-display font-semibold text-white">Direct Referrals</h3>
          <span className="ml-auto font-mono-merq text-xs text-slate-500">{directs?.length ?? 0} members</span>
        </div>
        {directs && directs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="directs-table">
              <thead>
                <tr className="text-left font-mono-merq text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/5">
                  <th className="px-6 py-3">Member</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Rank</th>
                  <th className="px-6 py-3">Joined</th>
                  <th className="px-6 py-3 text-right">Volume</th>
                </tr>
              </thead>
              <tbody>
                {directs.map((d) => (
                  <tr key={d.address} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-3 font-mono-merq text-slate-200">{d.short}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs ${d.status === "active" ? "text-emerald-400" : "text-slate-500"}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" /> {d.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-300">{d.rank}</td>
                    <td className="px-6 py-3 text-slate-500">{fmtDate(d.joined_at)}</td>
                    <td className="px-6 py-3 text-right font-mono-merq text-amber-300">{fmt(d.team_volume, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-sm">
            <NetIcon className="h-8 w-8 mx-auto mb-3 text-slate-700" />
            No direct referrals yet. Share your referral link to grow your network.
          </div>
        )}
      </div>
    </div>
  );
}
