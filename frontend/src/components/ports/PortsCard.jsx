import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fmt } from "@/lib/format";
import { DoorOpen, ArrowRight } from "lucide-react";

export const PortsCard = () => {
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ["ports"], queryFn: async () => (await api.get("/ports/status")).data });
  return (
    <div className="grid sm:grid-cols-2 gap-4 mt-4">
      {["entry", "unity"].map((k) => {
        const t = data?.totals?.[k];
        return (
          <button key={k} data-testid={`dashboard-port-card-${k}`} onClick={() => navigate(`/ports/${k}`)}
            className="text-left glass card-hover rounded-2xl border border-white/8 p-5 flex items-center gap-4">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400"><DoorOpen className="h-5 w-5" /></span>
            <div className="flex-1">
              <div className="font-display font-bold text-white">{data?.ports?.[k]?.name || (k === "entry" ? "Merq Entry Port" : "Merq Unity Port")}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {t?.count ? `${t.count} purchase${t.count > 1 ? "s" : ""} · $${fmt(t.usd)} · ${fmt(t.merq, 4)} MERQ` : "No purchases yet"}
                {t?.pending ? ` · ${t.pending} confirming` : ""}
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-amber-400" />
          </button>
        );
      })}
    </div>
  );
};
