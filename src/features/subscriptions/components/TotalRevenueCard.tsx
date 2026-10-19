"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchClientStatuses } from "@/features/subscriptions/services/subscriptions";
import { useMemo } from "react";
import { ClientStatus } from "@/features/subscriptions/types/clientStatus";

export default function TotalRevenueCard() {
  const { data: clientStatuses = [], isLoading } = useQuery<ClientStatus[]>({
    queryKey: ["clientStatuses"],
    queryFn: fetchClientStatuses,
  });

  const totalSumBs = useMemo(() => {
    return (
      clientStatuses.reduce((acc, status) => {
        if (status.status === "ACTIVE") {
          return acc + (status.amount || 0);
        }
        return acc;
      }, 0) / 100
    );
  }, [clientStatuses]);

  return (
    <div className="bg-card text-card-foreground col-span-1 flex flex-col gap-4 rounded-xl p-4 shadow-xl">
      <h2 className="text-md font-normal">Suma Total Mensual</h2>
      {isLoading ? (
        <p className="text-md font-bold">Calculando...</p>
      ) : (
        <p className="text-xl font-bold">{totalSumBs.toFixed(2)} Bs</p>
      )}
    </div>
  );
}
