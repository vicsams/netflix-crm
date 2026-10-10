import { NextRequest, NextResponse } from "next/server";
import prisma from "@/shared/lib/db";
import { requireUser } from "@/shared/lib/session";
import { createScreenSchema } from "@/features/streaming-services/schemas";

export async function POST(req: NextRequest) {
  try {
    const { userId, response } = await requireUser(req);
    if (response) return response;

    const body = await req.json();
    const data = createScreenSchema.parse(body);

    const activeAccount = await prisma.activeAccount.findFirst({
      where: { id: data.activeAccountId, userId },
      include: { screens: true },
    });

    if (!activeAccount) {
      return NextResponse.json(
        { message: "Active account not found" },
        { status: 404 },
      );
    }

    if (activeAccount.screens.length >= 5) {
      return NextResponse.json(
        { message: "Maximum limit of 5 screens reached for this account" },
        { status: 400 },
      );
    }

    const screen = await prisma.screen.create({
      data: {
        profileName: data.profileName,
        profilePIN: data.profilePIN,
        activeAccountId: data.activeAccountId,
      },
    });

    return NextResponse.json(screen, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { message: "Error creating screen" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId, response } = await requireUser(req);
    if (response) return response;

    const { searchParams } = new URL(req.url);
    const activeAccountId = searchParams.get("activeAccountId");

    const where = {
      activeAccount: { userId },
      ...(activeAccountId ? { activeAccountId } : {}),
    };

    const screens = await prisma.screen.findMany({
      where,
      include: {
        activeAccount: {
          select: { email: true },
        },
      },
      orderBy: { profileName: "asc" },
    });

    return NextResponse.json(screens);
  } catch {
    return NextResponse.json(
      { message: "Error fetching screens" },
      { status: 500 },
    );
  }
}
