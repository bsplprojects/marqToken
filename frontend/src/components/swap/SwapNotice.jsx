import { Loader2, Clock, Droplets, AlertTriangle, PauseCircle, RefreshCw } from "lucide-react";

const COPY = {
  loading: [Loader2, "Loading swap…", "Reading the MERQ/BNB pool on BNB Smart Chain."],
  not_live: [Clock, "MERQ not live yet", "The MERQ token contract hasn't been added yet. Swaps open as soon as it goes live."],
  no_pool: [Droplets, "No trading pool yet", "MERQ is live, but there's no MERQ/BNB liquidity on PancakeSwap yet. Swaps open once liquidity is added."],
  disabled: [PauseCircle, "Swaps are paused", "Swapping is temporarily turned off by the MerqON team."],
  error: [AlertTriangle, "Couldn't reach the blockchain", "We couldn't read the pool right now. Please try again in a moment."],
};

export const SwapNotice = ({ state, onRetry }) => {
  const [Icon, title, text] = COPY[state] || COPY.loading;
  return (
    <div data-testid={`swap-notice-${state}`} className="glass gold-glow rounded-3xl border border-amber-400/15 p-8 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-400 mb-5">
        <Icon className={`h-7 w-7 ${state === "loading" ? "animate-spin" : ""}`} />
      </span>
      <div className="font-display text-xl font-bold text-white">{title}</div>
      <p className="text-sm text-slate-400 mt-2 leading-relaxed max-w-sm mx-auto">{text}</p>
      <div className="flex items-center justify-center gap-3 mt-6 font-mono-merq text-xs text-slate-500">
        <span className="rounded-full border border-white/10 px-3 py-1">BNB → MERQ</span>
        <span className="rounded-full border border-white/10 px-3 py-1">MERQ → BNB</span>
      </div>
      {state === "error" && (
        <button data-testid="swap-retry" onClick={onRetry} className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 px-5 py-2 text-sm text-amber-300 hover:bg-amber-400/10 transition-colors">
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      )}
    </div>
  );
};
