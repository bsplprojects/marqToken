import { useAdminData, AHeader, Panel, KCard, fmt } from "../ui";
import { ShieldCheck, AlertTriangle } from "lucide-react";

export default function Treasury() {
  const { data } = useAdminData("adm-treasury", "/treasury");
  return (
    <div>
      <AHeader title="Treasury" subtitle="Treasury monitoring. Keys are NOT stored here — outflows require multisig.">
        <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 font-mono-merq text-[10px] uppercase tracking-widest text-cyan-300"><AlertTriangle className="h-3 w-3" /> Simulated</span>
      </AHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KCard label="MERQ Balance" value={fmt(data?.merq_balance, 0)} accent="amber" />
        <KCard label="BNB Balance" value={fmt(data?.bnb_balance, 2)} accent="emerald" />
        <KCard label="Pending Transfers" value={data?.pending_transfers ?? 0} accent="cyan" />
        <KCard label="Daily Outflow" value={fmt(data?.daily_outflow, 0)} accent="rose" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Panel title="Security Model" className="p-5">
          <div className="flex items-start gap-3 text-sm text-slate-400">
            <ShieldCheck className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-slate-300 font-medium mb-2">Admin Panel → Approval → Multisig → Blockchain</p>
              <p>{data?.note}</p>
              <div className="font-mono-merq text-xs text-slate-500 mt-3">Treasury wallet: {data?.treasury_wallet}</div>
            </div>
          </div>
        </Panel>
        <Panel title="Treasury Alerts" className="p-5">
          {data?.alerts?.length ? (
            <div className="space-y-2">
              {data.alerts.map((a, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-sm text-amber-200">
                  <AlertTriangle className="h-4 w-4" /> {a.text}
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-slate-500">No active alerts.</p>}
        </Panel>
      </div>
    </div>
  );
}
