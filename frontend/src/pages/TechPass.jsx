import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { TechPassBuy } from "@/components/techpass/TechPassBuy";
import { TechPassDetails } from "@/components/techpass/TechPassDetails";
import { SwapNotice } from "@/components/swap/SwapNotice";
import { Sparkles, ArrowRight } from "lucide-react";

const PERKS = ["Access to Merq TechPass incomes", "Partner Onboarding, Momentum Booster & Global Momentum", "One-time purchase, paid in MERQ at the live price"];

export default function TechPass() {
  const { member } = useAuth();
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const welcome = params.get("welcome") === "1";
  const { data, isLoading } = useQuery({ queryKey: ["techpass"], queryFn: async () => (await api.get("/techpass/status")).data, refetchInterval: 15000 });
  const done = () => qc.invalidateQueries({ queryKey: ["techpass"] });

  const body = () => {
    if (isLoading || !data) return <SwapNotice state="loading" />;
    if (data.purchase) return <TechPassDetails p={data.purchase} />;
    if (!data.enabled) return <SwapNotice state="disabled" />;
    if (!data.merq_live) return <SwapNotice state="not_live" />;
    return <TechPassBuy priceUsd={data.price_usd} member={member} onDone={done} />;
  };

  return (
    <div>
      <PageHeader eyebrow="Membership" title="Merq TechPass" subtitle="Start with $120. The MERQ amount is calculated from the live price when you buy." />
      {welcome && !data?.purchase && (
        <div data-testid="techpass-welcome" className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/5 px-5 py-4 mb-6">
          <Sparkles className="h-5 w-5 text-amber-400" />
          <span className="text-sm text-amber-100">Welcome to MerqON! Activate your Merq TechPass to start earning.</span>
          <Link to="/dashboard" data-testid="techpass-skip" className="ml-auto flex items-center gap-1 text-sm text-slate-400 hover:text-white">Skip for now <ArrowRight className="h-4 w-4" /></Link>
        </div>
      )}
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">{body()}</div>
        <div className="lg:col-span-2 glass rounded-3xl border border-white/8 p-6">
          <div className="font-display text-lg font-bold text-white mb-4">What you get</div>
          <ul className="space-y-3">
            {PERKS.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm text-slate-300"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />{p}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
