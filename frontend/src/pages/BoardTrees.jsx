import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { BoardTree } from "@/components/BoardTree";
import { ArrowUp, Loader2 } from "lucide-react";

const BOARDS = ["MB1", "MB2", "MB3", "MB4", "MB5", "MB6", "MB7", "MB8", "GM"];

export default function BoardTrees() {
  const [board, setBoard] = useState("MB1");
  const [root, setRoot] = useState(null);
  const { data, isLoading } = useQuery({
    queryKey: ["board-tree", board, root],
    queryFn: async () => (await api.get(`/income/tree/${board}${root ? `?root=${root}` : ""}`)).data,
  });
  const pick = (b) => { setBoard(b); setRoot(null); };

  return (
    <div>
      <PageHeader eyebrow="Merq TechPass" title="Board Trees" subtitle="See who sits in each spot of your Momentum Booster boards and Global Momentum tree." />
      <div className="flex flex-wrap gap-2 mb-5">
        {BOARDS.map((b) => (
          <button key={b} data-testid={`tree-tab-${b}`} onClick={() => pick(b)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${board === b ? "bg-amber-400 text-slate-950" : "border border-white/10 text-slate-400 hover:text-white"}`}>
            {b === "GM" ? "Global Momentum" : b}
          </button>
        ))}
      </div>
      <div className="glass rounded-3xl border border-white/8 p-6">
        <div className="flex flex-wrap items-center gap-3 mb-5 text-xs font-mono-merq text-slate-500">
          <span>{board === "GM" ? "20 levels · $1 per spot" : "2-wide · 5 levels"}</span>
          <span>· showing {data?.depth ?? 5} levels below {data?.is_self ? "you" : data?.tree?.short}</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" /> your direct</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cyan-400" /> spillover</span>
          {data && !data.is_self && (
            <button data-testid="tree-back-to-me" onClick={() => setRoot(null)} className="ml-auto flex items-center gap-1 text-amber-400 hover:text-amber-300">
              <ArrowUp className="h-3.5 w-3.5" /> Back to me
            </button>
          )}
        </div>
        {isLoading ? (
          <div className="flex justify-center py-16 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : !data?.joined ? (
          <div data-testid="tree-not-joined" className="text-center text-sm text-slate-500 py-16">
            {board === "MB1" || board === "GM" ? "Activate your Merq TechPass to take your spot in this tree." : `You'll enter ${board} automatically when your upgrade savings are complete.`}
          </div>
        ) : (
          <BoardTree tree={data.tree} depth={data.depth} isSelf={data.is_self} onFocus={setRoot} />
        )}
      </div>
    </div>
  );
}
