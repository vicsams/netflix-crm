import prisma from "@/shared/lib/db";
import { NextResponse } from "next/server";
import { requireUser } from "@/shared/lib/session";

export async function GET(req: Request) {
  try {
    const { userId, response } = await requireUser(req);
    if (response) return response;

    const withdrawals = await prisma.bankWithdrawal.findMany({
      where: { userId },
      select: {
        id: true,
        currency: true,
        amount: true,
        reason: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(withdrawals, { status: 200 });
  } catch (error) {
    console.error("Error fetching withdrawals:", error);
    return NextResponse.json(
      { message: "Error interno del servidor. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
