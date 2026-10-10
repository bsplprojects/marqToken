import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  connectMetaMask, connectDemoMember, connectDemoAdmin,
  getStoredWallet, clearWallet, hasMetaMask,
} from "@/lib/wallet";
import { shortAddr } from "@/lib/format";
import {
  Hexagon, Wallet, ShieldCheck, Zap, Network, TrendingUp, Layers,
  CheckCircle2, ArrowRight, Loader2, Fingerprint,
} from "lucide-react";

export default function Landing() {
  const { member, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const ref = params.get("ref");
  const [wallet, setWallet] = useState(getStoredWallet());
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("connect");

  useEffect(() => {
    if (!loading && member) navigate("/dashboard", { replace: true });
  }, [loading, member, navigate]);

  useEffect(() => {
    if (wallet) setStep("sign");
  }, [wallet]);

  const doConnect = async (kind) => {
    setBusy(true);
    try {
      let w;
      if (kind === "metamask") w = await connectMetaMask();
      else if (kind === "admin") w = connectDemoAdmin();
      else w = connectDemoMember();
      setWallet(w);
      toast.success(`Wallet connected · ${shortAddr(w.address)}`);
    } catch (e) {
      toast.error(e.message || "Connection failed");
    } finally {
      setBusy(false);
    }
  };

  const doSignIn = async () => {
    setBusy(true);
    try {
      const res = await signIn(wallet, ref);
      toast.success(res.is_new ? "Welcome to MerqON! Account created." : "Signature verified · Signed in");
      navigate("/dashboard", { replace: true });
    } catch (e) {
      toast.error(e?.response?.data?.detail || e.message || "Sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    clearWallet();
    setWallet(null);
    setStep("connect");
  };

  const features = [
    { icon: Network, title: "Dual-Tree Network", desc: "Transparent sponsor & binary placement trees, fully auditable." },
    { icon: TrendingUp, title: "Income Engine", desc: "Configurable referral, growth & commission — no fixed promises." },
    { icon: Layers, title: "Autopool Matrix", desc: "Forced-matrix pool with clear cycle & reward rules." },
    { icon: ShieldCheck, title: "Non-Custodial Login", desc: "Sign a nonce with your wallet. No passwords, ever." },
  ];

  return (
    <div className="merq-bg merq-grain min-h-screen relative z-10">
      {/* nav */}
      <div className="flex items-center justify-between px-6 sm:px-10 py-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Hexagon className="h-9 w-9 text-amber-400 fill-amber-400/10" strokeWidth={1.5} />
            <div className="absolute inset-0 flex items-center justify-center font-display font-black text-amber-400 text-xs">M</div>
          </div>
          <div>
            <div className="font-display text-xl font-extrabold tracking-tight text-white leading-none">MerqON</div>
            <div className="font-mono-merq text-[9px] tracking-[0.25em] text-amber-400/70 uppercase mt-1">MERQ · BEP-20</div>
          </div>
        </div>
        <div className="font-mono-merq text-xs text-slate-500 hidden sm:flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-gold" /> BNB Smart Chain
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 items-center px-6 sm:px-10 lg:px-16 pt-8 pb-20 max-w-7xl mx-auto">
        {/* left */}
        <div className="fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/5 px-4 py-1.5 mb-6">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-mono-merq text-[11px] uppercase tracking-[0.2em] text-amber-300">Decentralized Membership Protocol</span>
          </div>
          <h1 className="font-display text-5xl sm:text-6xl font-black tracking-tight text-white leading-[1.05]">
            Own your <span className="gold-text">network.</span><br />
            Earn <span className="gold-text">transparently.</span>
          </h1>
          <p className="text-slate-400 text-lg mt-6 max-w-xl leading-relaxed">
            MerqON is a Web3 membership & token-utility platform on BNB Smart Chain. Every rule is
            configurable and on-ledger — no hidden promises, just a transparent income engine.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mt-10">
            {features.map((f) => (
              <div key={f.title} className="glass rounded-2xl p-5 border border-white/8 card-hover">
                <f.icon className="h-6 w-6 text-amber-400 mb-3" />
                <div className="font-display font-semibold text-white">{f.title}</div>
                <div className="text-sm text-slate-500 mt-1">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* right - connect card */}
        <div className="fade-up lg:pl-8">
          <div className="glass gold-glow rounded-3xl p-8 border border-amber-400/15 max-w-md mx-auto w-full">
            {ref && step === "connect" && (
              <div className="mb-6 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                <span className="font-mono-merq text-xs text-cyan-300">Referred by {shortAddr(ref)}</span>
              </div>
            )}

            {step === "connect" ? (
              <>
                <h2 className="font-display text-2xl font-bold text-white">Connect Wallet</h2>
                <p className="text-slate-500 text-sm mt-1 mb-6">Choose how you want to access MerqON.</p>

                <button
                  data-testid="connect-wallet-button"
                  disabled={busy}
                  onClick={() => doConnect("metamask")}
                  className="w-full flex items-center justify-between rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold px-5 py-4 transition-colors disabled:opacity-60"
                >
                  <span className="flex items-center gap-3"><Wallet className="h-5 w-5" /> MetaMask / Injected</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                {!hasMetaMask() && (
                  <p className="text-[11px] text-slate-500 mt-2 text-center">No extension detected — use a demo wallet below.</p>
                )}

                <div className="relative my-5">
                  <div className="h-px bg-white/10" />
                  <span className="absolute left-1/2 -translate-x-1/2 -top-2 px-3 bg-slate-950 font-mono-merq text-[10px] uppercase tracking-widest text-slate-600">or try a demo</span>
                </div>

                <button
                  data-testid="connect-demo-member-button"
                  disabled={busy}
                  onClick={() => doConnect("member")}
                  className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-white/5 hover:border-emerald-400/30 text-white font-medium px-5 py-3.5 transition-colors mb-3 disabled:opacity-60"
                >
                  <span className="flex items-center gap-3"><Fingerprint className="h-5 w-5 text-emerald-400" /> Demo Member Wallet</span>
                  <ArrowRight className="h-4 w-4 text-slate-500" />
                </button>
                <button
                  data-testid="connect-demo-admin-button"
                  disabled={busy}
                  onClick={() => doConnect("admin")}
                  className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-white/5 hover:border-amber-400/30 text-white font-medium px-5 py-3.5 transition-colors disabled:opacity-60"
                >
                  <span className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-amber-400" /> Demo Admin Wallet</span>
                  <ArrowRight className="h-4 w-4 text-slate-500" />
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-6">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span className="font-display text-lg font-semibold text-white">Wallet Connected</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 mb-6">
                  <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500 mb-1">Address</div>
                  <div className="font-mono-merq text-sm text-amber-300 break-all">{wallet?.address}</div>
                  <div className="font-mono-merq text-[10px] text-slate-600 mt-2 uppercase tracking-widest">{wallet?.mode} wallet</div>
                </div>
                <p className="text-slate-500 text-sm mb-5 leading-relaxed">
                  Sign a one-time message to prove ownership. This generates no transaction and costs no gas.
                </p>
                <button
                  data-testid="wallet-sign-button"
                  disabled={busy}
                  onClick={doSignIn}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold px-5 py-4 transition-colors disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Fingerprint className="h-5 w-5" />}
                  {busy ? "Verifying signature…" : "Sign In"}
                </button>
                <button
                  onClick={reset}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-300 mt-4 transition-colors"
                >
                  Use a different wallet
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
