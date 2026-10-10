import { ReactQueryProvider } from "../provider";
import Header from "@/shared/components/shell/Header";
import { BinancePriceProvider } from "@/shared/context/BinancePriceContext";
import { fetchP2PPrice } from "@/shared/lib/binance";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let price = null;
  try {
    price = await fetchP2PPrice();
  } catch (err) {
    console.error("Error fetching P2P price:", err);
  }

  return (
    <div className="flex flex-col gap-10">
      <BinancePriceProvider price={price}>
        <Header price={price} />
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </BinancePriceProvider>
    </div>
  );
}
