import { NextRequest, NextResponse } from "next/server";
import prisma from "@/shared/lib/db";
import { requireUser } from "@/shared/lib/session";
import { updateScreenSchema } from "@/features/streaming-services/schemas";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { userId, response } = await requireUser(req);
    if (response) return response;

    const owned = await prisma.screen.findFirst({
      where: { id, activeAccount: { userId } },
      select: { id: true },
    });

    if (!owned) {
      return NextResponse.json(
        { message: "Pantalla no encontrada" },
        { status: 404 },
      );
    }

    const parsed = updateScreenSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 },
      );
    }

    const result = await prisma.screen.update({
      where: { id },
      data: {
        profileName: parsed.data.profileName,
        profilePIN: parsed.data.profilePIN,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating screen:", error);
    return NextResponse.json(
      { message: "No se pudo actualizar la pantalla" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { userId, response } = await requireUser(req);
    if (response) return response;

    const owned = await prisma.screen.findFirst({
      where: { id, activeAccount: { userId } },
      select: { id: true },
    });

    if (!owned) {
      return NextResponse.json(
        { message: "Pantalla no encontrada" },
        { status: 404 },
      );
    }

    await prisma.screen.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Pantalla eliminada" });
  } catch (error) {
    console.error("Error deleting screen:", error);
    return NextResponse.json(
      { message: "No se pudo eliminar la pantalla" },
      { status: 500 },
    );
  }
}
