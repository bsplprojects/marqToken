import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { fmt } from "@/lib/format";
import { PartyPopper, Crown, X, ArrowRight } from "lucide-react";

const SPARKS = Array.from({ length: 14 }, (_, i) => i);

export const CelebrationBanner = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ["celebrations"], queryFn: async () => (await api.get("/income/celebrations")).data, refetchInterval: 60000 });
  const c = data?.[0];
  if (!c) return null;
  const isRank = c.kind === "rank";
  const dismiss = async (go) => {
    await api.post(`/income/celebrations/${c.id}/seen`);
    qc.invalidateQueries({ queryKey: ["celebrations"] });
    if (go) navigate(isRank ? "/income/port-rank-rewards" : "/trees");
  };
  const Icon = isRank ? Crown : PartyPopper;

  return (
    <div data-testid="celebration-banner" className="celebrate-in relative overflow-hidden rounded-3xl border border-amber-400/40 bg-gradient-to-r from-amber-500/20 via-amber-300/10 to-transparent p-5 sm:p-6 mb-6 gold-glow">
      {SPARKS.map((i) => (
        <span key={i} className="spark" style={{ left: `${(i * 7.3) % 100}%`, animationDelay: `${(i % 7) * 0.35}s` }} />
      ))}
      <div className="relative flex flex-wrap items-center gap-4">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/30"><Icon className="h-7 w-7" /></span>
        <div className="flex-1 min-w-[200px]">
          <div className="font-mono-merq text-[10px] uppercase tracking-[0.25em] text-amber-300">{isRank ? "New rank achieved" : "Board upgrade"}</div>
          <div data-testid="celebration-title" className="font-display text-2xl sm:text-3xl font-black text-white mt-1">
            {isRank ? <>You reached <span className="gold-text">{c.title}</span></> : <>You moved up to <span className="gold-text">{c.title}</span></>}
          </div>
          <div className="text-sm text-slate-300 mt-1">
            {isRank ? `A one-time reward of $${fmt(c.usd)} has been added to your balance.` : `Your ${c.from_board} savings are complete, so you entered ${c.title} automatically. Bigger payouts start now.`}
          </div>
        </div>
        <button data-testid="celebration-view" onClick={() => dismiss(true)} className="inline-flex items-center gap-2 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold px-5 py-2.5 transition-colors">
          {isRank ? "View rank" : "View board"} <ArrowRight className="h-4 w-4" />
        </button>
        <button data-testid="celebration-dismiss" onClick={() => dismiss(false)} className="absolute -top-2 -right-2 sm:static p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors" aria-label="Dismiss"><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
};
