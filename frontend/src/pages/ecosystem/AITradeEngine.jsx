import { PageHeader } from "@/components/PageHeader";
import { Activity, Zap, LineChart, Shield } from "lucide-react";

export default function AITradeEngine() {
  return (
    <div data-testid="ecosystem-ai-trade-engine">
      <PageHeader title="AI Trade Engine (Algo)" eyebrow="Ecosystem" subtitle="Algorithmic trading powered by AI for consistent, emotion-free execution." />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-2">
        {[
          { icon: Zap, title: "High-Speed Execution", desc: "Millisecond order placement with intelligent routing across liquidity pools." },
          { icon: LineChart, title: "Strategy Builder", desc: "Configure custom trading strategies with risk parameters and stop-loss rules." },
          { icon: Shield, title: "Risk Management", desc: "Built-in safeguards with position sizing, drawdown limits, and kill switches." },
        ].map((c, i) => (
          <div key={i} className="group glass rounded-2xl border border-white/8 p-6 hover:border-emerald-400/20 transition-all duration-500">
            <div className="h-12 w-12 rounded-xl bg-emerald-400/10 flex items-center justify-center mb-4 group-hover:bg-emerald-400/15 transition-colors">
              <c.icon className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="text-white font-semibold text-base mb-2">{c.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl border border-white/8 p-8 mt-6 text-center">
        <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/10 items-center justify-center mb-4">
          <Activity className="h-8 w-8 text-emerald-400" />
        </div>
        <h2 className="text-white font-display text-xl font-bold mb-2">Coming Soon</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto">The AI Trade Engine is being backtested and optimized. Launch details coming shortly.</p>
      </div>
    </div>
  );
}
