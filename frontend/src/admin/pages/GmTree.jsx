import { useState } from "react";
import { useAdminData, AHeader, Panel, Btn, KCard, Empty } from "../ui";
import { BoardTree } from "@/components/BoardTree";
import { ArrowUp, Search, CalendarDays } from "lucide-react";

const short = (a) => `${a.slice(0, 8)}…${a.slice(-4)}`;
const istTime = (t) => `${new Date(t).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} IST`;
const inp = "bg-slate-900 border border-white/10 rounded-lg px-3 py-2 font-mono-merq text-sm text-white outline-none focus:border-amber-400/40";

const DayList = ({ days, onFocus }) => {
  const [open, setOpen] = useState(days[0]?.date);
  if (!days.length) return <Empty text="No one has joined the Global Momentum tree yet." />;
  return (
    <div className="divide-y divide-white/5">
      {days.map((d) => (
        <div key={d.date} data-testid={`gm-day-${d.date}`}>
          <button onClick={() => setOpen(open === d.date ? null : d.date)} className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/5 transition-colors">
            <span className="flex items-center gap-2 text-sm text-slate-200"><CalendarDays className="h-4 w-4 text-amber-400" />{new Date(`${d.date}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</span>
            <span className="font-mono-merq text-xs text-amber-300">{d.count} joined</span>
          </button>
          {open === d.date && (
            <div className="px-5 pb-3 space-y-1.5">
              {d.joins.map((j) => (
                <button key={j.address} data-testid="gm-day-join" onClick={() => onFocus(j.address)} className="w-full flex items-center justify-between rounded-lg bg-white/5 hover:bg-white/10 px-3 py-2 text-left transition-colors">
                  <span className="font-mono-merq text-xs text-white">{short(j.address)}</span>
                  <span className="font-mono-merq text-[11px] text-slate-500">under {short(j.parent)} · {istTime(j.joined_at)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default function GmTree() {
  const [root, setRoot] = useState(null);
  const [q, setQ] = useState("");
  const { data, error, isLoading } = useAdminData(["adm-gm-tree", root], `/gm-tree${root ? `?root=${root}` : ""}`, { retry: false, placeholderData: (prev) => prev });
  const focus = (a) => { setRoot(a.toLowerCase()); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const today = data?.days?.[0]?.date === new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10) ? data.days[0].count : 0;

  return (
    <div>
      <AHeader title="Global Momentum Tree" subtitle="One company-wide tree. Members enter once they have 2 active directs, filled level by level.">
        <input data-testid="gm-search" placeholder="Find wallet 0x…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && q && focus(q.trim())} className={`${inp} w-64`} />
        <Btn testid="gm-search-btn" variant="ghost" onClick={() => q && focus(q.trim())}><Search className="h-4 w-4" /> Find</Btn>
        {root && <Btn testid="gm-top-btn" onClick={() => setRoot(null)}><ArrowUp className="h-4 w-4" /> Back to top</Btn>}
      </AHeader>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        <KCard testid="gm-total" label="Members in tree" value={data?.members ?? 0} accent="amber" />
        <KCard testid="gm-today" label="Joined today (IST)" value={today} accent="emerald" />
        <KCard testid="gm-root" label="Company root" value={data?.company_root ? short(data.company_root) : "—"} accent="cyan" />
      </div>
      <div className="grid xl:grid-cols-3 gap-5">
        <Panel title={root ? `Tree below ${short(root)}` : "Whole company tree"} className="xl:col-span-2 p-5" testid="gm-tree-panel">
          {isLoading ? <div data-testid="gm-loading" className="text-sm text-slate-500 py-10 text-center">Loading tree…</div> : error ? <div data-testid="gm-error" className="text-sm text-rose-300">{error?.response?.data?.detail || "Could not load tree"}</div>
            : data?.tree ? <BoardTree tree={data.tree} depth={data.depth} isSelf={false} onFocus={focus} />
              : <Empty text="The Global Momentum tree is empty." />}
        </Panel>
        <Panel title="Who joined each day" testid="gm-days-panel">
          {isLoading ? <div className="text-sm text-slate-500 p-5">Loading…</div> : <DayList key={data?.days?.[0]?.date || "none"} days={data?.days || []} onFocus={focus} />}
        </Panel>
      </div>
    </div>
  );
}
