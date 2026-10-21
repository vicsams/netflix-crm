import * as z from "zod";
import { Prisma } from "@/shared/lib/generated/prisma/client";

// Server only: recording a sale. Client code may only `import type` from here.

// What the create/renew dialogs send with a sale. Amounts are Bs cents; the
// rate is Bs per USDT, as used to compute the price
export const saleInputSchema = z.object({
  grossBs: z.number().int().min(0),
  supplierBs: z.number().int().min(0),
  rate: z.number().positive().max(1_000_000_000),
  rateSource: z.enum(["BINANCE", "CUSTOM"]),
});

export type SaleInput = z.infer<typeof saleInputSchema>;

// The optional `sale` sent with a create or renewal: null when absent,
// "invalid" when present but malformed
export function parseSaleInput(value: unknown): SaleInput | null | "invalid" {
  if (value === undefined || value === null) return null;
  const parsed = saleInputSchema.safeParse(value);
  return parsed.success ? parsed.data : "invalid";
}

// Bs cents -> USDT cents at the sale's rate: (cents / 100) / rate * 100
export function toUsdtCents(bsCents: number, rate: number) {
  return Math.round(bsCents / rate);
}

// The sale row, with the profit and USDT equivalents computed here rather
// than trusted from the client, so they always match the amounts and rate
export function buildSale(
  input: SaleInput,
  context: {
    userId: string;
    subscriptionId: string;
    clientName: string;
    serviceName: string;
    kind: "NEW" | "RENEWAL";
  },
) {
  const netBs = Math.max(input.grossBs - input.supplierBs, 0);
  return {
    ...context,
    grossBs: input.grossBs,
    supplierBs: input.supplierBs,
    netBs,
    rate: new Prisma.Decimal(input.rate.toFixed(4)),
    rateSource: input.rateSource,
    grossUsdt: toUsdtCents(input.grossBs, input.rate),
    supplierUsdt: toUsdtCents(input.supplierBs, input.rate),
    netUsdt: toUsdtCents(netBs, input.rate),
  };
}
