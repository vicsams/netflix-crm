import prisma from "@/shared/lib/db";
import { NextResponse } from "next/server";
import { requireUser } from "@/shared/lib/session";
import { updateClientStatusSchema } from "@/features/subscriptions/schemas";

function normalizePhoneNumber(phone: string) {
  return phone.trim();
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { userId, response } = await requireUser(req);
    if (response) return response;

    const body = await req.json();

    const parsed = updateClientStatusSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    }

    const subscriptionData: Record<string, unknown> = {
      clientId: parsed.data.clientId,
      activeAccountId: parsed.data.activeAccountId,
      serviceId: parsed.data.serviceId,
      screenId: parsed.data.screenId,
      status: parsed.data.status,
      amount: parsed.data.amount,
      expirationDate: parsed.data.expirationDate,
    };

    Object.keys(subscriptionData).forEach((key) => {
      if (subscriptionData[key] === undefined) {
        delete subscriptionData[key];
      }
    });

    const clientDataToUpdate: Record<string, string> = {};
    if (typeof parsed.data.clientName === "string") {
      clientDataToUpdate.clientName = parsed.data.clientName;
    }
    if (typeof parsed.data.phoneNumber === "string") {
      clientDataToUpdate.phoneNumber = normalizePhoneNumber(
        parsed.data.phoneNumber,
      );
    }

    if (typeof subscriptionData.expirationDate === "string") {
      subscriptionData.expirationDate = new Date(
        subscriptionData.expirationDate,
      );
    }

    const amount =
      typeof subscriptionData.amount === "number" ? subscriptionData.amount : 0;
    const isRenewal = subscriptionData.status === "ACTIVE" && amount > 0;

    if (isRenewal) {
      subscriptionData.purchaseDate = new Date();
    }

    const currentSubscription = await prisma.subscription.findFirst({
      where: { id, userId },
      select: {
        id: true,
        clientId: true,
        activeAccountId: true,
        serviceId: true,
        screenId: true,
        client: {
          select: {
            id: true,
            clientName: true,
            phoneNumber: true,
          },
        },
      },
    });

    if (!currentSubscription) {
      return NextResponse.json(
        { message: "Suscripción no encontrada" },
        { status: 404 },
      );
    }

    const nextActiveAccountId =
      typeof parsed.data.activeAccountId === "string"
        ? parsed.data.activeAccountId
        : currentSubscription.activeAccountId;
    const nextServiceId =
      typeof parsed.data.serviceId === "string"
        ? parsed.data.serviceId
        : currentSubscription.serviceId;
    const nextScreenId =
      typeof parsed.data.screenId === "string"
        ? parsed.data.screenId
        : currentSubscription.screenId;

    const [nextActiveAccount, nextService, nextScreen] = await Promise.all([
      prisma.activeAccount.findFirst({
        where: { id: nextActiveAccountId, userId },
        select: { id: true, serviceId: true },
      }),
      prisma.service.findFirst({
        where: { id: nextServiceId, createdById: userId },
        select: { id: true },
      }),
      prisma.screen.findUnique({
        where: { id: nextScreenId },
        select: { id: true, activeAccountId: true },
      }),
    ]);

    if (!nextActiveAccount) {
      return NextResponse.json(
        { message: "Cuenta no encontrada" },
        { status: 404 },
      );
    }

    if (!nextService) {
      return NextResponse.json(
        { message: "Servicio no encontrado" },
        { status: 404 },
      );
    }

    if (!nextScreen) {
      return NextResponse.json(
        { message: "Pantalla no encontrada" },
        { status: 404 },
      );
    }

    if (nextScreen.activeAccountId !== nextActiveAccount.id) {
      return NextResponse.json(
        {
          message:
            "El perfil seleccionado no pertenece a la cuenta seleccionada",
        },
        { status: 400 },
      );
    }

    if (
      nextActiveAccount.serviceId &&
      nextActiveAccount.serviceId !== nextService.id
    ) {
      return NextResponse.json(
        {
          message:
            "La cuenta seleccionada no pertenece al servicio seleccionado",
        },
        { status: 400 },
      );
    }

    const normalizedPhone = clientDataToUpdate.phoneNumber;
    const targetClientName = clientDataToUpdate.clientName;

    if (typeof parsed.data.clientId === "string") {
      const clientExists = await prisma.client.findFirst({
        where: { id: parsed.data.clientId, userId },
        select: { id: true },
      });

      if (!clientExists) {
        return NextResponse.json(
          { message: "Cliente no encontrado" },
          { status: 404 },
        );
      }

      subscriptionData.clientId = parsed.data.clientId;
    } else if (normalizedPhone) {
      const existingClient = await prisma.client.findUnique({
        where: {
          userId_phoneNumber: { userId, phoneNumber: normalizedPhone },
        },
        select: { id: true },
      });

      if (
        existingClient &&
        existingClient.id !== currentSubscription.clientId
      ) {
        subscriptionData.client = {
          connect: {
            id: existingClient.id,
          },
        };

        if (targetClientName) {
          await prisma.client.update({
            where: { id: existingClient.id },
            data: { clientName: targetClientName },
          });
        }
      } else {
        subscriptionData.client = {
          update: {
            ...(targetClientName ? { clientName: targetClientName } : {}),
            phoneNumber: normalizedPhone,
          },
        };
      }
    } else if (targetClientName) {
      subscriptionData.client = {
        update: {
          clientName: targetClientName,
        },
      };
    }

    const [updatedClientStatus] = await prisma.$transaction([
      prisma.subscription.update({
        where: { id },
        data: subscriptionData,
        include: {
          client: {
            select: {
              id: true,
              clientName: true,
              phoneNumber: true,
            },
          },
        },
      }),
      prisma.bankEarnings.upsert({
        where: { userId },
        update: {
          total: {
            increment: isRenewal ? amount : 0,
          },
        },
        create: {
          userId,
          total: isRenewal ? amount : 0,
        },
      }),
    ]);

    return NextResponse.json({
      ...updatedClientStatus,
      clientName: updatedClientStatus.client.clientName,
      phoneNumber: updatedClientStatus.client.phoneNumber,
    });
  } catch (error) {
    console.error("Error updating client status:", error);

    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json(
        {
          message: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      );
    }

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

    const { count } = await prisma.subscription.deleteMany({
      where: { id, userId },
    });

    if (count === 0) {
      return NextResponse.json(
        { message: "Suscripción no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Suscripción eliminada" });
  } catch (error) {
    console.error("Error deleting client status:", error);
    return NextResponse.json(
      { message: "Error interno del servidor. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
