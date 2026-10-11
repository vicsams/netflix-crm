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
        { message: "Invalid amount or rate provided" },
        { status: 400 },
      );
    }

    if (rate > amountBs) {
      return NextResponse.json(
        {
          message:
            "The change rate cannot be higher than the amount you want to convert",
        },
        { status: 400 },
      );
    }

    const currentBank = await prisma.bankEarnings.findUnique({
      where: { userId },
    });

    if (!currentBank) {
      return NextResponse.json({ message: "Bank not found" }, { status: 404 });
    }

    const amountInCents = Math.round(amountBs * 100);

    if (currentBank.total < amountInCents) {
      return NextResponse.json(
        { message: "Insufficient Bs funds in bank" },
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
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
