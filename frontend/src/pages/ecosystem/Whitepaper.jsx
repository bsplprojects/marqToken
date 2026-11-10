import { PageHeader } from "@/components/PageHeader";
import { FileText, BookOpen, ScrollText, Download } from "lucide-react";

export default function Whitepaper() {
  return (
    <div data-testid="ecosystem-whitepaper">
      <PageHeader title="Whitepaper" eyebrow="Ecosystem" subtitle="The technical blueprint and vision behind the MerqON platform." />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-2">
        {[
          { icon: BookOpen, title: "Vision & Mission", desc: "Understanding MerqON's core philosophy, goals, and long-term roadmap." },
          { icon: ScrollText, title: "Tokenomics", desc: "Complete breakdown of MERQ token supply, distribution, and utility mechanics." },
          { icon: FileText, title: "Technical Architecture", desc: "Smart contract design, network topology, and security framework." },
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
          <FileText className="h-8 w-8 text-amber-400" />
        </div>
        <h2 className="text-white font-display text-xl font-bold mb-2">Coming Soon</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto">The official MerqON Whitepaper is being finalized. It will be available for download here.</p>
      </div>
    </div>
  );
}
