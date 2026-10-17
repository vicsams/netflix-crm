import { ReactQueryProvider } from "../provider";
import Header from "@/shared/components/shell/Header";
import { BinancePriceProvider } from "@/shared/context/BinancePriceContext";

export const dynamic = "force-dynamic";

// The Binance price loads in the background (BinancePriceProvider) instead of
// here, so the dashboard renders without waiting for Binance
export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col gap-10">
      <ReactQueryProvider>
        <BinancePriceProvider>
          <Header />
          {children}
        </BinancePriceProvider>
      </ReactQueryProvider>
    </div>
  );
}
