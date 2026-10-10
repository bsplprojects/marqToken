import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fmt } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";
import {
  Sparkles, Users, Network, TrendingUp, Crown, Award, Lock, CheckCircle2, Gift,
} from "lucide-react";

const ICONS = { sparkles: Sparkles, users: Users, network: Network, "trending-up": TrendingUp, crown: Crown, award: Award };

export default function Rewards() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(null);
  const { data } = useQuery({ queryKey: ["rewards"], queryFn: async () => (await api.get("/rewards")).data });

  const claim = async (key) => {
    setBusy(key);
    try {
      const res = await api.post("/rewards/claim", { key });
      toast.success(`Claimed ${res.data.reward} MERQ`);
      qc.invalidateQueries({ queryKey: ["rewards"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Claim failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Achievements" title="Rewards"
        subtitle="Earn MERQ for measurable milestones — healthy, product-driven incentives rather than pure recruiting." />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="rewards-grid">
        {(data || []).map((r) => {
          const Icon = ICONS[r.icon] || Award;
          return (
            <div
              key={r.key}
              className={`glass card-hover rounded-2xl p-6 border relative overflow-hidden ${
                r.claimed ? "border-emerald-400/20" : r.unlocked ? "border-amber-400/30 gold-glow" : "border-white/8"
              }`}
            >
              <div className="flex items-start justify-between">
                <span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${
                  r.unlocked ? "bg-amber-400/10 text-amber-400" : "bg-white/5 text-slate-600"
                }`}>
                  <Icon className="h-6 w-6" />
                </span>
                {r.claimed ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-mono-merq uppercase tracking-widest">
                    <CheckCircle2 className="h-4 w-4" /> Claimed
                  </span>
                ) : r.unlocked ? (
                  <span className="text-xs text-amber-400 font-mono-merq uppercase tracking-widest">Unlocked</span>
                ) : (
                  <Lock className="h-4 w-4 text-slate-600" />
                )}
              </div>

              <h3 className="font-display font-semibold text-white mt-4 text-lg">{r.title}</h3>
              <div className="font-mono-merq text-amber-300 text-sm mt-1">+{fmt(r.reward, 0)} MERQ</div>

              <div className="mt-4">
                <div className="flex justify-between font-mono-merq text-[10px] text-slate-500 mb-1">
                  <span>{fmt(r.current, 0)} / {fmt(r.threshold, 0)}</span>
                  <span>{r.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
                    style={{ width: `${r.progress}%` }} />
                </div>
              </div>

              <button
                data-testid={`claim-reward-${r.key}`}
                disabled={!r.unlocked || r.claimed || busy === r.key}
                onClick={() => claim(r.key)}
                className={`mt-5 w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  r.unlocked && !r.claimed
                    ? "bg-amber-400 hover:bg-amber-300 text-slate-950"
                    : "bg-white/5 text-slate-600 cursor-not-allowed"
                }`}
              >
                <Gift className="h-4 w-4" />
                {r.claimed ? "Claimed" : r.unlocked ? "Claim Reward" : "Locked"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
