import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fmt, fmtDateTime, INCOME_META } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { ExternalLink, ReceiptText } from "lucide-react";

export default function Transactions() {
  const { data } = useQuery({ queryKey: ["transactions"], queryFn: async () => (await api.get("/transactions")).data });

  return (
    <div>
      <PageHeader eyebrow="On-Ledger Activity" title="Transactions"
        subtitle="Every important action records a reference hash, viewable on BscScan." />

      <div className="glass rounded-2xl border border-white/8 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5">
          <ReceiptText className="h-5 w-5 text-amber-400" />
          <h3 className="font-display font-semibold text-white">All Transactions</h3>
          <span className="ml-auto font-mono-merq text-xs text-slate-500">{data?.length ?? 0} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="transaction-table">
            <thead>
              <tr className="text-left font-mono-merq text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/5">
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Tx Hash</th>
                <th className="px-6 py-3 text-right">Explorer</th>
              </tr>
            </thead>
            <tbody>
              {data && data.length > 0 ? data.map((t) => {
                const negative = t.amount < 0;
                return (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-3 text-slate-500">{fmtDateTime(t.created_at)}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center gap-2 text-slate-200">
                        <span className="h-2 w-2 rounded-full" style={{ background: INCOME_META[t.type]?.color || "#64748B" }} />
                        {INCOME_META[t.type]?.label || t.type}
                      </span>
                    </td>
                    <td className={`px-6 py-3 text-right font-mono-merq ${negative ? "text-rose-400" : "text-emerald-400"}`}>
                      {negative ? "" : "+"}{fmt(t.amount)}
                    </td>
                    <td className="px-6 py-3"><span className="text-emerald-400 text-xs capitalize">{t.status}</span></td>
                    <td className="px-6 py-3 font-mono-merq text-xs text-slate-500">{t.tx_hash.slice(0, 10)}…{t.tx_hash.slice(-6)}</td>
                    <td className="px-6 py-3 text-right">
                      <a data-testid="bscscan-link-button" href={t.bscscan_url} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300">
                        BscScan <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm">No transactions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
