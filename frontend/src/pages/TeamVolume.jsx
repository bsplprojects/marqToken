import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { fmt } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { ArrowLeft, TrendingUp, Zap, Anchor, Layers, Users } from "lucide-react";

const CATEGORY_ICONS = {
  techpass: Zap,
  entry_port: Anchor,
  unity_port: Layers,
};

const CATEGORY_ACCENTS = {
  techpass: { border: "border-amber-400/20", bg: "bg-amber-400/5", text: "text-amber-400", bar: "bg-amber-400" },
  entry_port: { border: "border-cyan-400/20", bg: "bg-cyan-400/5", text: "text-cyan-400", bar: "bg-cyan-400" },
  unity_port: { border: "border-emerald-400/20", bg: "bg-emerald-400/5", text: "text-emerald-400", bar: "bg-emerald-400" },
};

export default function TeamVolume() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["volume-breakdown"],
    queryFn: async () => (await api.get("/network/volume-breakdown")).data,
    refetchInterval: 30000,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 bg-white/5 rounded-lg animate-pulse" />
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 glass rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const grandTotal = data.categories.reduce((s, c) => s + c.team + c.self, 0);

  return (
    <div>
      <button
        data-testid="team-volume-back-btn"
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 text-sm font-mono-merq"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>

      <PageHeader
        eyebrow="Network Analytics"
        title="Category-Wise Business Volume"
        subtitle="Breakdown of all purchase volume across your team"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div data-testid="vol-total-card" className="glass rounded-2xl p-6 border border-emerald-400/15">
          <div className="flex items-center justify-between">
            <span className="font-mono-merq text-[10px] uppercase tracking-[0.2em] text-slate-500">Total Business Volume</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-emerald-400 bg-emerald-400/10">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div className="font-mono-merq text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-3">
            ${fmt(grandTotal, 2)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Team + Self volume</div>
        </div>

        <div data-testid="vol-team-card" className="glass rounded-2xl p-6 border border-cyan-400/15">
          <div className="flex items-center justify-between">
            <span className="font-mono-merq text-[10px] uppercase tracking-[0.2em] text-slate-500">Team Volume</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-cyan-400 bg-cyan-400/10">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <div className="font-mono-merq text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-3">
            ${fmt(data.computed_total, 2)}
          </div>
          <div className="text-xs text-slate-500 mt-1">{data.downline_count} downline members</div>
        </div>

        <div data-testid="vol-stored-card" className="glass rounded-2xl p-6 border border-amber-400/15">
          <div className="flex items-center justify-between">
            <span className="font-mono-merq text-[10px] uppercase tracking-[0.2em] text-slate-500">Stored Team Volume</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-amber-400 bg-amber-400/10">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div className="font-mono-merq text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-3">
            ${fmt(data.team_volume, 2)}
          </div>
          <div className="text-xs text-slate-500 mt-1">From member record</div>
        </div>
      </div>

      {/* Category breakdown */}
      <h2 className="font-display text-lg font-bold text-white mb-4">Volume by Category</h2>
      <div className="space-y-4">
        {data.categories.map((cat) => {
          const accent = CATEGORY_ACCENTS[cat.key] || CATEGORY_ACCENTS.techpass;
          const CatIcon = CATEGORY_ICONS[cat.key] || TrendingUp;
          const catTotal = cat.team + cat.self;
          const pct = grandTotal > 0 ? (catTotal / grandTotal) * 100 : 0;

          return (
            <div
              key={cat.key}
              data-testid={`vol-cat-${cat.key}`}
              className={`glass rounded-2xl p-6 border ${accent.border}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${accent.bg} ${accent.text}`}>
                  <CatIcon className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-display text-base font-semibold text-white">{cat.label}</div>
                  <div className="text-xs text-slate-500">{pct.toFixed(1)}% of total volume</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="font-mono-merq text-2xl font-bold text-white">${fmt(catTotal, 2)}</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 rounded-full bg-white/5 mb-4 overflow-hidden">
                <div className={`h-full rounded-full ${accent.bar} transition-all duration-700`} style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-white/3 p-3">
                  <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500 mb-1">Team</div>
                  <div className="font-mono-merq text-lg font-bold text-white">${fmt(cat.team, 2)}</div>
                </div>
                <div className="rounded-xl bg-white/3 p-3">
                  <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500 mb-1">Self</div>
                  <div className="font-mono-merq text-lg font-bold text-white">${fmt(cat.self, 2)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
