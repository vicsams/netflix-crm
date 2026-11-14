"use client";

import SaleVoidAction from "@/features/sales/components/SaleVoidAction";
import {
  SaleServiceName,
  type ServiceColors,
} from "@/features/sales/components/table/columns";
import {
  RATE_SOURCE_LABEL,
  SALE_KIND_LABEL,
  bs,
  saleDateTime,
  usdt,
} from "@/features/sales/lib/sales";
import type { SaleRow } from "@/features/sales/types/sale";
import { formatMoney } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";

const struck = "text-muted-foreground line-through opacity-60";

export default function SalesList({
  data,
  colors,
  emptyMessage,
}: {
  data: SaleRow[];
  colors: ServiceColors;
  emptyMessage: string;
}) {
  if (data.length === 0) {
    return (
      <div className="text-muted-foreground border-t py-10 text-center text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className="divide-y border-t">
      {data.map((sale) => {
        const voided = !!sale.voidedAt;
        return (
          <li key={sale.id} className="flex flex-col gap-1 px-4 py-3">
            <div className={cn("flex flex-col gap-1", voided && struck)}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-medium">
                    {sale.clientName}
                  </span>
                  <span className="shrink-0">
                    <SaleServiceName name={sale.serviceName} colors={colors} />
                  </span>
                </div>
                <span className="shrink-0 font-semibold">{bs(sale.netBs)}</span>
              </div>
              <div className="text-muted-foreground flex justify-between gap-3 text-xs">
                <span className="truncate">
                  {saleDateTime(sale.soldAt)} · {SALE_KIND_LABEL[sale.kind]}
                </span>
                <span className="shrink-0">{usdt(sale.netUsdt)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span
                className={cn(
                  "text-muted-foreground truncate text-xs",
                  voided && struck,
                )}
              >
                Pagó {bs(sale.grossBs)} · {RATE_SOURCE_LABEL[sale.rateSource]}{" "}
                {formatMoney(sale.rate)}
              </span>
              <span className="-mr-2 shrink-0">
                <SaleVoidAction sale={sale} />
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
