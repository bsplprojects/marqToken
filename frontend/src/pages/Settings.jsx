import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { shortAddr } from "@/lib/format";
import { toast } from "sonner";
import { Wallet, Globe, Coins, Copy, Shield } from "lucide-react";

export default function Settings() {
  const { member, price } = useAuth();

  const copy = (t) => { navigator.clipboard.writeText(t); toast.success("Copied"); };

  const rows = [
    { icon: Wallet, label: "Connected Wallet", value: member?.address, mono: true, copyable: true },
    { icon: Globe, label: "Network", value: "BNB Smart Chain (BEP-20)" },
    { icon: Coins, label: "Token", value: "MERQ" },
    { icon: Coins, label: "MERQ Price (USD)", value: `$${price?.merq_usd}` },
    { icon: Coins, label: "BNB Reference (CoinGecko)", value: price?.bnb_usd ? `$${price.bnb_usd}` : "—" },
  ];

  return (
    <div>
      <PageHeader eyebrow="Preferences" title="Settings" subtitle="Account, network and protocol information." />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl border border-white/8 p-6">
          <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2"><Shield className="h-5 w-5 text-amber-400" /> Account</h3>
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/5 px-4 py-3">
                <span className="flex items-center gap-2 font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">
                  <r.icon className="h-3.5 w-3.5" /> {r.label}
                </span>
                <span className={`text-sm text-slate-200 ${r.mono ? "font-mono-merq" : ""} flex items-center gap-2 truncate`}>
                  {r.mono ? shortAddr(r.value) : r.value}
                  {r.copyable && <button onClick={() => copy(r.value)}><Copy className="h-3.5 w-3.5 text-slate-500 hover:text-amber-400" /></button>}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
