"use client";

import React, { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/shared/lib/axiosInstance";

type BinancePriceContextType = {
  price: number | null;
  isLoading: boolean;
  isError: boolean;
  retry: () => void;
};

const BinancePriceContext = createContext<BinancePriceContextType>({
  price: null,
  isLoading: false,
  isError: false,
  retry: () => {},
});

async function fetchBinancePrice(): Promise<number> {
  const response = await axiosInstance.get<{ price: number }>("/binance-price");
  return response.data.price;
}

// Loads the price in the background, so a slow or failing Binance never holds
// up the dashboard; the header and the amount dialogs show its state
export const BinancePriceProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["binancePrice"],
    queryFn: fetchBinancePrice,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    retry: 1,
  });

  return (
    <BinancePriceContext.Provider
      value={{
        price: data ?? null,
        isLoading,
        isError,
        retry: () => void refetch(),
      }}
    >
      {children}
    </BinancePriceContext.Provider>
  );
};

export const useBinancePrice = () => {
  return useContext(BinancePriceContext);
};
