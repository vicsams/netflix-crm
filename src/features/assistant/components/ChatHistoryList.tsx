"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Spinner } from "@/shared/components/ui/spinner";
import { getErrorMessage } from "@/shared/lib/errors";
import { formatShortDate } from "@/shared/lib/date";
import {
  deleteAssistantChat,
  fetchAssistantChats,
} from "@/features/assistant/services/assistant";
import type { AssistantChatSummary } from "@/features/assistant/types/assistant";

export default function ChatHistoryList({
  activeChatId,
  onOpen,
  onDeleted,
}: {
  activeChatId: string;
  onOpen: (id: string) => void;
  onDeleted: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState<AssistantChatSummary | null>(null);

  const {
    data: chats,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["assistantChats"],
    queryFn: fetchAssistantChats,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAssistantChat(id),
    onSuccess: (_data, id) => {
      toast.success("Conversación eliminada");
      queryClient.invalidateQueries({ queryKey: ["assistantChats"] });
      queryClient.removeQueries({ queryKey: ["assistantChat", id] });
      setToDelete(null);
      onDeleted(id);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "No se pudo eliminar la conversación"));
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-destructive p-4 text-sm">
        {getErrorMessage(error, "No se pudo cargar el historial")}
      </p>
    );
  }

  if (!chats?.length) {
    return (
      <p className="text-muted-foreground p-4 text-sm">
        Aún no tienes conversaciones guardadas.
      </p>
    );
  }

  return (
    <>
      <ul className="min-h-0 flex-1 divide-y overflow-y-auto">
        {chats.map((chat) => (
          <li key={chat.id} className="flex items-center gap-1 pr-2">
            <button
              type="button"
              onClick={() => onOpen(chat.id)}
              className={`hover:bg-muted min-w-0 flex-1 px-4 py-3 text-left ${
                chat.id === activeChatId ? "bg-muted" : ""
              }`}
            >
              <span className="block truncate text-sm font-medium">
                {chat.title}
              </span>
              <span className="text-muted-foreground text-xs">
                {formatShortDate(chat.updatedAt)}
              </span>
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Eliminar "${chat.title}"`}
              onClick={() => setToDelete(chat)}
              className="text-muted-foreground hover:text-destructive shrink-0"
            >
              <Trash className="size-4" />
            </Button>
          </li>
        ))}
      </ul>

      <AlertDialog
        open={!!toDelete}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar conversación?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará &quot;{toDelete?.title}&quot; y todos sus mensajes.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={(event) => {
                // Keep the dialog open until the delete finishes
                event.preventDefault();
                if (toDelete) deleteMutation.mutate(toDelete.id);
              }}
            >
              {deleteMutation.isPending ? (
                <>
                  <Spinner />
                  Eliminando
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
