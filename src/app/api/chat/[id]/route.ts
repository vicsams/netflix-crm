import { NextResponse } from "next/server";
import prisma from "@/shared/lib/db";
import { requireUser } from "@/shared/lib/session";
import { findChat, loadMessages } from "@/features/assistant/server/chats";

// A saved conversation, to reopen it in the assistant
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { userId, response } = await requireUser(req);
  if (response) return response;

  const chat = await findChat(userId, id);
  if (!chat) {
    return NextResponse.json(
      { message: "Conversación no encontrada" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    id: chat.id,
    title: chat.title,
    messages: await loadMessages(chat.id),
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { userId, response } = await requireUser(req);
  if (response) return response;

  // Messages are deleted with the chat (cascade)
  const { count } = await prisma.chat.deleteMany({ where: { id, userId } });
  if (count === 0) {
    return NextResponse.json(
      { message: "Conversación no encontrada" },
      { status: 404 },
    );
  }

  return NextResponse.json({ message: "Conversación eliminada" });
}
