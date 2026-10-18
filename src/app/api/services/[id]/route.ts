import prisma from "@/shared/lib/db";
import { NextResponse } from "next/server";
import { requireUser } from "@/shared/lib/session";
import { createServiceSchema } from "@/features/streaming-services/schemas";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Allow partial updates by using partial()
    const parsed = createServiceSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    }

    const { userId, response } = await requireUser(req);
    if (response) return response;

    const owned = await prisma.service.findFirst({
      where: { id, createdById: userId },
      select: { id: true },
    });

    if (!owned) {
      return NextResponse.json(
        { message: "Servicio no encontrado" },
        { status: 404 },
      );
    }

    const dataToUpdate = { ...parsed.data };

    // If price is provided, convert to cents
    if (dataToUpdate.price !== undefined) {
      dataToUpdate.price = Math.round(dataToUpdate.price * 100);
    }

    if (dataToUpdate.textColor !== undefined) {
      dataToUpdate.textColor = dataToUpdate.textColor.toLowerCase();
    }

    if (dataToUpdate.backgroundColor !== undefined) {
      dataToUpdate.backgroundColor = dataToUpdate.backgroundColor.toLowerCase();
    }

    const service = await prisma.service.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json(
      { message: "Error interno del servidor. Intenta de nuevo." },
      { status: 500 },
    );
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

    const { count } = await prisma.service.deleteMany({
      where: { id, createdById: userId },
    });

    if (count === 0) {
      return NextResponse.json(
        { message: "Servicio no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Servicio eliminado" });
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json(
      { message: "Error interno del servidor. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
