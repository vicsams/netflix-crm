import { NextResponse } from "next/server";
import prisma from "@/shared/lib/db";
import { requireUser } from "@/shared/lib/session";

// Voids a sale: it stays in the history, leaves the totals, and its profit is
// taken back out of the bank. The subscription's dates are not changed
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { userId, response } = await requireUser(req);
    if (response) return response;

    const sale = await prisma.sale.findFirst({
      where: { id, userId },
      select: { netBs: true },
    });
    if (!sale) {
      return NextResponse.json(
        { message: "Venta no encontrada" },
        { status: 404 },
      );
    }

    // Only a sale that isn't voided yet is voided, and the bank changes only
    // then, together; a second (or concurrent) void changes nothing
    const voided = await prisma.$transaction(async (tx) => {
      const { count } = await tx.sale.updateMany({
        where: { id, userId, voidedAt: null },
        data: { voidedAt: new Date() },
      });
      if (count === 0) return false;

      await tx.bankEarnings.upsert({
        where: { userId },
        update: { total: { decrement: sale.netBs } },
        create: { userId, total: -sale.netBs },
      });
      return true;
    });

    if (!voided) {
      return NextResponse.json(
        { message: "La venta ya está anulada" },
        { status: 409 },
      );
    }

    return NextResponse.json({ message: "Venta anulada" });
  } catch (error) {
    console.error("Error voiding sale:", error);
    return NextResponse.json(
      { message: "Error interno del servidor. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
