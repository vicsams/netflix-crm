"use client";

import { useQuery } from "@tanstack/react-query";
import { History, SquarePen, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { getErrorMessage } from "@/shared/lib/errors";
import { fetchAssistantChat } from "@/features/assistant/services/assistant";
import ChatConversation from "@/features/assistant/components/ChatConversation";
import ChatHistoryList from "@/features/assistant/components/ChatHistoryList";

export type ActiveChat = {
  id: string;
  // Not saved yet: nothing to load, it starts empty
  isNew: boolean;
};

export default function AssistantPanel({
  activeChat,
  showHistory,
  onToggleHistory,
  onNewChat,
  onOpenChat,
  onChatSaved,
  onChatDeleted,
  onClose,
}: {
  activeChat: ActiveChat;
  showHistory: boolean;
  onToggleHistory: () => void;
  onNewChat: () => void;
  onOpenChat: (id: string) => void;
  onChatSaved: () => void;
  onChatDeleted: (id: string) => void;
  onClose: () => void;
}) {
  const savedChat = useQuery({
    queryKey: ["assistantChat", activeChat.id],
    queryFn: () => fetchAssistantChat(activeChat.id),
    enabled: !activeChat.isNew,
    // Always reload: the last answer may have been saved after we left
    staleTime: 0,
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2">
        <div>
          <p className="font-semibold">Asistente</p>
          <p className="text-muted-foreground text-xs">
            Consulta tus datos en lenguaje natural
          </p>
        </div>
        <div className="flex gap-1">
          <Button
            type="button"
            variant={showHistory ? "secondary" : "ghost"}
            size="icon"
            aria-label="Historial de conversaciones"
            aria-pressed={showHistory}
            title="Historial"
            onClick={onToggleHistory}
          >
            <History className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Nueva conversación"
            title="Nueva conversación"
            onClick={onNewChat}
          >
            <SquarePen className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Cerrar asistente"
            title="Cerrar"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {showHistory && (
        <ChatHistoryList
          activeChatId={activeChat.id}
          onOpen={onOpenChat}
          onDeleted={onChatDeleted}
        />
      )}

      {/* Stays mounted while the history is shown, so a running chat isn't
          lost when switching views */}
      <div className={showHistory ? "hidden" : "flex min-h-0 flex-1 flex-col"}>
        {activeChat.isNew ? (
          <ChatConversation
            key={activeChat.id}
            chatId={activeChat.id}
            initialMessages={[]}
            onFirstMessage={onChatSaved}
          />
        ) : savedChat.isLoading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="ml-auto h-9 w-2/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : savedChat.isError || !savedChat.data ? (
          <p className="text-destructive p-4 text-sm">
            {getErrorMessage(
              savedChat.error,
              "No se pudo cargar la conversación",
            )}
          </p>
        ) : (
          <ChatConversation
            key={activeChat.id}
            chatId={activeChat.id}
            initialMessages={savedChat.data.messages}
          />
        )}
      </div>
    </div>
  );
}
