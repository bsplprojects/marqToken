import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "ethers";
import { api } from "@/lib/api";
import { merqBalanceWei } from "@/lib/techpass";

// Live MERQ balance of the connected wallet, read on-chain, plus live USD price
export function useLiveMerq(address) {
  const { data: p } = useQuery({ queryKey: ["merq-price"], queryFn: async () => (await api.get("/ports/price")).data, refetchInterval: 30000 });
  const { data: wei, isLoading, isError } = useQuery({
    queryKey: ["merq-balance", address, p?.token_address],
    queryFn: () => merqBalanceWei(p, address),
    enabled: !!(address && p?.token_address),
    refetchInterval: 20000,
  });
  const live = !!p?.token_address;
  const balance = wei !== undefined ? Number(formatUnits(wei, p.decimals)) : null;
  return {
    live, price: p?.merq_price ?? 0, source: p?.price_source,
    balance, usd: balance !== null ? balance * (p?.merq_price ?? 0) : null,
    loading: !p || (live && isLoading), error: isError,
  };
}
