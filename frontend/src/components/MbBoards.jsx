import { CheckCircle2, Lock } from "lucide-react";
import { fmt } from "@/lib/format";

const Bar = ({ v, max, color }) => (
  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mt-1">
    <div className={`h-full rounded-full ${color}`} style={{ width: `${max ? Math.min(100, (v / max) * 100) : 0}%` }} />
  </div>
);

export const MbBoards = ({ boards }) => (
  <div data-testid="mb-boards" className="glass rounded-3xl border border-white/8 p-6 mt-6">
    <div className="font-display text-lg font-bold text-white mb-4">My Momentum Boosters</div>
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {boards.map((b) => (
        <div key={b.board} data-testid={`mb-board-${b.board}`}
          className={`rounded-2xl border p-4 ${b.joined ? "border-amber-400/25 bg-amber-400/5" : "border-white/8 bg-white/[0.02] opacity-60"}`}>
          <div className="flex items-center justify-between">
            <span className="font-display text-lg font-black gold-text">{b.board}</span>
            {b.upgraded ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : !b.joined && <Lock className="h-4 w-4 text-slate-600" />}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{b.joined ? `${b.team}/2 direct positions filled` : "Unlocks automatically"}</div>
          <div className="mt-3 text-xs font-mono-merq">
            <div className="flex justify-between text-slate-400"><span>Net profit</span><span className="text-white">${fmt(b.net)} / ${fmt(b.net_cap, 0)}</span></div>
            <Bar v={b.net} max={b.net_cap} color="bg-emerald-400" />
            {b.save_target > 0 && (
              <>
                <div className="flex justify-between text-slate-400 mt-2"><span>Upgrade savings</span><span className="text-white">${fmt(b.saved)} / ${fmt(b.save_target, 0)}</span></div>
                <Bar v={b.saved} max={b.save_target} color="bg-amber-400" />
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);
