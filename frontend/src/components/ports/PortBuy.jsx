import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatUnits } from "ethers";
import { api } from "@/lib/api";
import { fmt } from "@/lib/format";
import { merqBalanceWei, payTechPass } from "@/lib/techpass";
import { Loader2, Wallet, DoorOpen, ArrowLeft } from "lucide-react";

const STEP = { sign: "Confirm payment in your wallet…", confirm: "Waiting for blockchain confirmation…", verify: "Verifying payment…" };

export const PortBuy = ({ portKey, port, status, member, onDone }) => {
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState(null);
  const [balance, setBalance] = useState(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    merqBalanceWei(status, member.address).then(setBalance).catch(() => setBalance(undefined));
  }, [status, member.address]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { setQuote(null); setAmount(""); }, [portKey]);

  const usd = Number(amount || 0);
  const estimate = status.merq_price > 0 ? usd / status.merq_price : 0;
  const inRange = usd >= port.min_usd && usd <= port.max_usd;
  const balanceNum = typeof balance === "bigint" ? Number(formatUnits(balance, status.decimals)) : null;
  const need = quote ? BigInt(quote.merq_amount_wei) : 0n;
  const enough = quote ? typeof balance === "bigint" && balance >= need : balanceNum !== null && balanceNum >= estimate;
  const secsLeft = quote ? Math.max(0, Math.floor((new Date(quote.expires_at).getTime() - now) / 1000)) : 0;

  const review = async () => {
    setBusy(true);
    try { setQuote((await api.post(`/ports/${portKey}/quote`, { amount_usd: usd })).data); }
    catch (e) { toast.error(e?.response?.data?.detail || "Couldn't lock a price"); }
    finally { setBusy(false); }
  };

  const pay = async () => {
    try {
      const tx_hash = await payTechPass(quote, member.address, setStep);
      setStep("verify");
      await api.post(`/ports/${portKey}/confirm`, { quote_id: quote.quote_id, tx_hash });
      toast.success(`${port.name} purchase of $${fmt(quote.amount_usd)} completed`);
      setQuote(null); setAmount("");
      merqBalanceWei(status, member.address).then(setBalance).catch(() => {});
      onDone();
    } catch (e) {
      toast.error(e?.response?.data?.detail || e?.shortMessage || e?.message || "Payment failed");
    } finally { setStep(null); }
  };

  return (
    <div data-testid="port-buy" className="glass gold-glow rounded-3xl border border-amber-400/20 p-7">
      <div className="flex items-center gap-3 mb-6">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/15 text-amber-400"><DoorOpen className="h-6 w-6" /></span>
        <div>
          <div className="font-display text-xl font-black text-white">{port.name}</div>
          <div className="text-xs text-slate-500">Enter a USDT value · paid in MERQ at the live price</div>
        </div>
      </div>

      {!quote ? (
        <>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex justify-between font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">
              <span>Amount (USDT)</span><span>Min ${fmt(port.min_usd, 0)} · Max ${fmt(port.max_usd, 0)}</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="font-display text-2xl font-bold text-slate-500">$</span>
              <input data-testid="port-amount-input" value={amount} inputMode="decimal" placeholder="0.00"
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                className="flex-1 min-w-0 bg-transparent outline-none font-display text-3xl font-bold text-white placeholder:text-slate-600" />
              <span className="rounded-full border border-white/10 px-3 py-1.5 font-mono-merq text-sm text-slate-300">USDT</span>
            </div>
          </div>
          <div className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-4 mt-3">
            <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">MERQ to be deducted (estimate)</div>
            <div data-testid="port-merq-estimate" className="font-mono-merq text-2xl font-black gold-text mt-1">{fmt(estimate, 4)} MERQ</div>
            <div data-testid="port-rate" className="font-mono-merq text-xs text-slate-400 mt-1">
              1 MERQ = ${Number(status.merq_price).toFixed(6)} · {status.price_source === "pancakeswap_pool" ? "live pool price" : "admin price"}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
          <button onClick={() => setQuote(null)} data-testid="port-edit-amount" className="flex items-center gap-1 text-xs text-slate-400 hover:text-white mb-3"><ArrowLeft className="h-3.5 w-3.5" /> Change amount</button>
          <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">You pay for ${fmt(quote.amount_usd)}</div>
          <div data-testid="port-merq-locked" className="font-mono-merq text-3xl font-black gold-text mt-1">{fmt(quote.merq_amount, 4)} MERQ</div>
          <div className="flex justify-between font-mono-merq text-xs text-slate-400 mt-2">
            <span>1 MERQ = ${Number(quote.merq_price).toFixed(6)}</span>
            <span data-testid="port-quote-timer" className={secsLeft < 60 ? "text-rose-400" : ""}>
              {secsLeft ? `Price held ${Math.floor(secsLeft / 60)}:${String(secsLeft % 60).padStart(2, "0")}` : "Price expired"}
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-4 text-sm">
        <span className="flex items-center gap-2 text-slate-400"><Wallet className="h-4 w-4" /> Your MERQ balance</span>
        <span data-testid="port-wallet-balance" className={`font-mono-merq ${enough ? "text-emerald-400" : "text-rose-400"}`}>
          {balance === null ? "Checking…" : balanceNum === null ? "Unavailable" : fmt(balanceNum, 4)}
        </span>
      </div>

      {!quote ? (
        <button data-testid="port-review-button" onClick={review} disabled={!inRange || !enough || busy}
          className="w-full mt-6 flex items-center justify-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold px-5 py-4 transition-colors disabled:opacity-50">
          {busy && <Loader2 className="h-5 w-5 animate-spin" />}
          {!usd ? "Enter an amount" : !inRange ? `Enter $${fmt(port.min_usd, 0)} – $${fmt(port.max_usd, 0)}` : !enough ? "Not enough MERQ in wallet" : "Lock price & continue"}
        </button>
      ) : secsLeft === 0 ? (
        <button data-testid="port-requote-button" onClick={review} disabled={busy}
          className="w-full mt-6 rounded-xl border border-amber-400/30 text-amber-300 font-semibold px-5 py-4 hover:bg-amber-400/10 transition-colors">Get a new price</button>
      ) : (
        <button data-testid="port-pay-button" onClick={pay} disabled={!enough || !!step}
          className="w-full mt-6 flex items-center justify-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold px-5 py-4 transition-colors disabled:opacity-50">
          {step && <Loader2 className="h-5 w-5 animate-spin" />}
          {step ? STEP[step] : enough ? `Pay ${fmt(quote.merq_amount, 4)} MERQ` : "Not enough MERQ in wallet"}
        </button>
      )}
      <p className="text-[11px] text-slate-600 mt-3 text-center">Real on-chain payment from your wallet. A small BNB gas fee applies.</p>
    </div>
  );
};
