export const LOGO_URL = "/merqon-mark.png";

export default function BrandLogo({ size = 40, className = "" }) {
  return (
    <img
      src={LOGO_URL}
      alt="MerqON"
      style={{ height: size, width: size }}
      className={`rounded-xl object-cover bg-black ring-1 ring-amber-400/40 ${className}`}
    />
  );
}
