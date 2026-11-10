import { PageHeader } from "@/components/PageHeader";
import { Wallet, Lock, Globe, Key } from "lucide-react";

export default function DecentralisedWallet() {
  return (
    <div data-testid="ecosystem-decentralised-wallet">
      <PageHeader title="Decentralised Wallet" eyebrow="Ecosystem" subtitle="Self-custody multi-chain wallet — your keys, your coins, your control." />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-2">
        {[
          { icon: Key, title: "Self-Custody", desc: "Full control of your private keys. No intermediaries, no custodians." },
          { icon: Globe, title: "Multi-Chain", desc: "Support for BNB Chain, Ethereum, Polygon, and more networks." },
          { icon: Lock, title: "Bank-Grade Security", desc: "Biometric auth, encrypted storage, and hardware wallet support." },
        ].map((c, i) => (
          <div key={i} className="group glass rounded-2xl border border-white/8 p-6 hover:border-violet-400/20 transition-all duration-500">
            <div className="h-12 w-12 rounded-xl bg-violet-400/10 flex items-center justify-center mb-4 group-hover:bg-violet-400/15 transition-colors">
              <c.icon className="h-6 w-6 text-violet-400" />
            </div>
            <h3 className="text-white font-semibold text-base mb-2">{c.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl border border-white/8 p-8 mt-6 text-center">
        <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-400/20 to-violet-600/10 items-center justify-center mb-4">
          <Wallet className="h-8 w-8 text-violet-400" />
        </div>
        <h2 className="text-white font-display text-xl font-bold mb-2">Coming Soon</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto">The MerqON Decentralised Wallet is in development. Stay tuned for launch updates.</p>
      </div>
    </div>
  );
}
