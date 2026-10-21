// A sale as returned by GET /api/sales. Amounts are cents (Bs or USDT); the
// rate is Bs per USDT used in the sale
export type SaleRow = {
  id: string;
  subscriptionId: string | null;
  clientName: string;
  serviceName: string;
  kind: "NEW" | "RENEWAL";
  grossBs: number;
  supplierBs: number;
  netBs: number;
  rate: number;
  rateSource: "BINANCE" | "CUSTOM";
  grossUsdt: number;
  supplierUsdt: number;
  netUsdt: number;
  soldAt: string;
  voidedAt: string | null;
};

export type SalesTotals = {
  count: number;
  grossBs: number;
  supplierBs: number;
  netBs: number;
  grossUsdt: number;
  netUsdt: number;
};

export type SalesMonth = {
  month: string;
  totals: SalesTotals;
  rows: SaleRow[];
};
