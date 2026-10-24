import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fmt } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { WithdrawHistory } from "@/components/WithdrawHistory";
import { toast } from "sonner";
import {
  ArrowUpFromLine, CheckCircle2, Loader2, ShieldCheck,
} from "lucide-react";

export default function Withdraw() {
  const qc = useQueryClient();

  const { data: dash } = useQuery({ queryKey: ["dashboard"], queryFn: async () => (await api.get("/member/dashboard")).data });

  const [busy, setBusy] = useState(false);

  // withdraw state
  const [wAmount, setWAmount] = useState("");
  const [quote, setQuote] = useState(null);

  const fetchQuote = useCallback(async (val) => {
    if (!val || Number(val) <= 0) { setQuote(null); return; }
    try {
      const { data } = await api.get(`/withdraw/quote`, { params: { amount: Number(val) } });
      setQuote(data);
    } catch { setQuote(null); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchQuote(wAmount), 300);
    return () => clearTimeout(t);
  }, [wAmount, fetchQuote]);

  const withdraw = async () => {
    setBusy(true);
    try {
      const res = await api.post("/withdraw/request", { amount: Number(wAmount) });
      toast[res.data.status === "sent" ? "success" : "info"](res.data.message);
      setWAmount(""); setQuote(null);
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["withdraw-history"] });
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Withdrawal failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Treasury" title="Withdraw"
        subtitle="Withdraw your available earnings to your connected wallet." />

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 glass rounded-2xl border border-white/8 p-6 sm:p-8">
          {(
            <>
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">Available Balance</span>
                <span className="font-mono-merq text-white">{fmt(dash?.available)} MERQ</span>
              </div>

              <label className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">Amount (MERQ)</label>
              <input
                data-testid="withdraw-amount-input"
                type="number" value={wAmount}
                onChange={(e) => setWAmount(e.target.value)}
                placeholder="0.00"
                className="mt-2 w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3.5 font-mono-merq text-lg text-white focus:border-amber-400/40 outline-none"
              />
              <button onClick={() => setWAmount(String(dash?.available || 0))}
                className="mt-2 font-mono-merq text-[11px] text-amber-400 hover:text-amber-300">MAX</button>

              {quote && (
                <div className="mt-5 space-y-2 rounded-xl border border-white/8 bg-white/5 p-4 font-mono-merq text-sm" data-testid="withdraw-fee-display">
                  <Row label="Amount" value={`${fmt(quote.amount)} MERQ`} />
                  <Row label={`Protocol Fee`} value={`-${fmt(quote.protocol_fee)} MERQ`} muted />
                  <Row label={`Network Fee`} value={`-${fmt(quote.fee)} MERQ`} muted />
                  <div className="h-px bg-white/10 my-2" />
                  <Row label="You Receive" value={`${fmt(quote.receive)} MERQ`} highlight />
                  <div className="text-[11px] text-slate-500">Minimum withdrawal: {fmt(quote.min_withdraw, 0)} MERQ</div>
                </div>
              )}

              <button data-testid="withdraw-submit-button" disabled={busy || !wAmount} onClick={withdraw}
                className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold px-5 py-3.5 transition-colors disabled:opacity-50">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpFromLine className="h-4 w-4" />} Confirm Withdrawal
              </button>
            </>
          )}
        </div>

        {/* info side */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass rounded-2xl border border-white/8 p-6">
            <div className="flex items-center gap-2 text-slate-300 mb-3">
              <ShieldCheck className="h-5 w-5 text-amber-400" />
              <span className="font-display font-semibold">Security Checks</span>
            </div>
            <ul className="space-y-2 text-sm text-slate-400">
              {["Active Merq TechPass", "Amount & minimum validation", "Daily limit & cooldown", "Sufficient available balance", "Large amounts reviewed by admin", "Paid in real MERQ on BNB Smart Chain"].map((c) => (
                <li key={c} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400/70" /> {c}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="mt-6"><WithdrawHistory /></div>
    </div>
  );
}

function Row({ label, value, muted, highlight }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-slate-500" : "text-slate-400"}>{label}</span>
      <span className={highlight ? "text-amber-300 font-bold" : "text-slate-200"}>{value}</span>
    </div>
  );
}
