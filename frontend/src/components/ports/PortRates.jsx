import { fmt } from "@/lib/format";
import { TrendingUp, CalendarDays, Wallet, Lock } from "lucide-react";

export const PortRates = ({ portKey, rates }) => {
  const unity = portKey === "unity";
  const tiers = [...rates.unity_tiers].sort((a, b) => a.min_usd - b.min_usd);
  const daily = unity ? `${fmt(tiers[0].daily_pct)}% – ${fmt(tiers[tiers.length - 1].daily_pct)}%` : `${fmt(rates.entry_daily_pct)}%`;
  const monthly = unity ? `${fmt(tiers[0].daily_pct * 30, 0)}% – ${fmt(tiers[tiers.length - 1].daily_pct * 30, 0)}%` : `${fmt(rates.entry_daily_pct * 30, 0)}%`;
  const items = [
    [TrendingUp, "Daily rate", `${daily} per day`],
    [CalendarDays, "Monthly rate", `${monthly} every month`],
    [Wallet, "Principal withdrawal", unity ? "After lock" : "Anytime"],
    [Lock, "Locking period", unity ? `${Math.round(rates.unity_lock_days / 30)} months` : "No locking"],
  ];
  return (
    <div data-testid="port-rates" className="mb-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map(([Icon, l, v]) => (
          <div key={l} className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400"><Icon className="h-5 w-5" /></span>
            <div>
              <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">{l}</div>
              <div className="font-display font-bold text-amber-200">{v}</div>
            </div>
          </div>
        ))}
      </div>
      {unity && (
        <div data-testid="port-unity-tiers" className="flex flex-wrap gap-2 mt-3 text-xs">
          {tiers.map((t, i) => (
            <span key={i} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono-merq text-slate-300">
              ${fmt(t.min_usd, 0)}{tiers[i + 1] ? `–$${fmt(tiers[i + 1].min_usd - 1, 0)}` : "+"} → <span className="text-amber-300">{fmt(t.daily_pct)}%/day</span>
            </span>
          ))}
          <span className="rounded-full border border-violet-400/25 bg-violet-400/5 px-3 py-1 text-violet-200">Your sponsor earns {fmt(rates.sponsor_pct, 0)}% instantly on Unity Port</span>
        </div>
      )}
    </div>
  );
};
