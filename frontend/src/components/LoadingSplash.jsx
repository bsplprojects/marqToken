import BrandLogo from "@/components/BrandLogo";

export default function LoadingSplash({ label = "LOADING MERQON" }) {
  return (
    <div className="merq-bg merq-grain min-h-screen flex items-center justify-center relative z-10">
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-2xl animate-pulse" />
          <div className="relative pulse-gold rounded-full">
            <BrandLogo size={72} />
          </div>
        </div>
        <div className="font-display text-xl font-black tracking-tight">
          <span className="text-white">Merq</span><span className="gold-text">ON</span>
        </div>
        <div className="font-mono-merq text-[11px] tracking-[0.3em] text-amber-400/70 uppercase animate-pulse">{label}</div>
      </div>
    </div>
  );
}
