import { useAdminData, AHeader, Panel, KCard } from "../ui";
import { Activity } from "lucide-react";

export default function Health() {
  const { data } = useAdminData("adm-health", "/health", { refetchInterval: 15000 });
  const services = data?.services || {};
  const dot = (s) => s === "online" ? "bg-emerald-400" : s === "offline" ? "bg-rose-400" : s === "degraded" ? "bg-amber-400" : "bg-cyan-400";
  return (
    <div>
      <AHeader title="System Health" subtitle="Live status of core services and workers." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KCard label="Error Rate" value={`${data?.error_rate ?? 0}%`} accent="emerald" />
        <KCard label="Queue Backlog" value={data?.queue_backlog ?? 0} accent="amber" />
        <KCard label="Services" value={Object.keys(services).length} accent="cyan" />
        <KCard label="DB Latency" value={`${services.mongodb?.latency_ms ?? "—"} ms`} accent="violet" />
      </div>
      <Panel title="Services" className="p-5">
        <div className="grid sm:grid-cols-2 gap-3">
          {Object.entries(services).map(([name, s]) => (
            <div key={name} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/5 px-4 py-3">
              <span className="flex items-center gap-2 text-sm text-slate-200 capitalize">
                <Activity className="h-4 w-4 text-slate-500" /> {name.replace("_", " ")}
              </span>
              <span className="flex items-center gap-2 font-mono-merq text-xs uppercase tracking-wide text-slate-400">
                <span className={`h-2 w-2 rounded-full ${dot(s.status)}`} /> {s.status}
                {s.latency_ms != null && <span className="text-slate-600">· {s.latency_ms}ms</span>}
              </span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
