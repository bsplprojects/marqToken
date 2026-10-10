import { useAdminData, AHeader, Panel } from "../ui";
import { Droplets } from "lucide-react";

export default function Liquidity() {
  const { data } = useAdminData("adm-liquidity", "/liquidity");
  return (
    <div>
      <AHeader title="Liquidity" subtitle="Future module — activates when the on-chain liquidity contract is deployed." />
      <Panel className="p-10 text-center">
        <Droplets className="h-12 w-12 text-cyan-400/60 mx-auto mb-4" />
        <div className="font-display text-lg text-white font-semibold">Liquidity Management</div>
        <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">{data?.message}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 max-w-2xl mx-auto">
          {[["MERQ Liquidity", 0], ["BNB Liquidity", 0], ["Pool Value", 0], ["LP Position", 0]].map(([l, v]) => (
            <div key={l} className="rounded-xl border border-white/8 bg-white/5 p-4 opacity-50">
              <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">{l}</div>
              <div className="font-mono-merq text-xl text-slate-400 mt-1">{v}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
