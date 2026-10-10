import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { shortAddr } from "@/lib/format";
import { toast } from "sonner";
import { Wallet, Globe, Coins, Info, Copy, Shield } from "lucide-react";

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

        <div className="glass rounded-2xl border border-cyan-400/15 p-6">
          <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2"><Info className="h-5 w-5 text-cyan-400" /> How Income Works</h3>
          <div className="space-y-3 text-sm text-slate-400 leading-relaxed">
            <p><span className="text-amber-300 font-medium">Referral Income</span> — a configurable % of each direct referral's deposit.</p>
            <p><span className="text-emerald-300 font-medium">Profit Growth</span> — a documented daily protocol reward accrued on your staked positions, claimable any time.</p>
            <p><span className="text-cyan-300 font-medium">PG Commission</span> — team-volume based commission for qualified members (eligible volume × rate × qualification).</p>
            <p><span className="text-violet-300 font-medium">Rewards</span> — one-time MERQ for measurable achievements.</p>
            <p><span className="text-rose-300 font-medium">Autopool</span> — forced-matrix pool releasing a fixed reward per completed cycle.</p>
            <p className="text-slate-600 text-xs pt-2 border-t border-white/5">All rates are transparent and configurable by governance — there are no fixed or guaranteed return promises.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
