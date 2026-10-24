import { Brain, LineChart, Wallet, Users, ArrowRight } from "lucide-react";

// Sample figures — replace with final MerqAI revenue model.
const SOURCES = [
  { icon: Brain, title: "AI Subscriptions", desc: "Monthly plans for MerqON AI chat, research, coding and content tools." },
  { icon: LineChart, title: "Algo Trading Fees", desc: "Performance and service fees from the algorithmic trading framework." },
  { icon: Wallet, title: "Utility & Transaction Fees", desc: "Fees from digital payments, merchant services and token utilities." },
  { icon: Users, title: "Membership Packages", desc: "Platform access packages purchased by ecosystem members." },
];

const SPLIT = [
  { label: "Member Rewards Pool", pct: 50, color: "#F3BA2F" },
  { label: "Treasury Reserve", pct: 20, color: "#d4a017" },
  { label: "Technology & Development", pct: 15, color: "#22d3ee" },
  { label: "Liquidity Support", pct: 10, color: "#34d399" },
  { label: "Operations", pct: 5, color: "#a78bfa" },
];

export const RevenueStructure = () => (
  <div data-testid="revenue-structure" className="grid lg:grid-cols-2 gap-5">
    <div className="glass rounded-3xl border border-white/8 p-6 sm:p-7">
      <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500 mb-4">Revenue sources</div>
      <div className="space-y-3">
        {SOURCES.map((s, i) => (
          <div key={s.title} data-testid={`revenue-source-${i}`} className="flex items-start gap-4 rounded-2xl border border-white/8 bg-white/5 p-4 card-hover">
            <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400"><s.icon className="h-5 w-5" /></span>
            <div className="flex-1">
              <div className="font-display font-semibold text-white">{s.title}</div>
              <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{s.desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-amber-400/50 mt-3 hidden sm:block" />
          </div>
        ))}
      </div>
    </div>

    <div className="glass rounded-3xl gold-border p-6 sm:p-7 flex flex-col">
      <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">How revenue is shared</div>
      <div className="font-display text-2xl font-black text-white mt-1">MerqAI Revenue <span className="gold-text">Distribution</span></div>
      <div className="flex h-4 rounded-full overflow-hidden mt-6 ring-1 ring-white/10">
        {SPLIT.map((s) => <div key={s.label} style={{ width: `${s.pct}%`, background: s.color }} title={`${s.label} ${s.pct}%`} />)}
      </div>
      <div className="space-y-3 mt-6 flex-1">
        {SPLIT.map((s, i) => (
          <div key={s.label} data-testid={`revenue-split-${i}`}>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-300"><span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />{s.label}</span>
              <span className="font-mono-merq font-semibold text-amber-300">{s.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 mt-1.5 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${s.pct * 2}%`, background: s.color }} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-slate-600 mt-6">Sample structure for illustration. Final percentages will be confirmed and may be updated.</p>
    </div>
  </div>
);
