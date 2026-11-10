import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fmt } from "@/lib/format";
import { Bot, Zap } from "lucide-react";

export const AiDeductions = () => {
  const { data = [], isLoading } = useQuery({
    queryKey: ["ai-deductions"],
    queryFn: async () => (await api.get("/withdraw/ai-deductions")).data,
    refetchInterval: 30000,
  });

  const total = data.reduce((s, d) => s + d.amount_usd, 0);

  return (
    <div data-testid="ai-deductions" className="glass rounded-2xl border border-white/8 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-violet-400" />
          <span className="font-display text-lg font-bold text-white">MERQAi Subscription</span>
        </div>
        {data.length > 0 && (
          <span data-testid="ai-deductions-total" className="rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1 font-mono-merq text-xs text-violet-300">
            Total: ${fmt(total, 2)}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data.length ? (
        <div data-testid="ai-deductions-empty" className="text-sm text-slate-500 py-8 text-center">
          No MERQAi subscription deductions yet.
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((d) => (
            <div key={d.id} data-testid="ai-deduction-row"
              className="flex flex-wrap items-center gap-3 rounded-xl border border-white/8 bg-white/5 px-4 py-3">
              <Zap className="h-3.5 w-3.5 text-violet-400 flex-shrink-0" />
              <span className="text-sm text-white font-semibold">-${fmt(d.amount_usd, 2)}</span>
              <span className="rounded-full border border-violet-400/20 bg-violet-400/5 px-2 py-0.5 font-mono-merq text-[10px] text-violet-300 uppercase tracking-widest">
                {d.reason}
              </span>
              <span className="ml-auto font-mono-merq text-[11px] text-slate-500">
                {new Date(d.created_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
