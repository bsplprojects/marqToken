import { useAdminData, AHeader, Panel, Empty, dt } from "../ui";
import { Bell, AlertTriangle, Users, Wallet } from "lucide-react";

const ICONS = { wallet: Wallet, alert: AlertTriangle, users: Users };

export default function Notifications() {
  const { data } = useAdminData("adm-notifications", "/notifications", { refetchInterval: 20000 });
  const levelColor = { info: "border-cyan-400/20 bg-cyan-400/5 text-cyan-200",
    warning: "border-amber-400/20 bg-amber-400/5 text-amber-200",
    critical: "border-rose-400/20 bg-rose-400/5 text-rose-200" };
  return (
    <div>
      <AHeader title="Notifications" subtitle="Live system alerts and operational notifications." />
      <Panel title={`Notification Center · ${data?.count ?? 0}`} className="p-5">
        {data?.notifications?.length ? (
          <div className="space-y-2">
            {data.notifications.map((n, i) => {
              const Icon = ICONS[n.icon] || Bell;
              return (
                <div key={i} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${levelColor[n.level]}`}>
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm flex-1">{n.text}</span>
                  <span className="font-mono-merq text-[10px] text-slate-500">{dt(n.created_at)}</span>
                </div>
              );
            })}
          </div>
        ) : <Empty text="All clear — no active notifications." />}
      </Panel>
    </div>
  );
}
