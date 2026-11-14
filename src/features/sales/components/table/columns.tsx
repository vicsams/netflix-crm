"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/shared/components/ui/badge";
import SaleVoidAction from "@/features/sales/components/SaleVoidAction";
import {
  RATE_SOURCE_LABEL,
  SALE_KIND_LABEL,
  bs,
  saleDateTime,
  usdt,
} from "@/features/sales/lib/sales";
import type { SaleRow } from "@/features/sales/types/sale";

export type ServiceColors = Map<
  string,
  { textColor: string; backgroundColor: string }
>;

// The service in its current colors when it still exists, else a neutral
// badge (sales keep the name even after the service is deleted)
export function SaleServiceName({
  name,
  colors,
}: {
  name: string;
  colors: ServiceColors;
}) {
  const service = colors.get(name.toLowerCase());
  if (!service) {
    return (
      <Badge variant="secondary" className="font-bold">
        {name}
      </Badge>
    );
  }
  return (
    <Badge
      className="font-bold"
      style={{
        color: service.textColor,
        backgroundColor: service.backgroundColor,
      }}
    >
      {name}
    </Badge>
  );
}

function Amount({
  bsCents,
  usdtCents,
}: {
  bsCents: number;
  usdtCents?: number;
}) {
  return (
    <div className="text-right">
      <div>{bs(bsCents)}</div>
      {usdtCents !== undefined && (
        <div className="text-muted-foreground text-xs">{usdt(usdtCents)}</div>
      )}
    </div>
  );
}

export function salesColumns(colors: ServiceColors): ColumnDef<SaleRow>[] {
  return [
    {
      id: "soldAt",
      header: "Fecha",
      meta: { className: "w-px" },
      cell: ({ row }) => saleDateTime(row.original.soldAt),
    },
    {
      id: "client",
      header: "Cliente",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.clientName}</span>
      ),
    },
    {
      id: "service",
      header: "Servicio",
      cell: ({ row }) => (
        <SaleServiceName name={row.original.serviceName} colors={colors} />
      ),
    },
    {
      id: "kind",
      header: "Tipo",
      meta: { className: "w-px" },
      cell: ({ row }) => SALE_KIND_LABEL[row.original.kind],
    },
    {
      id: "gross",
      header: () => <div className="text-right">Pagado</div>,
      meta: { className: "w-px" },
      cell: ({ row }) => (
        <Amount
          bsCents={row.original.grossBs}
          usdtCents={row.original.grossUsdt}
        />
      ),
    },
    {
      id: "supplier",
      header: () => <div className="text-right">Costo</div>,
      meta: { className: "w-px" },
      cell: ({ row }) => (
        <Amount
          bsCents={row.original.supplierBs}
          usdtCents={row.original.supplierUsdt}
        />
      ),
    },
    {
      id: "net",
      header: () => <div className="text-right">Ganancia</div>,
      meta: { className: "w-px" },
      cell: ({ row }) => (
        <div className="font-semibold">
          <Amount
            bsCents={row.original.netBs}
            usdtCents={row.original.netUsdt}
          />
        </div>
      ),
    },
    {
      id: "rate",
      header: () => <div className="text-right">Tasa</div>,
      meta: { className: "w-px" },
      cell: ({ row }) => (
        <div className="text-right">
          <div>{bs(Math.round(row.original.rate * 100))}</div>
          <div className="text-muted-foreground text-xs">
            {RATE_SOURCE_LABEL[row.original.rateSource]}
          </div>
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      meta: { className: "w-px" },
      cell: ({ row }) => <SaleVoidAction sale={row.original} />,
    },
  ];
}
