import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCw, Radio } from "lucide-react";
import { adminApi } from "../adminApi";
import { useAdminAuth } from "../AdminAuth";
import { useAdminData, Panel, Btn, dt } from "../ui";

const usd = (v) => (v == null ? "—" : `$${Number(v).toLocaleString("en-US", { maximumFractionDigits: 8 })}`);

export const TokenRateCard = () => {
  const { can } = useAdminAuth();
  const qc = useQueryClient();
  const { data, refetch, isFetching } = useAdminData("adm-token-rate", "/token-rate", { refetchInterval: 30000 });
  const [busy, setBusy] = useState(false);
  const apply = async () => {
    setBusy(true);
    try {
      const { data: r } = await adminApi.post("/token-rate/refresh");
      toast.success(`MERQ rate set to ${usd(r.admin_price)}`);
      qc.invalidateQueries({ queryKey: ["adm-token-rate"] });
    } catch (e) { toast.error(e?.response?.data?.detail || "Could not refresh rate"); }
    setBusy(false);
  };
  const drift = data?.live_price && data?.admin_price ? ((data.live_price - data.admin_price) / data.admin_price) * 100 : null;

  return (
    <Panel testid="token-rate-card" title="MERQ Token Rate" className="p-5 mb-5"
      action={<button data-testid="token-rate-reload" onClick={() => refetch()} className="text-slate-400 hover:text-amber-300 p-1"><RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /></button>}>
      <div className="grid sm:grid-cols-3 gap-4 items-center">
        <div>
          <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><Radio className="h-3 w-3 text-emerald-400" /> Live pool rate</div>
          <div data-testid="token-rate-live" className="font-mono-merq text-2xl font-bold text-emerald-300 mt-1">{usd(data?.live_price)}</div>
          {data?.error && <div data-testid="token-rate-error" className="text-[11px] text-rose-300 mt-1">{data.error}</div>}
        </div>
        <div>
          <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">Saved platform rate</div>
          <div data-testid="token-rate-saved" className="font-mono-merq text-2xl font-bold text-amber-300 mt-1">{usd(data?.admin_price)}</div>
          <div className="text-[11px] text-slate-500 mt-1">Updated {dt(data?.updated_at)}{drift != null && ` · ${drift >= 0 ? "+" : ""}${drift.toFixed(2)}% vs live`}</div>
        </div>
        <div className="sm:text-right">
          {can("settings", true) && (
            <Btn testid="token-rate-refresh" onClick={apply} disabled={busy || !data?.live_price}>
              <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> Refresh live rate
            </Btn>
          )}
          <div className="text-[11px] text-slate-500 mt-2">Saves the live PancakeSwap rate as the platform rate (used when the pool can't be read).</div>
        </div>
      </div>
    </Panel>
  );
};
