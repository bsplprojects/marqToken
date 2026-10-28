import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCw, Radio, Save } from "lucide-react";
import { adminApi } from "../adminApi";
import { useAdminAuth } from "../AdminAuth";
import { useAdminData, Panel, Btn, dt } from "../ui";

const usd = (v) => (v == null ? "—" : `$${Number(v).toLocaleString("en-US", { maximumFractionDigits: 8 })}`);

export const TokenRateCard = () => {
  const { can } = useAdminAuth();
  const qc = useQueryClient();
  const { data, refetch, isFetching } = useAdminData("adm-token-rate", "/token-rate", { refetchInterval: 30000 });
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState("");
  const saveManual = async () => {
    setBusy(true);
    try {
      const { data: r } = await adminApi.put("/token-rate", { price: manual });
      toast.success(`MERQ rate set to ${usd(r.admin_price)}`);
      setManual("");
      qc.invalidateQueries({ queryKey: ["adm-token-rate"] });
    } catch (e) { toast.error(e?.response?.data?.detail || "Could not save rate"); }
    setBusy(false);
  };
  const apply = async () => {
    setBusy(true);
    try {
      const { data: r } = await adminApi.post("/token-rate/refresh");
      toast.success(`MERQ rate set to ${usd(r.admin_price)}`);
      qc.invalidateQueries({ queryKey: ["adm-token-rate"] });
    } catch (e) { toast.error(e?.response?.data?.detail || "Could not refresh rate"); }
    setBusy(false);
  };
  const setMode = async (mode) => {
    try {
      await adminApi.put("/token-rate/mode", { mode });
      toast.success(mode === "fixed" ? "Platform now uses the saved rate" : "Platform now uses the live pool rate");
      qc.invalidateQueries({ queryKey: ["adm-token-rate"] });
    } catch (e) { toast.error(e?.response?.data?.detail || "Could not change mode"); }
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
          <div className="flex gap-1 mt-3" data-testid="token-rate-mode">
            {[["live", "Use live rate"], ["fixed", "Use saved rate"]].map(([m, l]) => (
              <button key={m} data-testid={`token-rate-mode-${m}`} disabled={!can("settings", true)} onClick={() => setMode(m)}
                className={`rounded-full px-3 py-1 text-[11px] font-mono-merq transition-colors ${data?.mode === m ? "bg-amber-400 text-slate-950" : "border border-white/10 text-slate-400 hover:text-white"}`}>{l}</button>
            ))}
          </div>
        </div>
        <div className="sm:text-right">
          {can("settings", true) && (
            <Btn testid="token-rate-refresh" onClick={apply} disabled={busy || !data?.live_price}>
              <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> Refresh live rate
            </Btn>
          )}
          <div className="text-[11px] text-slate-500 mt-2">Saves the live PancakeSwap rate as the saved platform rate.</div>
          {can("settings", true) && (
            <div className="flex sm:justify-end gap-2 mt-3">
              <input data-testid="token-rate-manual-input" type="number" step="any" min="0" placeholder="Set rate in USD" value={manual}
                onChange={(e) => setManual(e.target.value)}
                className="w-40 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 font-mono-merq text-sm text-white outline-none focus:border-amber-400/40" />
              <Btn testid="token-rate-manual-save" variant="ghost" onClick={saveManual} disabled={busy || !(Number(manual) > 0)}><Save className="h-4 w-4" /> Update rate</Btn>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
};
