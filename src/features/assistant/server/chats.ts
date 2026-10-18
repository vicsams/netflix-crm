import prisma from "@/shared/lib/db";
import type { Prisma } from "@/shared/lib/generated/prisma/client";
import { isUniqueViolation } from "@/shared/lib/db-errors";
import type { AssistantUIMessage } from "@/features/assistant/types/assistant";

// Saved assistant conversations. Every function is scoped to the user, so a
// chat id from another user behaves as if it didn't exist.

// Messages from the most recent ones sent to the model as context
export const HISTORY_LIMIT = 30;

// Messages a user can send per hour, to bound Gemini usage
export const HOURLY_MESSAGE_LIMIT = 30;

export function findChat(userId: string, chatId: string) {
  return prisma.chat.findFirst({ where: { id: chatId, userId } });
}

// Opens the user's chat, creating it on the first message. Returns null when
// the id belongs to someone else
export async function openChat(userId: string, chatId: string, title: string) {
  const existing = await findChat(userId, chatId);
  if (existing) return existing;

  try {
    return await prisma.chat.create({
      data: { id: chatId, userId, title: title.slice(0, 60) },
    });
  } catch (error) {
    if (isUniqueViolation(error)) return null;
    throw error;
  }
}

function toUIMessage(message: {
  id: string;
  role: string;
  parts: Prisma.JsonValue;
}) {
  return {
    id: message.id,
    role: message.role,
    parts: message.parts,
  } as unknown as AssistantUIMessage;
}

export async function loadMessages(chatId: string, limit?: number) {
  const messages = await prisma.chatMessage.findMany({
    where: { chatId },
    orderBy: { createdAt: limit ? "desc" : "asc" },
    ...(limit && { take: limit }),
    select: { id: true, role: true, parts: true },
  });
  return (limit ? messages.reverse() : messages).map(toUIMessage);
}

// Saves the user's message. When it is already saved, the user asked to
// regenerate the answer: drop the replies that came after it instead
export async function saveUserMessage(
  chatId: string,
  message: AssistantUIMessage,
) {
  const existing = await prisma.chatMessage.findFirst({
    where: { id: message.id, chatId },
    select: { createdAt: true },
  });

  if (existing) {
    await prisma.chatMessage.deleteMany({
      where: { chatId, createdAt: { gt: existing.createdAt } },
    });
    return;
  }

  await prisma.chatMessage.create({
    data: {
      id: message.id,
      chatId,
      role: message.role,
      parts: message.parts as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function saveAssistantMessage(
  chatId: string,
  message: AssistantUIMessage,
) {
  const parts = message.parts as unknown as Prisma.InputJsonValue;
  await prisma.$transaction(async (tx) => {
    // Update only within this chat; otherwise it's a new message
    const { count } = await tx.chatMessage.updateMany({
      where: { id: message.id, chatId },
      data: { parts },
    });
    if (count === 0) {
      await tx.chatMessage.create({
        data: { id: message.id, chatId, role: message.role, parts },
      });
    }
    await tx.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });
  });
}

export async function isOverHourlyLimit(userId: string) {
  const sent = await prisma.chatMessage.count({
    where: {
      role: "user",
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      chat: { userId },
    },
  });
  return sent >= HOURLY_MESSAGE_LIMIT;
}
