import prisma from "@/shared/lib/db";
import { NextResponse } from "next/server";
import { requireUser } from "@/shared/lib/session";

type WithdrawCurrency = "BS" | "USDT";

export async function POST(req: Request) {
  try {
    const { userId, response } = await requireUser(req);
    if (response) return response;

    const body = await req.json();
    const { currency, amount, reason } = body ?? {};

    if (currency !== "BS" && currency !== "USDT") {
      return NextResponse.json(
        { message: "Invalid currency. Use BS or USDT" },
        { status: 400 },
      );
    }

    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { message: "Amount must be a number greater than 0" },
        { status: 400 },
      );
    }

    if (typeof reason !== "string" || reason.trim().length === 0) {
      return NextResponse.json(
        { message: "Reason is required" },
        { status: 400 },
      );
    }

    const amountInCents = Math.round(amount * 100);

    if (amountInCents <= 0) {
      return NextResponse.json(
        { message: "Amount must be greater than 0" },
        { status: 400 },
      );
    }

    const currentBank = await prisma.bankEarnings.findUnique({
      where: { userId },
    });

    if (!currentBank) {
      return NextResponse.json({ message: "Bank not found" }, { status: 404 });
    }

    const available =
      currency === "BS" ? currentBank.total : currentBank.totalUsdt;

    if (available < amountInCents) {
      return NextResponse.json(
        {
          message:
            currency === "BS"
              ? "Insufficient Bs funds in bank"
              : "Insufficient USDT funds in bank",
        },
        { status: 400 },
      );
    }

    const [updatedBank, withdrawal] = await prisma.$transaction([
      prisma.bankEarnings.update({
        where: { userId },
        data:
          currency === "BS"
            ? {
                total: {
                  decrement: amountInCents,
                },
              }
            : {
                totalUsdt: {
                  decrement: amountInCents,
                },
              },
      }),
      prisma.bankWithdrawal.create({
        data: {
          currency: currency as WithdrawCurrency,
          amount: amountInCents,
          reason: reason.trim(),
          userId,
        },
      }),
    ]);

    return NextResponse.json({
      bank: updatedBank,
      withdrawal,
    });
  } catch (error) {
    console.error("Error withdrawing bank funds:", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
