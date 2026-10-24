import { useEffect, useMemo, useState } from "react";
import { ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from "recharts";
import { api } from "@/lib/api";
import { Activity, TrendingUp, TrendingDown, Loader2 } from "lucide-react";

const INTERVALS = ["1m", "5m", "15m", "1h"];
const sma = (arr, i, n) => (i < n - 1 ? null : arr.slice(i - n + 1, i + 1).reduce((s, x) => s + x.c, 0) / n);

const withSignals = (candles) => {
  const rows = candles.map((c, i) => ({ ...c, fast: sma(candles, i, 7), slow: sma(candles, i, 25) }));
  rows.forEach((r, i) => {
    const p = rows[i - 1];
    if (!p || p.fast == null || p.slow == null) return;
    if (p.fast <= p.slow && r.fast > r.slow) r.signal = "BUY";
    if (p.fast >= p.slow && r.fast < r.slow) r.signal = "SELL";
  });
  return rows;
};

const fmtTime = (t) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export const LiveAlgoChart = () => {
  const [interval, setIntervalVal] = useState("1m");
  const [candles, setCandles] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let live = true;
    const load = () => api.get(`/market/klines?interval=${interval}&limit=120`)
      .then(({ data }) => { if (live) { setCandles(data.candles); setError(false); } })
      .catch(() => live && setError(true));
    load();
    const id = setInterval(load, 10000);
    return () => { live = false; clearInterval(id); };
  }, [interval]);

  const rows = useMemo(() => withSignals(candles), [candles]);
  const last = rows[rows.length - 1];
  const first = rows[0];
  const change = last && first ? ((last.c - first.o) / first.o) * 100 : 0;
  const signals = rows.filter((r) => r.signal);
  const lastSignal = signals[signals.length - 1];
  const trend = last?.fast && last?.slow ? (last.fast > last.slow ? "Bullish" : "Bearish") : "—";

  return (
    <div data-testid="algo-live-chart" className="glass rounded-3xl gold-border p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-gold" /> Live · BNB / USDT
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <span data-testid="algo-chart-price" className="font-display text-3xl font-black text-white">
              {last ? `$${last.c.toFixed(2)}` : "—"}
            </span>
            <span data-testid="algo-chart-change" className={`font-mono-merq text-sm ${change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {change >= 0 ? "+" : ""}{change.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="flex gap-1 rounded-full border border-white/10 bg-white/5 p-1">
          {INTERVALS.map((iv) => (
            <button key={iv} data-testid={`algo-interval-${iv}`} onClick={() => setIntervalVal(iv)}
              className={`px-3 py-1 rounded-full font-mono-merq text-[11px] transition-colors ${iv === interval ? "bg-amber-400 text-slate-950" : "text-slate-400 hover:text-white"}`}>
              {iv}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 sm:h-80">
        {!rows.length ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm gap-2">
            {error ? "Market data unavailable, retrying…" : <><Loader2 className="h-4 w-4 animate-spin" /> Loading live market…</>}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F3BA2F" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#F3BA2F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="t" tickFormatter={fmtTime} stroke="#475569" fontSize={10} tickLine={false} axisLine={false} minTickGap={40} />
              <YAxis domain={["auto", "auto"]} orientation="right" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} width={52} tickFormatter={(v) => v.toFixed(1)} />
              <Tooltip
                contentStyle={{ background: "#0B0F17", border: "1px solid rgba(243,186,47,.25)", borderRadius: 12, fontSize: 12 }}
                labelFormatter={fmtTime} formatter={(v, n) => [Number(v).toFixed(2), { c: "Price", fast: "MA 7", slow: "MA 25" }[n] || n]} />
              <Area type="monotone" dataKey="c" stroke="#F3BA2F" strokeWidth={2} fill="url(#goldFill)" isAnimationActive={false} />
              <Line type="monotone" dataKey="fast" stroke="#22d3ee" strokeWidth={1.4} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="slow" stroke="#a78bfa" strokeWidth={1.4} dot={false} isAnimationActive={false} />
              {signals.map((s) => (
                <ReferenceDot key={s.t} x={s.t} y={s.c} r={5} stroke="#0B0F17" strokeWidth={2}
                  fill={s.signal === "BUY" ? "#34d399" : "#fb7185"} />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
        <Stat label="Algo trend" value={trend} icon={trend === "Bullish" ? TrendingUp : TrendingDown}
          tone={trend === "Bullish" ? "text-emerald-400" : "text-rose-400"} testid="algo-trend" />
        <Stat label="Last signal" value={lastSignal ? `${lastSignal.signal} @ ${lastSignal.c.toFixed(2)}` : "Waiting"} icon={Activity}
          tone={lastSignal?.signal === "BUY" ? "text-emerald-400" : "text-rose-400"} testid="algo-last-signal" />
        <Stat label="Signals in view" value={signals.length} icon={Activity} tone="text-amber-300" testid="algo-signal-count" />
        <Stat label="Session high / low" value={rows.length ? `${Math.max(...rows.map((r) => r.h)).toFixed(1)} / ${Math.min(...rows.map((r) => r.l)).toFixed(1)}` : "—"}
          icon={TrendingUp} tone="text-slate-200" testid="algo-high-low" />
      </div>
      <div className="flex flex-wrap items-center gap-4 mt-4 font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">
        <Legend color="bg-amber-400" label="Price" /><Legend color="bg-cyan-400" label="MA 7" /><Legend color="bg-violet-400" label="MA 25" />
        <Legend color="bg-emerald-400" label="Buy cross" /><Legend color="bg-rose-400" label="Sell cross" />
        <span className="ml-auto normal-case tracking-normal text-slate-600">Live prices from Binance. Signals come from a sample moving-average strategy, for illustration only.</span>
      </div>
    </div>
  );
};

const Stat = ({ label, value, icon: Icon, tone, testid }) => (
  <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-3">
    <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">{label}</div>
    <div data-testid={testid} className={`flex items-center gap-1.5 mt-1 text-sm font-semibold ${tone}`}><Icon className="h-3.5 w-3.5" />{value}</div>
  </div>
);

const Legend = ({ color, label }) => (
  <span className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${color}`} />{label}</span>
);
