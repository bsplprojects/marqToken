import { PageHeader } from "@/components/PageHeader";
import { CreditCard, ShoppingBag, Banknote, Smartphone } from "lucide-react";

export default function MerqonPay() {
  return (
    <div data-testid="ecosystem-merqon-pay">
      <PageHeader title="MerqON Pay (Crypto Card)" eyebrow="Ecosystem" subtitle="Spend your crypto anywhere with the MerqON virtual and physical card." />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-2">
        {[
          { icon: CreditCard, title: "Crypto Card", desc: "Virtual and physical cards that convert your MERQ to fiat at point of sale." },
          { icon: ShoppingBag, title: "Spend Anywhere", desc: "Accepted at millions of merchants worldwide via Visa/Mastercard networks." },
          { icon: Banknote, title: "Instant Conversion", desc: "Real-time crypto-to-fiat conversion with competitive exchange rates." },
        ].map((c, i) => (
          <div key={i} className="group glass rounded-2xl border border-white/8 p-6 hover:border-rose-400/20 transition-all duration-500">
            <div className="h-12 w-12 rounded-xl bg-rose-400/10 flex items-center justify-center mb-4 group-hover:bg-rose-400/15 transition-colors">
              <c.icon className="h-6 w-6 text-rose-400" />
            </div>
            <h3 className="text-white font-semibold text-base mb-2">{c.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl border border-white/8 p-8 mt-6 text-center">
        <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-rose-400/20 to-rose-600/10 items-center justify-center mb-4">
          <CreditCard className="h-8 w-8 text-rose-400" />
        </div>
        <h2 className="text-white font-display text-xl font-bold mb-2">Coming Soon</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto">MerqON Pay is being integrated with global payment networks. Card applications will open soon.</p>
      </div>
    </div>
  );
}
