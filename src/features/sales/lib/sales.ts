import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatMoney } from "@/shared/lib/money";
import type { SaleRow, SalesTotals } from "@/features/sales/types/sale";

export const SALE_KIND_LABEL: Record<SaleRow["kind"], string> = {
  NEW: "Nueva",
  RENEWAL: "Renovación",
};

export const RATE_SOURCE_LABEL: Record<SaleRow["rateSource"], string> = {
  BINANCE: "Binance",
  CUSTOM: "Manual",
};

// Cents -> "1.234,56 Bs" / "1,23 USDT"
export const bs = (cents: number) => `${formatMoney(cents / 100)} Bs`;
export const usdt = (cents: number) => `${formatMoney(cents / 100)} USDT`;

// "20 oct 2026, 14:35" in the viewer's timezone
export function saleDateTime(soldAt: string) {
  return format(new Date(soldAt), "d MMM yyyy, HH:mm", { locale: es });
}

// Totals of the given rows, leaving voided sales out
export function totalsOf(rows: SaleRow[]): SalesTotals {
  const totals: SalesTotals = {
    count: 0,
    grossBs: 0,
    supplierBs: 0,
    netBs: 0,
    grossUsdt: 0,
    netUsdt: 0,
  };
  for (const row of rows) {
    if (row.voidedAt) continue;
    totals.count += 1;
    totals.grossBs += row.grossBs;
    totals.supplierBs += row.supplierBs;
    totals.netBs += row.netBs;
    totals.grossUsdt += row.grossUsdt;
    totals.netUsdt += row.netUsdt;
  }
  return totals;
}

// A CSV that Spanish-locale Excel opens correctly: UTF-8 BOM (accents),
// ";" between columns and "," as the decimal separator
export function salesCsv(rows: SaleRow[]) {
  const decimal = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");
  const cell = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const header = [
    "Fecha",
    "Cliente",
    "Servicio",
    "Tipo",
    "Pagado (Bs)",
    "Pagado (USDT)",
    "Costo proveedor (Bs)",
    "Ganancia (Bs)",
    "Ganancia (USDT)",
    "Tasa (Bs/USDT)",
    "Origen de la tasa",
    "Estado",
  ];
  const lines = rows.map((row) =>
    [
      cell(format(new Date(row.soldAt), "yyyy-MM-dd HH:mm")),
      cell(row.clientName),
      cell(row.serviceName),
      cell(SALE_KIND_LABEL[row.kind]),
      decimal(row.grossBs),
      decimal(row.grossUsdt),
      decimal(row.supplierBs),
      decimal(row.netBs),
      decimal(row.netUsdt),
      row.rate.toFixed(2).replace(".", ","),
      cell(RATE_SOURCE_LABEL[row.rateSource]),
      cell(row.voidedAt ? "Anulada" : "Vigente"),
    ].join(";"),
  );
  return "﻿" + [header.map(cell).join(";"), ...lines].join("\r\n");
}

export function downloadCsv(filename: string, content: string) {
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
