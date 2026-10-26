export const UsdtLogo = ({ size = 40, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" className={className} role="img" aria-label="USDT">
    <circle cx="16" cy="16" r="16" fill="#26A17B" />
    <path fill="#fff" d="M17.9 17.4v0c-.1 0-.7.1-1.9.1-1 0-1.7 0-1.9-.1v0c-3.7-.2-6.5-.8-6.5-1.6s2.8-1.4 6.5-1.6v2.5c.2 0 .9.1 1.9.1 1.2 0 1.8-.1 1.9-.1v-2.5c3.7.2 6.5.8 6.5 1.6s-2.8 1.4-6.5 1.6zm0-3.4v-2.3h5.2V8.3H8.9v3.4h5.2V14c-4.2.2-7.4 1-7.4 2s3.2 1.8 7.4 2v7.2h3.8V18c4.2-.2 7.4-1 7.4-2s-3.2-1.8-7.4-2z" />
  </svg>
);


export const BnbLogo = ({ size = 40, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" className={className} role="img" aria-label="BNB">
    <circle cx="16" cy="16" r="16" fill="#F3BA2F" />
    <path fill="#fff" d="M12.1 14.3 16 10.4l3.9 3.9 2.3-2.3L16 5.8 9.8 12l2.3 2.3zM5.8 16l2.3-2.3 2.3 2.3-2.3 2.3L5.8 16zm6.3 1.7L16 21.6l3.9-3.9 2.3 2.3L16 26.2 9.8 20l2.3-2.3zm9.5-1.7 2.3-2.3 2.3 2.3-2.3 2.3-2.3-2.3zM18.3 16 16 13.7 13.7 16 16 18.3 18.3 16z" />
  </svg>
);

export const TokenChip = ({ testid, logo, label, value, symbol, tone }) => (
  <div data-testid={testid} className={`inline-flex items-center gap-3 rounded-2xl border px-4 py-3 ${tone}`}>
    {logo}
    <div>
      <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className="font-mono-merq text-xl font-bold text-white">{value} <span className="text-sm text-slate-500">{symbol}</span></div>
    </div>
  </div>
);
