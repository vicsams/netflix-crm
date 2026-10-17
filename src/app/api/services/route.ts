import prisma from "@/shared/lib/db";
import { NextResponse } from "next/server";
import { requireUser } from "@/shared/lib/session";
import { createServiceSchema } from "@/features/streaming-services/schemas";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const parsed = createServiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    }

    const { userId, response } = await requireUser(req);
    if (response) return response;

    const {
      serviceName,
      price,
      imageUrl,
      description,
      currency,
      textColor,
      backgroundColor,
    } = parsed.data;
    const priceCents = Math.round(price * 100);

    const service = await prisma.service.create({
      data: {
        serviceName,
        price: priceCents,
        imageUrl: imageUrl ?? null,
        description: description ?? null,
        currency: currency ?? "USD",
        textColor: textColor.toLowerCase(),
        backgroundColor: backgroundColor.toLowerCase(),
        createdById: userId,
      },
    });

    return NextResponse.json(service);
  } catch {
    return NextResponse.json(
      { message: "Error interno del servidor. Intenta de nuevo." },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  try {
    const { userId, response } = await requireUser(req);
    if (response) return response;

    const services = await prisma.service.findMany({
      where: { createdById: userId },
      // orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    return NextResponse.json(services);
  } catch {
    return NextResponse.json(
      { message: "Error interno del servidor. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
