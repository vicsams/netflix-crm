import prisma from "@/shared/lib/db";
import { NextResponse } from "next/server";
import { requireUser } from "@/shared/lib/session";

export async function GET(req: Request) {
  try {
    const { userId, response } = await requireUser(req);
    if (response) return response;

    const bankEarnings = await prisma.bankEarnings.findUnique({
      where: { userId },
    });

    return NextResponse.json({
      total: bankEarnings?.total ?? 0,
      totalUsdt: bankEarnings?.totalUsdt ?? 0,
    });
  } catch (error) {
    console.error("Error fetching bank earnings:", error);
    return NextResponse.json(
      { message: "Error interno del servidor. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
