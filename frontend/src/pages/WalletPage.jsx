import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { fmt } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";
import {
  ArrowDownToLine, ArrowUpFromLine, CheckCircle2, Loader2, ShieldCheck, Info,
} from "lucide-react";

export default function WalletPage() {
  const [params, setParams] = useSearchParams();
  const qc = useQueryClient();
  const { price } = useAuth();
  const tab = params.get("tab") === "withdraw" ? "withdraw" : "deposit";
  const setTab = (t) => setParams({ tab: t });

  const { data: dash } = useQuery({ queryKey: ["dashboard"], queryFn: async () => (await api.get("/member/dashboard")).data });

  // deposit state
  const [amount, setAmount] = useState("");
  const [approved, setApproved] = useState(false);
  const [busy, setBusy] = useState(false);

  // withdraw state
  const [wAmount, setWAmount] = useState("");
  const [quote, setQuote] = useState(null);

  const packages = [100, 500, 1000, 5000];

  const approve = async () => {
    if (!amount || Number(amount) <= 0) return toast.error("Enter an amount");
    setBusy(true);
    await new Promise((r) => setTimeout(r, 700));
    setApproved(true);
    setBusy(false);
    toast.success(`Approved ${amount} MERQ for the protocol`);
  };

  const deposit = async () => {
    setBusy(true);
    try {
      await api.post("/deposit", { amount: Number(amount) });
      toast.success(`Deposited ${amount} MERQ`);
      setAmount(""); setApproved(false);
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Deposit failed");
    } finally {
      setBusy(false);
    }
  };

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
      toast.success(`Withdrawal confirmed · You receive ${res.data.received} MERQ`);
      setWAmount(""); setQuote(null);
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Withdrawal failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Treasury" title="Wallet"
        subtitle="Deposit MERQ to activate your position, or withdraw your available earnings to your connected wallet." />

      <div className="flex items-center gap-2 mb-6">
        <button data-testid="tab-deposit" onClick={() => setTab("deposit")}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors ${
            tab === "deposit" ? "bg-amber-400/10 text-amber-300 border border-amber-400/20" : "text-slate-400 hover:text-white border border-transparent"}`}>
          <ArrowDownToLine className="h-4 w-4" /> Deposit
        </button>
        <button data-testid="tab-withdraw" onClick={() => setTab("withdraw")}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors ${
            tab === "withdraw" ? "bg-amber-400/10 text-amber-300 border border-amber-400/20" : "text-slate-400 hover:text-white border border-transparent"}`}>
          <ArrowUpFromLine className="h-4 w-4" /> Withdraw
        </button>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 glass rounded-2xl border border-white/8 p-6 sm:p-8">
          {tab === "deposit" ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">Wallet Balance</span>
                <span className="font-mono-merq text-white">{fmt(dash?.wallet_balance)} MERQ</span>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-5">
                {packages.map((p) => (
                  <button key={p} onClick={() => { setAmount(String(p)); setApproved(false); }}
                    className={`rounded-xl border px-2 py-2.5 font-mono-merq text-sm transition-colors ${
                      amount === String(p) ? "border-amber-400/40 bg-amber-400/10 text-amber-300" : "border-white/10 text-slate-400 hover:border-white/20"}`}>
                    {p}
                  </button>
                ))}
              </div>

              <label className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">Amount (MERQ)</label>
              <input
                data-testid="deposit-amount-input"
                type="number" value={amount}
                onChange={(e) => { setAmount(e.target.value); setApproved(false); }}
                placeholder="0.00"
                className="mt-2 w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3.5 font-mono-merq text-lg text-white focus:border-amber-400/40 outline-none"
              />

              {/* two-step flow */}
              <div className="flex items-center gap-3 mt-4 text-xs font-mono-merq">
                <span className={`flex items-center gap-1 ${approved ? "text-emerald-400" : "text-amber-400"}`}>
                  {approved ? <CheckCircle2 className="h-4 w-4" /> : <span className="h-4 w-4 rounded-full border border-current" />} 1. Approve
                </span>
                <span className="h-px flex-1 bg-white/10" />
                <span className={`flex items-center gap-1 ${approved ? "text-amber-400" : "text-slate-600"}`}>
                  <span className="h-4 w-4 rounded-full border border-current" /> 2. Deposit
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <button data-testid="deposit-approve-button" disabled={busy || approved} onClick={approve}
                  className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/5 text-amber-300 font-semibold px-5 py-3 transition-colors hover:bg-amber-400/10 disabled:opacity-50">
                  {busy && !approved ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Approve
                </button>
                <button data-testid="deposit-submit-button" disabled={busy || !approved} onClick={deposit}
                  className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold px-5 py-3 transition-colors disabled:opacity-50">
                  {busy && approved ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Deposit
                </button>
              </div>
            </>
          ) : (
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
              {["Member active status", "Amount & minimum validation", "Daily limit & cooldown", "Sufficient balance", "Contract liquidity"].map((c) => (
                <li key={c} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400/70" /> {c}</li>
              ))}
            </ul>
          </div>
          <div className="glass rounded-2xl border border-cyan-400/15 p-6">
            <div className="flex items-start gap-2 text-sm text-slate-400">
              <Info className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <p>Deposits use a standard BEP-20 <span className="text-slate-200">approve → deposit</span> two-step flow. MERQ is valued at <span className="text-amber-300 font-mono-merq">${price?.merq_usd}</span> (admin-configured).</p>
            </div>
          </div>
        </div>
      </div>
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
