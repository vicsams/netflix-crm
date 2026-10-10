import { NextRequest, NextResponse } from "next/server";
import prisma from "@/shared/lib/db";
import { requireUser } from "@/shared/lib/session";

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
      return NextResponse.json({ message: "Screen not found" }, { status: 404 });
    }

    const json = await req.json();

    const result = await prisma.screen.update({
      where: { id },
      data: {
        profileName: json.profileName,
        profilePIN: json.profilePIN,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { message: "Error updating screen" },
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
      return NextResponse.json({ message: "Screen not found" }, { status: 404 });
    }

    await prisma.screen.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Screen deleted" });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { message: "Error deleting screen" },
      { status: 500 },
    );
  }
}
