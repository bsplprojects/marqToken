import { useState } from "react";
import { useAdminData, AHeader, Panel, KCard, fmt } from "../ui";
import TreeView from "@/components/TreeView";
import { Search } from "lucide-react";

export default function NetworkPage() {
  const [root, setRoot] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("placement");
  const { data } = useAdminData(["adm-network", query], `/network${query ? `?root=${query}` : ""}`);
  const s = data?.summary;

  return (
    <div>
      <AHeader title="Network Trees" subtitle="Inspect any member's sponsor (referral) and binary placement trees.">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5">
          <Search className="h-4 w-4 text-slate-500" />
          <input value={root} onChange={(e) => setRoot(e.target.value)} placeholder="Root wallet 0x…"
            className="bg-transparent text-sm text-white outline-none font-mono-merq w-44" data-testid="network-root-input" />
          <button onClick={() => setQuery(root)} className="text-amber-400 text-xs font-semibold">Go</button>
        </div>
      </AHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KCard label="Direct" value={s?.direct ?? 0} accent="amber" />
        <KCard label="Total Team" value={s?.team ?? 0} accent="cyan" />
        <KCard label="Left Leg" value={`${s?.left?.members ?? 0} · ${fmt(s?.left?.volume, 0)}`} accent="emerald" />
        <KCard label="Right Leg" value={`${s?.right?.members ?? 0} · ${fmt(s?.right?.volume, 0)}`} accent="violet" />
      </div>

      <Panel className="p-4">
        <div className="flex gap-2 mb-2">
          <button data-testid="net-placement-tab" onClick={() => setTab("placement")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === "placement" ? "bg-amber-400/10 text-amber-300" : "text-slate-400"}`}>Placement Tree</button>
          <button data-testid="net-sponsor-tab" onClick={() => setTab("sponsor")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === "sponsor" ? "bg-amber-400/10 text-amber-300" : "text-slate-400"}`}>Sponsor Tree</button>
        </div>
        {tab === "placement" ? <TreeView root={data?.placement_tree} type="placement" /> : <TreeView root={data?.sponsor_tree} type="sponsor" />}
      </Panel>
    </div>
  );
}
