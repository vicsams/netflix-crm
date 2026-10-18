// lib/binance.ts
export async function fetchP2PPrice(): Promise<number | null> {
  const url = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search";
  const payload = {
    asset: "USDT",
    fiat: "VES",
    tradeType: "SELL",
    page: 1,
    rows: 1,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
    // Binance can hang; give up rather than keep the caller waiting
    signal: AbortSignal.timeout(4000),
  });

  if (!res.ok) throw new Error("Binance fetch failed");

  const json = await res.json();
  if (json.success && json.data?.length) return Number(json.data[0].adv.price);
  return null;
}
