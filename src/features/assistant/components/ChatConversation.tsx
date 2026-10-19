"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUp, Square } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Spinner } from "@/shared/components/ui/spinner";
import { Textarea } from "@/shared/components/ui/textarea";
import MessageParts from "@/features/assistant/components/MessageParts";
import type { AssistantUIMessage } from "@/features/assistant/types/assistant";

const STARTER_PROMPTS = [
  "Clientes con suscripción de Netflix",
  "¿Qué suscripciones vencen esta semana?",
  "Cuentas con pantallas libres",
  "¿Cuánto vendí este mes?",
  "Últimos retiros en USDT",
];

const MAX_MESSAGE_LENGTH = 1000;

// The API answers errors as JSON ({ message }) before streaming starts, and
// as a plain message once streaming; show either in Spanish
function readError(error: Error) {
  try {
    const parsed = JSON.parse(error.message) as { message?: unknown };
    if (typeof parsed.message === "string") return parsed.message;
  } catch {
    // Not JSON: already a readable message
  }
  return error.message || "Ocurrió un error al responder. Intenta de nuevo.";
}

export default function ChatConversation({
  chatId,
  initialMessages,
  onFirstMessage,
}: {
  chatId: string;
  initialMessages: AssistantUIMessage[];
  // Called when a new chat sends its first message (it is saved from then on)
  onFirstMessage?: () => void;
}) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Only the new message travels; the server loads the rest of the history
  const [transport] = useState(
    () =>
      new DefaultChatTransport<AssistantUIMessage>({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ id, messages }) => ({
          body: { id, message: messages.at(-1) },
        }),
      }),
  );

  const { messages, sendMessage, status, stop, error, regenerate } =
    useChat<AssistantUIMessage>({
      id: chatId,
      messages: initialMessages,
      transport,
      // The chat now exists (or moved to the top) in the history
      onFinish: () =>
        queryClient.invalidateQueries({ queryKey: ["assistantChats"] }),
    });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, status]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    if (messages.length === 0) onFirstMessage?.();
    sendMessage({ text: trimmed });
    setInput("");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex flex-1 flex-col justify-end gap-3">
            <p className="text-muted-foreground text-sm">
              Pregúntame sobre tus clientes, suscripciones, cuentas o ganancias.
              Solo puedo consultar datos, no modificarlos.
            </p>
            <div className="flex flex-wrap gap-2">
              {STARTER_PROMPTS.map((prompt) => (
                <Button
                  key={prompt}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-auto rounded-full px-3 py-1.5 text-xs whitespace-normal"
                  onClick={() => send(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageParts key={message.id} message={message} />
        ))}

        {status === "submitted" && (
          <p className="text-muted-foreground flex items-center gap-2 text-xs">
            <Spinner />
            Pensando…
          </p>
        )}

        {error && (
          <div className="border-destructive/30 bg-destructive/5 text-destructive flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
            <span>{readError(error)}</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => regenerate()}
            >
              Reintentar
            </Button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form
        className="flex items-end gap-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends, Shift+Enter adds a line
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Pregunta sobre tus datos…"
          aria-label="Mensaje para el asistente"
          maxLength={MAX_MESSAGE_LENGTH}
          rows={1}
          className="max-h-32 min-h-10 resize-none"
        />
        {busy ? (
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => stop()}
            aria-label="Detener respuesta"
          >
            <Square className="size-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim()}
            aria-label="Enviar mensaje"
          >
            <ArrowUp className="size-4" />
          </Button>
        )}
      </form>
    </div>
  );
}
