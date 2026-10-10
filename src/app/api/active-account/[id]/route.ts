import prisma from "@/shared/lib/db";
import { NextResponse } from "next/server";
import { requireUser } from "@/shared/lib/session";
import { decryptSecret, encryptSecret } from "@/shared/lib/crypto";
import { createActiveAccountSchema } from "@/features/streaming-services/schemas";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { userId, response } = await requireUser(req);
    if (response) return response;

    const body = await req.json();

    // Allow partial updates
    const parsed = createActiveAccountSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid data" }, { status: 400 });
    }

    const owned = await prisma.activeAccount.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!owned) {
      return NextResponse.json(
        { message: "Active account not found" },
        { status: 404 },
      );
    }

    if (parsed.data.serviceId) {
      const serviceExists = await prisma.service.findFirst({
        where: { id: parsed.data.serviceId, createdById: userId },
        select: { id: true },
      });

      if (!serviceExists) {
        return NextResponse.json(
          { message: "service not found" },
          { status: 404 },
        );
      }
    }

    const dataToUpdate = {
      ...parsed.data,
      ...(parsed.data.expirationDate && {
        expirationDate: new Date(parsed.data.expirationDate),
      }),
      ...(parsed.data.password && {
        password: encryptSecret(parsed.data.password),
      }),
    };

    const updatedAccount = await prisma.activeAccount.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({
      ...updatedAccount,
      password: decryptSecret(updatedAccount.password),
    });
  } catch (error) {
    console.error("Error updating active account:", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { userId, response } = await requireUser(req);
    if (response) return response;

    const { count } = await prisma.activeAccount.deleteMany({
      where: { id, userId },
    });

    if (count === 0) {
      return NextResponse.json(
        { message: "Active account not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Active account deleted" });
  } catch (error) {
    console.error("Error deleting active account:", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
