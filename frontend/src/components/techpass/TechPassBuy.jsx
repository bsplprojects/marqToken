import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { fmt } from "@/lib/format";
import { formatUnits } from "ethers";
import { merqBalanceWei, payTechPass } from "@/lib/techpass";
import { Loader2, RefreshCw, Ticket, Wallet } from "lucide-react";

const STEP = { sign: "Confirm payment in your wallet…", confirm: "Waiting for blockchain confirmation…", verify: "Verifying payment…" };

export const TechPassBuy = ({ priceUsd, member, onDone }) => {
  const [quote, setQuote] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(null);
  const [now, setNow] = useState(Date.now());

  const getQuote = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/techpass/quote");
      setQuote(data);
      setBalance(null);
      merqBalanceWei(data, member.address).then(setBalance).catch(() => setBalance(undefined));
    } catch (e) { toast.error(e?.response?.data?.detail || "Couldn't get a price"); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { getQuote(); }, []);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const secsLeft = quote ? Math.max(0, Math.floor((new Date(quote.expires_at).getTime() - now) / 1000)) : 0;
  const need = quote ? BigInt(quote.merq_amount_wei) : 0n;
  const enough = typeof balance === "bigint" && balance >= need;

  const pay = async () => {
    try {
      const tx_hash = await payTechPass(quote, member.address, setStep);
      setStep("verify");
      await api.post("/techpass/confirm", { quote_id: quote.quote_id, tx_hash });
      toast.success("Merq TechPass activated");
      onDone();
    } catch (e) {
      toast.error(e?.response?.data?.detail || e?.shortMessage || e?.message || "Payment failed");
    } finally { setStep(null); }
  };

  return (
    <div data-testid="techpass-buy" className="glass gold-glow rounded-3xl border border-amber-400/20 p-7">
      <div className="flex items-center gap-3 mb-6">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/15 text-amber-400"><Ticket className="h-6 w-6" /></span>
        <div>
          <div className="font-display text-xl font-black text-white">Merq <span className="gold-text">TechPass</span></div>
          <div className="text-xs text-slate-500">Start with ${fmt(priceUsd, 0)} · paid in MERQ</div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">MERQ required for ${fmt(priceUsd, 0)}</div>
        <div data-testid="techpass-merq-required" className="font-mono-merq text-3xl font-black gold-text mt-1">
          {quote ? fmt(quote.merq_amount, 4) : "—"} <span className="text-base text-slate-500">MERQ</span>
        </div>
        {quote && (
          <div className="flex flex-wrap justify-between gap-2 mt-3 text-xs font-mono-merq text-slate-400">
            <span data-testid="techpass-rate">1 MERQ = ${Number(quote.merq_price).toFixed(6)}</span>
            <span data-testid="techpass-quote-timer" className={secsLeft < 60 ? "text-rose-400" : ""}>
              {secsLeft ? `Price held ${Math.floor(secsLeft / 60)}:${String(secsLeft % 60).padStart(2, "0")}` : "Price expired"}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 text-sm">
        <span className="flex items-center gap-2 text-slate-400"><Wallet className="h-4 w-4" /> Your MERQ balance</span>
        <span data-testid="techpass-wallet-balance" className={`font-mono-merq ${enough ? "text-emerald-400" : "text-rose-400"}`}>
          {balance === null ? "Checking…" : balance === undefined ? "Unavailable" : fmt(Number(formatUnits(balance, quote.decimals)), 4)}
        </span>
      </div>

      {secsLeft === 0 && quote ? (
        <button data-testid="techpass-refresh-quote" onClick={getQuote} disabled={loading}
          className="w-full mt-6 flex items-center justify-center gap-2 rounded-xl border border-amber-400/30 text-amber-300 font-semibold px-5 py-4 hover:bg-amber-400/10 transition-colors">
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} /> Get a new price
        </button>
      ) : (
        <button data-testid="techpass-pay-button" onClick={pay} disabled={!quote || !enough || !!step}
          className="w-full mt-6 flex items-center justify-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold px-5 py-4 transition-colors disabled:opacity-50">
          {(step || loading) && <Loader2 className="h-5 w-5 animate-spin" />}
          {step ? STEP[step] : !quote ? "Getting live price…" : enough ? `Pay ${fmt(quote.merq_amount, 4)} MERQ` : "Not enough MERQ in wallet"}
        </button>
      )}
      <p className="text-[11px] text-slate-600 mt-3 text-center">Real on-chain payment from your wallet. A small BNB gas fee applies.</p>
    </div>
  );
};
