import prisma from "@/shared/lib/db";
import { NextResponse } from "next/server";
import { requireUser } from "@/shared/lib/session";

export async function POST(req: Request) {
  try {
    const { userId, response } = await requireUser(req);
    if (response) return response;

    const body = await req.json();
    const { amountBs, rate } = body;

    if (
      typeof amountBs !== "number" ||
      amountBs <= 0 ||
      typeof rate !== "number" ||
      rate <= 0
    ) {
      return NextResponse.json(
        { message: "Monto o tasa inválidos" },
        { status: 400 },
      );
    }

    if (rate > amountBs) {
      return NextResponse.json(
        {
          message:
            "La tasa de cambio no puede ser mayor que el monto a convertir",
        },
        { status: 400 },
      );
    }

    const currentBank = await prisma.bankEarnings.findUnique({
      where: { userId },
    });

    if (!currentBank) {
      return NextResponse.json(
        { message: "No hay fondos registrados" },
        { status: 404 },
      );
    }

    const amountInCents = Math.round(amountBs * 100);

    if (currentBank.total < amountInCents) {
      return NextResponse.json(
        { message: "No tienes suficientes fondos en Bs" },
        { status: 400 },
      );
    }

    const expectedUsdt = amountBs / rate;
    const expectedUsdtCents = Math.round(expectedUsdt * 100);

    const updatedBank = await prisma.bankEarnings.update({
      where: { userId },
      data: {
        total: {
          decrement: amountInCents,
        },
        totalUsdt: {
          increment: expectedUsdtCents,
        },
      },
    });

    return NextResponse.json(updatedBank);
  } catch (error) {
    console.error("Error converting bank currency:", error);
    return NextResponse.json(
      { message: "Error interno del servidor. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
