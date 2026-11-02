export const MERQ_COIN = "/merq-token.webp";

export const MerqCoin = ({ size = 24, className = "", spin = false, testid }) => (
  <img data-testid={testid} src={MERQ_COIN} alt="MERQ" style={{ height: size, width: size }}
    className={`rounded-full object-cover flex-shrink-0 ring-1 ring-amber-400/40 ${spin ? "merq-coin-hover" : ""} ${className}`} />
);
