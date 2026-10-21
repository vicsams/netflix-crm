"use client";

import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/shared/components/ui/separator";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { currentMonth, monthLabel } from "@/features/sales/lib/month";
import { bs, usdt } from "@/features/sales/lib/sales";
import { fetchSales } from "@/features/sales/services/sales";

// This month's sales, with the same query as the Ventas tab so both refresh
// after every sale or void
export default function TotalRevenueCard() {
  const month = currentMonth();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["sales", month],
    queryFn: () => fetchSales(month),
  });

  const totals = data?.totals;
  const count = totals?.count ?? 0;

  return (
    <div className="bg-card text-card-foreground col-span-2 flex h-30 items-start justify-between gap-1 rounded-xl p-4 shadow-xl max-sm:col-span-1 max-sm:h-fit">
      <div className="flex h-full w-1/2 flex-col justify-between gap-4">
        <h2 className="text-sm font-normal">
          Ventas de {monthLabel(month, false)}
        </h2>
        {isLoading ? (
          <Skeleton className="h-8 w-28" />
        ) : isError ? (
          <p className="text-muted-foreground text-sm">No disponible</p>
        ) : (
          <div>
            <p className="text-xl font-bold">{bs(totals?.grossBs ?? 0)}</p>
            <p className="text-muted-foreground text-xs">
              {usdt(totals?.grossUsdt ?? 0)} · {count}{" "}
              {count === 1 ? "venta" : "ventas"}
            </p>
          </div>
        )}
      </div>
      <Separator orientation="vertical" className="mx-4" />
      <div className="flex h-full w-1/2 flex-col justify-between gap-4">
        <h2 className="text-sm font-normal">Ganancia del mes</h2>
        {isLoading ? (
          <Skeleton className="h-8 w-28" />
        ) : isError ? (
          <p className="text-muted-foreground text-sm">No disponible</p>
        ) : (
          <div>
            <p className="text-xl font-bold">{bs(totals?.netBs ?? 0)}</p>
            <p className="text-muted-foreground text-xs">
              {usdt(totals?.netUsdt ?? 0)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
