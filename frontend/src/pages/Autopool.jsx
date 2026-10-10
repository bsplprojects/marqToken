import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fmt, fmtDateTime } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";
import { Layers, Loader2, CheckCircle2, Circle, Zap } from "lucide-react";

export default function Autopool() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { data } = useQuery({ queryKey: ["autopool"], queryFn: async () => (await api.get("/autopool")).data });

  const enter = async () => {
    setBusy(true);
    try {
      const res = await api.post("/autopool/enter");
      toast.success(`Entered autopool · Slot #${res.data.slot}`);
      qc.invalidateQueries({ queryKey: ["autopool"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not enter autopool");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Global Matrix" title="Autopool"
        subtitle="A transparent forced-matrix pool. Each position fills with new entrants; a completed cycle releases a fixed reward and (optionally) re-enters you." />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-8 glass rounded-3xl border border-rose-400/15 p-8 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-rose-400/5 blur-3xl" />
          <div className="relative flex flex-wrap items-center gap-8">
            <Layers className="h-14 w-14 text-rose-400" strokeWidth={1.3} />
            <div>
              <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">Entry Amount</div>
              <div className="font-mono-merq text-3xl font-black text-white">{fmt(data?.entry_amount, 0)} <span className="text-sm text-slate-500">MERQ</span></div>
            </div>
            <div>
              <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">Cycle Reward</div>
              <div className="font-mono-merq text-3xl font-black text-emerald-400">{fmt(data?.reward, 0)} <span className="text-sm text-slate-500">MERQ</span></div>
            </div>
            <div>
              <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">Matrix Width</div>
              <div className="font-mono-merq text-3xl font-black text-white">{data?.capacity ?? 3}</div>
            </div>
          </div>
          <button
            data-testid="autopool-enter-button"
            disabled={busy}
            onClick={enter}
            className="mt-8 flex items-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-semibold px-6 py-3 transition-colors disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />} Enter Autopool
          </button>
        </div>

        <div className="lg:col-span-4 grid grid-cols-1 gap-4">
          <div className="glass rounded-2xl border border-white/8 p-5">
            <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">Global Pool Size</div>
            <div className="font-mono-merq text-3xl font-bold text-white mt-2">{data?.pool_size ?? 0}</div>
          </div>
          <div className="glass rounded-2xl border border-emerald-400/15 p-5">
            <div className="font-mono-merq text-[10px] uppercase tracking-widest text-emerald-400/70">Completed Cycles</div>
            <div className="font-mono-merq text-3xl font-bold text-emerald-300 mt-2">{data?.completed_cycles ?? 0}</div>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl border border-white/8 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 font-display font-semibold text-white">My Positions</div>
        {data?.my_positions?.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6" data-testid="autopool-positions">
            {data.my_positions.map((p) => (
              <div key={p.id} className="rounded-xl border border-white/8 bg-white/5 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono-merq text-sm text-amber-300">Slot #{p.slot}</span>
                  <span className={`text-[10px] uppercase tracking-widest font-mono-merq ${p.status === "completed" ? "text-emerald-400" : "text-slate-400"}`}>
                    {p.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {Array.from({ length: p.capacity }).map((_, i) =>
                    i < p.filled
                      ? <CheckCircle2 key={i} className="h-6 w-6 text-emerald-400" />
                      : <Circle key={i} className="h-6 w-6 text-slate-700" />
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-3">{p.filled}/{p.capacity} slots filled · {fmtDateTime(p.created_at)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-sm">No autopool positions yet.</div>
        )}
      </div>
    </div>
  );
}
