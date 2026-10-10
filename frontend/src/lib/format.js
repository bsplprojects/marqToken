export function fmt(n, dp = 2) {
  if (n === null || n === undefined || isNaN(n)) return "0.00";
  return Number(n).toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

export function fmtUSD(n) {
  if (n === null || n === undefined || isNaN(n)) return "$0.00";
  return "$" + fmt(n, 2);
}

export function shortAddr(a) {
  if (!a) return "";
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
}

export function fmtDate(s) {
  if (!s) return "";
  try {
    return new Date(s).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return s;
  }
}

export function fmtDateTime(s) {
  if (!s) return "";
  try {
    return new Date(s).toLocaleString("en-US", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return s;
  }
}

export const INCOME_META = {
  referral: { label: "Referral Income", color: "#F3BA2F" },
  profit_growth: { label: "Profit Growth", color: "#10B981" },
  pg_commission: { label: "PG Commission", color: "#06B6D4" },
  reward: { label: "Rewards", color: "#A78BFA" },
  autopool: { label: "Autopool", color: "#F43F5E" },
  deposit: { label: "Deposit", color: "#64748B" },
  withdraw: { label: "Withdrawal", color: "#94A3B8" },
  autopool_entry: { label: "Autopool Entry", color: "#64748B" },
};
