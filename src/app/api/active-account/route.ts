import prisma from "@/shared/lib/db";
import { NextResponse } from "next/server";
import { requireUser } from "@/shared/lib/session";
import { decryptSecret, encryptSecret } from "@/shared/lib/crypto";
import { isUniqueViolation } from "@/shared/lib/db-errors";

export async function POST(req: Request) {
  try {
    const { userId, response } = await requireUser(req);
    if (response) return response;

    const body = await req.json();
    const { email, password, expirationDate, serviceId } = body ?? {};

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { message: "El correo es obligatorio" },
        { status: 400 },
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { message: "La contraseña es obligatoria" },
        { status: 400 },
      );
    }

    if (!expirationDate || typeof expirationDate !== "string") {
      return NextResponse.json(
        { message: "La fecha de expiración es obligatoria" },
        { status: 400 },
      );
    }

    if (!serviceId || typeof serviceId !== "string") {
      return NextResponse.json(
        { message: "Selecciona un servicio" },
        { status: 400 },
      );
    }

    const exp = new Date(expirationDate);
    if (isNaN(exp.getTime())) {
      return NextResponse.json(
        { message: "Fecha de expiración inválida" },
        { status: 400 },
      );
    }

    const serviceExists = await prisma.service.findFirst({
      where: { id: serviceId, createdById: userId },
      select: { id: true },
    });

    if (!serviceExists) {
      return NextResponse.json(
        { message: "Servicio no encontrado" },
        { status: 404 },
      );
    }

    const created = await prisma.activeAccount.create({
      data: {
        email,
        password: encryptSecret(password),
        serviceId,
        expirationDate: exp,
        userId,
      },
    });

    return NextResponse.json(
      {
        id: created.id,
        email: created.email,
        serviceId: created.serviceId,
        expirationDate: created.expirationDate,
      },
      { status: 201 },
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { message: "Ya existe una cuenta con ese correo" },
        { status: 409 },
      );
    }
    console.error("Error creating active account:", error);
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

    const accounts = await prisma.activeAccount.findMany({
      where: { userId },
      select: {
        id: true,
        email: true,
        password: true,
        serviceId: true,
        service: {
          select: {
            id: true,
            serviceName: true,
            textColor: true,
            backgroundColor: true,
          },
        },
        expirationDate: true,
        screens: {
          select: { id: true, profileName: true, profilePIN: true },
        },
      },
    });
    return NextResponse.json(
      accounts.map((account) => ({
        ...account,
        password: decryptSecret(account.password),
      })),
      { status: 200 },
    );
  } catch (error) {
    console.error("GET Active Accounts error:", error);
    return NextResponse.json(
      { message: "Error interno del servidor. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
