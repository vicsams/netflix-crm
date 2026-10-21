import { NextResponse } from "next/server";
import prisma from "@/shared/lib/db";
import { requireUser } from "@/shared/lib/session";
import { currentMonth, isMonth, monthRange } from "@/features/sales/lib/month";

// The user's sales for one month (?month=YYYY-MM, default: this month), in
// Venezuela time, with the month's totals. Voided sales are listed but not
// counted
export async function GET(req: Request) {
  try {
    const { userId, response } = await requireUser(req);
    if (response) return response;

    const param = new URL(req.url).searchParams.get("month");
    const month = param ?? currentMonth();
    if (!isMonth(month)) {
      return NextResponse.json(
        { message: "Mes inválido (usa AAAA-MM)" },
        { status: 400 },
      );
    }

    const { from, to } = monthRange(month);
    const sales = await prisma.sale.findMany({
      where: { userId, soldAt: { gte: from, lt: to } },
      orderBy: { soldAt: "desc" },
    });

    const totals = {
      count: 0,
      grossBs: 0,
      supplierBs: 0,
      netBs: 0,
      grossUsdt: 0,
      netUsdt: 0,
    };
    for (const sale of sales) {
      if (sale.voidedAt) continue;
      totals.count += 1;
      totals.grossBs += sale.grossBs;
      totals.supplierBs += sale.supplierBs;
      totals.netBs += sale.netBs;
      totals.grossUsdt += sale.grossUsdt;
      totals.netUsdt += sale.netUsdt;
    }

    return NextResponse.json({
      month,
      totals,
      rows: sales.map((sale) => ({
        ...sale,
        rate: Number(sale.rate),
        soldAt: sale.soldAt.toISOString(),
        voidedAt: sale.voidedAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json(
      { message: "Error interno del servidor. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
