import { fmt } from "@/lib/format";
import { CheckCircle2, Lock } from "lucide-react";

const Box = ({ title, children, testid }) => (
  <div data-testid={testid} className="glass rounded-3xl border border-white/8 p-6 mt-6">
    <div className="font-display text-lg font-bold text-white mb-4">{title}</div>
    {children}
  </div>
);

const Levels = ({ info }) => (
  <Box title="Level Income Plan" testid="port-levels">
    <div className={`flex items-center gap-2 text-sm mb-4 ${info.levels_unlocked ? "text-emerald-300" : "text-amber-200"}`}>
      {info.levels_unlocked ? <CheckCircle2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
      {info.levels_unlocked ? `All 8 levels unlocked — your port investment is $${fmt(info.self_invest_usd)}` :
        `Buy at least $${fmt(info.level_min_self_usd, 0)} in Entry or Unity Port to unlock all 8 levels (you have $${fmt(info.self_invest_usd)})`}
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {info.level_pcts.map((p, i) => (
        <div key={i} className="rounded-xl border border-white/8 bg-white/5 px-4 py-3 flex justify-between font-mono-merq text-sm">
          <span className="text-slate-400">Level {i + 1}</span><span className="text-amber-300 font-bold">{fmt(p, 0)}%</span>
        </div>
      ))}
    </div>
    <p className="text-xs text-slate-500 mt-3">Paid every day from your team's daily port earnings.</p>
  </Box>
);

const Ranks = ({ info }) => {
  const n = info.next_rank;
  const legs = [0, 1].map((i) => info.legs[i]?.usd || 0);
  return (
    <Box title="Rank & Rewards" testid="port-ranks">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <span className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">Current rank</span>
        <span data-testid="port-current-rank" className="font-display text-2xl font-black gold-text">{info.rank || "No rank yet"}</span>
        {n && <span className="text-xs text-slate-400 ml-auto">Next: <span className="text-amber-300 font-semibold">{n.name}</span> — ${fmt(n.leg_usd, 0)} in two legs{n.need_rank_name ? ` + ${n.need_count} ${n.need_rank_name} in team (${n.have_count}/${n.need_count})` : ""}</span>}
      </div>
      {n && (
        <div className="grid sm:grid-cols-2 gap-3 mb-5">
          {legs.map((v, i) => (
            <div key={i} data-testid={`port-leg-${i + 1}`} className="rounded-xl border border-white/8 bg-white/5 p-4">
              <div className="flex justify-between font-mono-merq text-xs text-slate-400"><span>Leg {i + 1} team business</span><span className="text-white">${fmt(v)} / ${fmt(n.leg_usd, 0)}</span></div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mt-2"><div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.min(100, (v / n.leg_usd) * 100)}%` }} /></div>
            </div>
          ))}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">
            <th className="py-2">Rank</th><th>Leg 1</th><th>Leg 2</th><th>Condition</th><th className="text-right">Reward</th></tr></thead>
          <tbody>
            {info.ranks.map((r, i) => (
              <tr key={r.name} className={`border-t border-white/5 ${i < info.rank_index ? "text-emerald-300" : "text-slate-300"}`}>
                <td className="py-2 font-display font-bold text-amber-300">{r.name}</td>
                <td className="font-mono-merq">${fmt(r.leg_usd, 0)}</td><td className="font-mono-merq">${fmt(r.leg_usd, 0)}</td>
                <td>{r.need_rank ? `${r.need_count} ${info.ranks[r.need_rank - 1].name}` : "—"}</td>
                <td className="text-right font-mono-merq">{fmt(r.pct, 1)}% · ${fmt(r.leg_usd * r.pct / 100, 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Box>
  );
};

export const PortIncomeInfo = ({ info, stream }) => {
  if (stream === "port_level_income") return <Levels info={info} />;
  if (stream === "port_rank_rewards") return <Ranks info={info} />;
  return null;
};
