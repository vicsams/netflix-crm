import { NextResponse } from "next/server";
import {
  APICallError,
  convertToModelMessages,
  createIdGenerator,
  safeValidateUIMessages,
  stepCountIs,
  streamText,
} from "ai";
import { google } from "@ai-sdk/google";
import * as z from "zod";
import prisma from "@/shared/lib/db";
import { requireUser } from "@/shared/lib/session";
import { createAssistantTools } from "@/features/assistant/server/tools";
import { buildInstructions } from "@/features/assistant/server/instructions";
import {
  HISTORY_LIMIT,
  isOverHourlyLimit,
  loadMessages,
  openChat,
  saveAssistantMessage,
  saveUserMessage,
} from "@/features/assistant/server/chats";
import type { AssistantUIMessage } from "@/features/assistant/types/assistant";

// Prisma (pg) needs the Node runtime; tool calls plus the answer fit in 30 s
export const runtime = "nodejs";
export const maxDuration = 30;

// `gemini-flash-latest` follows Google's current stable Flash model; set
// ASSISTANT_MODEL to pin a specific one
const MODEL = process.env.ASSISTANT_MODEL ?? "gemini-flash-latest";

const MAX_MESSAGE_LENGTH = 1000;

// The client sends only the new message; history is loaded from the database
const requestSchema = z.object({
  id: z.string().min(1).max(100),
  message: z.object({
    id: z.string().min(1).max(100),
    role: z.literal("user"),
    parts: z.array(z.object({ type: z.string(), text: z.string().optional() })),
  }),
});

const generateMessageId = createIdGenerator({ prefix: "msg", size: 16 });

function errorMessage(error: unknown) {
  if (APICallError.isInstance(error)) {
    if (error.statusCode === 429) {
      return "El asistente está saturado. Intenta de nuevo en un minuto.";
    }
    if (error.statusCode === 400 || error.statusCode === 403) {
      console.error("Gemini rejected the request:", error.message);
      return "El asistente no está disponible en este momento.";
    }
  }
  console.error("Assistant error:", error);
  return "Ocurrió un error al responder. Intenta de nuevo.";
}

// Errors before streaming starts (e.g. the database) would otherwise reach
// the chat as a raw 500; answer them in Spanish instead
export async function POST(req: Request) {
  try {
    return await answer(req);
  } catch (error) {
    console.error("Assistant request failed:", error);
    // P2021: the chat tables are missing (migration not applied)
    const tablesMissing =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2021";
    return NextResponse.json(
      {
        message: tablesMissing
          ? "El asistente aún no está listo: falta crear sus tablas en la base de datos."
          : "Ocurrió un error al responder. Intenta de nuevo.",
      },
      { status: tablesMissing ? 503 : 500 },
    );
  }
}

async function answer(req: Request) {
  const { userId, response } = await requireUser(req);
  if (response) return response;

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json(
      { message: "El asistente no está configurado." },
      { status: 503 },
    );
  }

  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
  }

  // Keep only the typed text: nothing else from the client is trusted
  const text = parsed.data.message.parts
    .flatMap((part) => (part.type === "text" && part.text ? [part.text] : []))
    .join("\n")
    .trim();
  if (!text || text.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      {
        message: `Escribe un mensaje de hasta ${MAX_MESSAGE_LENGTH} caracteres.`,
      },
      { status: 400 },
    );
  }
  const userMessage: AssistantUIMessage = {
    id: parsed.data.message.id,
    role: "user",
    parts: [{ type: "text", text }],
  };

  if (await isOverHourlyLimit(userId)) {
    return NextResponse.json(
      {
        message:
          "Llegaste al límite de mensajes por hora del asistente. Intenta más tarde.",
      },
      { status: 429 },
    );
  }

  const chat = await openChat(userId, parsed.data.id, text);
  if (!chat) {
    return NextResponse.json(
      { message: "Conversación no encontrada" },
      { status: 404 },
    );
  }

  await saveUserMessage(chat.id, userMessage);
  const history = await loadMessages(chat.id, HISTORY_LIMIT);

  const tools = createAssistantTools(userId);

  // Saved messages are validated against today's tools; if an old one no
  // longer fits (e.g. a tool changed), answer with just the new message
  const validated = await safeValidateUIMessages<AssistantUIMessage>({
    messages: history,
    tools,
  });
  const messages = validated.success ? validated.data : [userMessage];

  const result = streamText({
    model: google(MODEL),
    instructions: buildInstructions(),
    // With `tools`, earlier tool results are re-summarized by toModelOutput,
    // so phone numbers and emails from saved rows never reach the model
    messages: await convertToModelMessages(messages, { tools }),
    tools,
    stopWhen: stepCountIs(5),
  });

  // Finish (and save) the answer even if the user closes the panel
  void result.consumeStream();

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    generateMessageId,
    onEnd: async ({ responseMessage }) => {
      await saveAssistantMessage(chat.id, responseMessage);
    },
    onError: errorMessage,
  });
}

export async function GET(req: Request) {
  const { userId, response } = await requireUser(req);
  if (response) return response;

  const chats = await prisma.chat.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: { id: true, title: true, updatedAt: true },
  });

  return NextResponse.json(
    chats.map((chat) => ({ ...chat, updatedAt: chat.updatedAt.toISOString() })),
  );
}
