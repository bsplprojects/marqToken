import { PageHeader } from "@/components/PageHeader";
import { BarChart3, TrendingUp, Coins, PieChart } from "lucide-react";

export default function TokenInsights() {
  return (
    <div data-testid="ecosystem-token-insights">
      <PageHeader title="Token Insights" eyebrow="Ecosystem" subtitle="Deep analytics and real-time data on MERQ token performance." />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-2">
        {[
          { icon: TrendingUp, title: "Price Analytics", desc: "Live price tracking, historical charts, and volatility metrics." },
          { icon: PieChart, title: "Distribution Map", desc: "Token holder distribution, whale tracking, and supply analysis." },
          { icon: Coins, title: "On-Chain Metrics", desc: "Transaction volume, active wallets, and network health indicators." },
        ].map((c, i) => (
          <div key={i} className="group glass rounded-2xl border border-white/8 p-6 hover:border-cyan-400/20 transition-all duration-500">
            <div className="h-12 w-12 rounded-xl bg-cyan-400/10 flex items-center justify-center mb-4 group-hover:bg-cyan-400/15 transition-colors">
              <c.icon className="h-6 w-6 text-cyan-400" />
            </div>
            <h3 className="text-white font-semibold text-base mb-2">{c.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl border border-white/8 p-8 mt-6 text-center">
        <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-cyan-600/10 items-center justify-center mb-4">
          <BarChart3 className="h-8 w-8 text-cyan-400" />
        </div>
        <h2 className="text-white font-display text-xl font-bold mb-2">Coming Soon</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto">Token Insights dashboard is under development. Full analytics will be available shortly.</p>
      </div>
    </div>
  );
}
