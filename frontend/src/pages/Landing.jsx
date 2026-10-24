import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { SponsorField } from "@/components/SponsorField";
import { toast } from "sonner";
import {
  connectMetaMask,
  getStoredWallet, clearWallet, hasMetaMask,
} from "@/lib/wallet";
import { shortAddr } from "@/lib/format";
import BrandLogo from "@/components/BrandLogo";
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
  const [account, setAccount] = useState(null);
  const [sponsorInput, setSponsorInput] = useState(ref || "");
  const [sponsor, setSponsor] = useState(null);
  const isRegister = useLocation().pathname === "/register";
  const needsSponsor = account?.sponsor_required;

  useEffect(() => {
    if (!loading && member) navigate("/dashboard", { replace: true });
  }, [loading, member, navigate]);

  useEffect(() => {
    if (!wallet) return;
    setStep("sign");
    setAccount(null);
    api.get(`/auth/lookup/${wallet.address}`).then(({ data }) => setAccount(data)).catch(() => setAccount({ registered: true }));
  }, [wallet]);

  const doConnect = async (kind) => {
    setBusy(true);
    try {
      const w = await connectMetaMask();
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
      const res = await signIn(wallet, needsSponsor ? sponsor : null);
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
          <BrandLogo size={40} />
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
                <h2 className="font-display text-2xl font-bold text-white">{isRegister ? "Create Account" : "Connect Wallet"}</h2>
                <p className="text-slate-500 text-sm mt-1 mb-6">
                  {isRegister ? "Connect your wallet to join with your sponsor." : "Log in, or sign up with a sponsor if you're new."}
                </p>

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
                  <p data-testid="no-wallet-hint" className="text-[11px] text-slate-500 mt-2 text-center">
                    No wallet extension detected — install MetaMask or open this page in your wallet's browser.
                  </p>
                )}
                <div className="mt-6 pt-5 border-t border-white/10 text-center text-sm text-slate-500">
                  {isRegister ? (
                    <>Already a member?{" "}
                      <Link data-testid="login-link" to="/app" className="text-amber-400 hover:text-amber-300 font-medium transition-colors">Log in</Link>
                    </>
                  ) : (
                    <>New to MerqON?{" "}
                      <Link data-testid="signup-link" to="/register" className="text-amber-400 hover:text-amber-300 font-medium transition-colors">Sign up with a referral</Link>
                    </>
                  )}
                </div>
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
                {!account ? (
                  <div data-testid="account-checking" className="flex items-center justify-center gap-2 text-sm text-slate-500 py-4">
                    <Loader2 className="h-4 w-4 animate-spin" /> Checking account…
                  </div>
                ) : (
                  <>
                    {needsSponsor ? (
                      <>
                        <div data-testid="signup-notice" className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 mb-5 text-xs text-amber-200 leading-relaxed">
                          This wallet isn't registered yet. Paste your sponsor's wallet address or referral link to sign up.
                        </div>
                        <SponsorField value={sponsorInput} onChange={setSponsorInput} onValid={setSponsor} self={wallet?.address} />
                      </>
                    ) : (
                      <p className="text-slate-500 text-sm mb-5 leading-relaxed">
                        Sign a one-time message to prove ownership. This generates no transaction and costs no gas.
                      </p>
                    )}
                    <button
                      data-testid="wallet-sign-button"
                      disabled={busy || (needsSponsor && !sponsor)}
                      onClick={doSignIn}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold px-5 py-4 transition-colors disabled:opacity-60"
                    >
                      {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Fingerprint className="h-5 w-5" />}
                      {busy ? "Verifying signature…" : needsSponsor ? "Sign Up" : "Sign In"}
                    </button>
                  </>
                )}
                <button
                  data-testid="use-different-wallet-button"
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
