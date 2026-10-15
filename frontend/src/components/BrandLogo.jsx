export const LOGO_URL =
  "https://static.prod-images.emergentagent.com/jobs/0d2f38fb-f374-4f65-82fb-6baa71195ee0/images/b4d5a2f8bc3a3e78e56f4a056c410c8f300672e18ba36cf5663509880cb71b6e.jpeg";

export default function BrandLogo({ size = 40, className = "" }) {
  return (
    <img
      src={LOGO_URL}
      alt="MerqON"
      style={{ height: size, width: size }}
      className={`rounded-full object-cover ring-1 ring-amber-400/40 ${className}`}
    />
  );
}
