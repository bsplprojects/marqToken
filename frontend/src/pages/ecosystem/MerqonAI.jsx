import { PageHeader } from "@/components/PageHeader";
import { Bot, Sparkles, Cpu, ArrowRight } from "lucide-react";

export default function MerqonAI() {
  return (
    <div data-testid="ecosystem-merqon-ai">
      <PageHeader title="MerqON AI" eyebrow="Ecosystem" subtitle="Intelligent automation and insights powered by MerqON's AI engine." />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-2">
        {[
          { icon: Bot, title: "Smart Predictions", desc: "AI-driven market analysis and trend forecasting for smarter decisions." },
          { icon: Sparkles, title: "Auto Optimization", desc: "Automated portfolio balancing and yield strategies tailored to your goals." },
          { icon: Cpu, title: "Neural Engine", desc: "Deep learning models processing on-chain data in real time." },
        ].map((c, i) => (
          <div key={i} className="group glass rounded-2xl border border-white/8 p-6 hover:border-amber-400/20 transition-all duration-500">
            <div className="h-12 w-12 rounded-xl bg-amber-400/10 flex items-center justify-center mb-4 group-hover:bg-amber-400/15 transition-colors">
              <c.icon className="h-6 w-6 text-amber-400" />
            </div>
            <h3 className="text-white font-semibold text-base mb-2">{c.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl border border-white/8 p-8 mt-6 text-center">
        <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 items-center justify-center mb-4">
          <Bot className="h-8 w-8 text-amber-400" />
        </div>
        <h2 className="text-white font-display text-xl font-bold mb-2">Coming Soon</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto">MerqON AI is being trained and fine-tuned. Content and features will be available shortly.</p>
      </div>
    </div>
  );
}
