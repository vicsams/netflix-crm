"use client";

import { RotateCw } from "lucide-react";
import { useBinancePrice } from "@/shared/context/BinancePriceContext";
import { formatMoney } from "@/shared/lib/money";

export default function BinancePriceCard() {
  const { price, isLoading, isError, retry } = useBinancePrice();

  return (
    <div className="border-lumina-purple/60 bg-lumina-purple/25 flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm whitespace-nowrap">
      {price !== null ? (
        <p>
          <span className="text-lumina-purple-light font-medium">USDT</span>{" "}
          <span className="font-semibold">{formatMoney(price)} Bs</span>
        </p>
      ) : isLoading ? (
        <p className="text-muted-foreground animate-pulse">Cargando USDT…</p>
      ) : (
        <button
          type="button"
          onClick={retry}
          className="text-destructive flex items-center gap-1.5 hover:opacity-80"
        >
          {isError ? "Precio no disponible" : "Sin precio"}
          <RotateCw className="size-3.5" />
          <span className="sr-only">Reintentar</span>
        </button>
      )}
    </div>
  );
}
