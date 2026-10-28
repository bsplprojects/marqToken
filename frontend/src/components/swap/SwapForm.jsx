import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ArrowDownUp, Loader2, Settings2 } from "lucide-react";
import { parseAmount, quoteOut, toBps, fmtUnits, executeSwap, GAS_RESERVE } from "@/lib/swap";
import { formatUnits } from "ethers";

const STEP_LABEL = { fee: "Sending platform fee…", approve: "Approving token…", swap: "Confirm swap in wallet…", confirm: "Waiting for confirmation…" };
const SLIPPAGES = [0.5, 1, 3];

const TokenBox = ({ label, symbol, value, onChange, balance, onMax, readOnly, testid }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
    <div className="flex items-center justify-between font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">
      <span>{label}</span>
      <span data-testid={`${testid}-balance`}>Balance: {balance ?? "—"}
        {onMax && <button onClick={onMax} data-testid={`${testid}-max`} className="ml-2 text-amber-400 hover:text-amber-300">MAX</button>}
      </span>
    </div>
    <div className="flex items-center gap-3 mt-2">
      <input data-testid={`${testid}-input`} value={value} readOnly={readOnly} placeholder="0.0" inputMode="decimal"
        onChange={(e) => onChange?.(e.target.value.replace(/[^0-9.]/g, ""))}
        className="flex-1 min-w-0 bg-transparent outline-none font-display text-2xl font-bold text-white placeholder:text-slate-600" />
      <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1.5 font-mono-merq text-sm font-semibold text-amber-300">{symbol}</span>
    </div>
  </div>
);

export const SwapForm = ({ cfg, market, balances, member, onDone }) => {
  const [direction, setDirection] = useState("BNB_TO_MERQ");
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState(cfg.default_slippage_pct);
  const [out, setOut] = useState(0n);
  const [step, setStep] = useState(null);
  const buying = direction === "BNB_TO_MERQ";
  const [inSym, outSym] = buying ? ["BNB", "MERQ"] : ["MERQ", "BNB"];
  const decIn = buying ? market.dec.bnb : market.dec.merq;
  const decOut = buying ? market.dec.merq : market.dec.bnb;
  const amountWei = parseAmount(amount, decIn);
  const feeWei = cfg.fee_wallet ? (amountWei * toBps(cfg.fee_pct)) / 10000n : 0n;
  const netWei = amountWei - feeWei;
  const minOut = (out * (10000n - toBps(slippage))) / 10000n;
  const balIn = balances ? (buying ? balances.bnb : balances.merq) : null;
  const balOut = balances ? (buying ? balances.merq : balances.bnb) : null;
  const maxIn = balIn === null ? null : buying ? (balIn > GAS_RESERVE ? balIn - GAS_RESERVE : 0n) : balIn;
  const insufficient = balIn !== null && amountWei > balIn;

  useEffect(() => {
    let live = true;
    setOut(0n);
    if (netWei <= 0n) return;
    const t = setTimeout(() => quoteOut(cfg, direction, netWei).then((v) => live && setOut(v)).catch(() => live && setOut(0n)), 400);
    return () => { live = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, direction]);

  const flip = () => { setDirection(buying ? "MERQ_TO_BNB" : "BNB_TO_MERQ"); setAmount(""); };

  const submit = async () => {
    try {
      const res = await executeSwap({ cfg, direction, amountWei, minOutWei: minOut, memberAddress: member?.address, onStep: setStep });
      await api.post("/swap/record", {
        tx_hash: res.txHash, direction, amount_in: Number(amount), fee_tx_hash: res.feeTxHash,
        amount_out_est: Number(formatUnits(out, decOut)), fee_amount: Number(formatUnits(res.feeWei, decIn)),
      }).catch(() => {});
      toast.success(`Swapped ${amount} ${inSym} for ${outSym}`);
      setAmount("");
      onDone();
    } catch (e) {
      toast.error(e?.shortMessage || e?.info?.error?.message || e?.message || "Swap failed");
    } finally { setStep(null); }
  };

  const rate = buying ? 1 / market.price : market.price;
  const disabled = !!step || netWei <= 0n || out === 0n || insufficient;

  return (
    <div data-testid="swap-form" className="glass gold-glow rounded-3xl border border-amber-400/15 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="font-display text-lg font-bold text-white">{inSym} → {outSym}</div>
        <div className="flex items-center gap-1.5">
          <Settings2 className="h-3.5 w-3.5 text-slate-500" />
          {SLIPPAGES.map((s) => (
            <button key={s} data-testid={`swap-slippage-${s}`} onClick={() => setSlippage(s)}
              className={`rounded-full px-2.5 py-1 font-mono-merq text-[11px] transition-colors ${Number(slippage) === s ? "bg-amber-400 text-slate-950" : "text-slate-400 border border-white/10 hover:text-white"}`}>{s}%</button>
          ))}
        </div>
      </div>
      <TokenBox label="You pay" symbol={inSym} value={amount} onChange={setAmount} testid="swap-from"
        balance={balIn !== null ? fmtUnits(balIn, decIn, 4) : null} onMax={maxIn ? () => setAmount(formatUnits(maxIn, decIn)) : null} />
      <div className="flex justify-center -my-3 relative z-10">
        <button data-testid="swap-flip" onClick={flip} className="h-10 w-10 rounded-xl border border-amber-400/30 bg-slate-950 text-amber-400 hover:rotate-180 transition-transform duration-300 flex items-center justify-center">
          <ArrowDownUp className="h-4 w-4" />
        </button>
      </div>
      <TokenBox label="You receive (estimated)" symbol={outSym} value={out > 0n ? fmtUnits(out, decOut, 6) : ""} readOnly testid="swap-to"
        balance={balOut !== null ? fmtUnits(balOut, decOut, 4) : null} />

      <div className="space-y-1.5 mt-4 text-xs font-mono-merq">
        <Row label="Rate" value={`1 ${inSym} ≈ ${rate.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${outSym}`} testid="swap-rate" />
        <Row label={`Platform fee (${cfg.fee_pct}%)`} value={`${fmtUnits(feeWei, decIn)} ${inSym}`} testid="swap-fee" />
        <Row label={`Minimum received (${slippage}% slippage)`} value={`${fmtUnits(minOut, decOut)} ${outSym}`} testid="swap-min-out" />
        <Row label="Route" value="PancakeSwap V2" />
      </div>

      <button data-testid="swap-submit" disabled={disabled} onClick={submit}
        className="w-full mt-5 flex items-center justify-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold px-5 py-4 transition-colors disabled:opacity-50">
        {step && <Loader2 className="h-5 w-5 animate-spin" />}
        {step ? STEP_LABEL[step] : insufficient ? `Not enough ${inSym}` : netWei <= 0n ? "Enter an amount" : `Swap ${inSym} for ${outSym}`}
      </button>
      <p className="text-[11px] text-slate-600 mt-3 text-center">Real on-chain swap. Your wallet will ask you to confirm each step and pay a small BNB gas fee.</p>
    </div>
  );
};

const Row = ({ label, value, testid }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-slate-500">{label}</span><span data-testid={testid} className="text-slate-200 text-right">{value}</span>
  </div>
);
