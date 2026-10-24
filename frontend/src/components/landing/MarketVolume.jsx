import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

const compact = (n) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 2 }).format(n);

export const MarketVolume = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let live = true;
    const load = () => api.get("/market/volume")
      .then(({ data }) => { if (live) { setData(data); setError(false); } })
      .catch(() => live && setError(true));
    load();
    const id = setInterval(load, 30000);
    return () => { live = false; clearInterval(id); };
  }, []);

  if (!data) {
    return (
      <div data-testid="market-volume" className="glass rounded-3xl border border-white/8 p-10 flex items-center justify-center gap-2 text-slate-500 text-sm">
        {error ? "Market data unavailable, retrying…" : <><Loader2 className="h-4 w-4 animate-spin" /> Loading market volume…</>}
      </div>
    );
  }

  return (
    <div data-testid="market-volume" className="grid lg:grid-cols-5 gap-5">
      <div className="lg:col-span-2 glass rounded-3xl gold-border p-6 sm:p-7">
        <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">24h volume · top pairs</div>
        <div data-testid="market-total-volume" className="font-display text-4xl font-black gold-text mt-1">${compact(data.total_quote_volume)}</div>
        <div className="h-56 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.pairs} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="symbol" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip cursor={{ fill: "rgba(255,255,255,.04)" }}
                contentStyle={{ background: "#0B0F17", border: "1px solid rgba(243,186,47,.25)", borderRadius: 12, fontSize: 12 }}
                formatter={(v) => [`$${compact(v)}`, "24h volume"]} />
              <Bar dataKey="quote_volume" radius={[6, 6, 0, 0]}>
                {data.pairs.map((p) => <Cell key={p.symbol} fill={p.symbol === "BNB" ? "#F3BA2F" : "rgba(243,186,47,.35)"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="lg:col-span-3 glass rounded-3xl border border-white/8 p-2 sm:p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500 text-left">
              <th className="px-4 py-3">Pair</th><th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">24h</th><th className="px-4 py-3 text-right">Volume</th>
              <th className="px-4 py-3 text-right hidden sm:table-cell">Trades</th>
            </tr>
          </thead>
          <tbody>
            {data.pairs.map((p) => (
              <tr key={p.symbol} data-testid={`market-row-${p.symbol}`} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-semibold text-white">{p.symbol}<span className="text-slate-500 font-normal">/USDT</span></td>
                <td className="px-4 py-3 text-right font-mono-merq text-slate-200">${p.price < 1 ? p.price.toFixed(4) : p.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                <td className={`px-4 py-3 text-right font-mono-merq ${p.change_pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {p.change_pct >= 0 ? "+" : ""}{p.change_pct.toFixed(2)}%
                </td>
                <td className="px-4 py-3 text-right font-mono-merq text-amber-300">${compact(p.quote_volume)}</td>
                <td className="px-4 py-3 text-right font-mono-merq text-slate-400 hidden sm:table-cell">{compact(p.trades)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-4 pt-3 pb-1 text-[11px] text-slate-600">Live 24h spot data from Binance, refreshed every 30 seconds.</p>
      </div>
    </div>
  );
};
