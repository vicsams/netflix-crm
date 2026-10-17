import prisma from "@/shared/lib/db";
import { NextResponse } from "next/server";
import { requireUser } from "@/shared/lib/session";
import { createClientSchema } from "@/features/clients/schemas";

function normalizePhoneNumber(phoneNumber: string) {
  return phoneNumber.trim();
}

function toClientResponse(client: {
  id: string;
  clientName: string;
  phoneNumber: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { subscriptions: number };
}) {
  return {
    id: client.id,
    clientName: client.clientName,
    phoneNumber: client.phoneNumber,
    subscriptionCount: client._count.subscriptions,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
  };
}

export async function GET(req: Request) {
  try {
    const { userId, response } = await requireUser(req);
    if (response) return response;

    const clients = await prisma.client.findMany({
      where: { userId },
      orderBy: [{ clientName: "asc" }, { createdAt: "desc" }],
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

    return NextResponse.json(clients.map(toClientResponse));
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { message: "Error interno del servidor. Intenta de nuevo." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const parsed = createClientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    }

    const { userId, response } = await requireUser(req);
    if (response) return response;

    const client = await prisma.client.create({
      data: {
        clientName: parsed.data.clientName,
        phoneNumber: normalizePhoneNumber(parsed.data.phoneNumber),
        userId,
      },
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

    return NextResponse.json(toClientResponse(client), { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "Ya existe un cliente con ese número de teléfono" },
        { status: 409 },
      );
    }

    console.error("Error creating client:", error);
    return NextResponse.json(
      { message: "Error interno del servidor. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
