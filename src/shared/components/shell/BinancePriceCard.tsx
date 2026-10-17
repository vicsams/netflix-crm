"use client";

import { RotateCw } from "lucide-react";
import { useBinancePrice } from "@/shared/context/BinancePriceContext";
import { formatMoney } from "@/shared/lib/money";

export default function BinancePriceCard() {
  const { price, isLoading, isError, retry } = useBinancePrice();

  return (
    <div className="flex w-fit items-center gap-1 rounded-full bg-black px-4 py-1 text-yellow-300">
      {price !== null ? (
        <p className="text-md font-bold">
          Precio USDT: {formatMoney(price)} Bs
        </p>
      ) : isLoading ? (
        <p className="text-md animate-pulse text-yellow-300/70">
          Cargando precio USDT…
        </p>
      ) : (
        <button
          type="button"
          onClick={retry}
          className="flex items-center gap-1.5 text-red-400 hover:text-red-300"
        >
          {isError ? "Precio no disponible" : "Sin precio"}
          <RotateCw className="size-3.5" />
          <span className="sr-only">Reintentar</span>
        </button>
      )}
    </div>
  );
}
