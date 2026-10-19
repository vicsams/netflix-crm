"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { refreshAfterChange } from "@/shared/lib/refresh";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/lib/errors";
import { deleteClientStatus } from "@/features/subscriptions/services/subscriptions";
import UpdateClientStatusDialog from "@/features/subscriptions/components/UpdateClientStatusDialog";
import ClientStatusRenewDialog from "@/features/subscriptions/components/ClientStatusRenewDialog";
import ClientStatusMessageDialog from "@/features/subscriptions/components/ClientStatusMessageDialog";
import { Button } from "@/shared/components/ui/button";
import {
  Pencil,
  Trash,
  CreditCard,
  MessageCircle,
  MoreHorizontal,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Spinner } from "@/shared/components/ui/spinner";
import { ClientStatusActionsProps } from "@/features/subscriptions/types/clientStatus";

export default function ClientStatusActions({
  clientStatus,
  variant = "menu",
}: ClientStatusActionsProps) {
  const clientName = clientStatus.client?.clientName ?? clientStatus.clientName;

  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenewDialog, setShowRenewDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await deleteClientStatus(clientStatus.id);
    },
    onSuccess: () => {
      toast.success("Suscripción eliminada");
      refreshAfterChange(queryClient, "subscription");
      setShowDeleteDialog(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "No se pudo eliminar la suscripción"));
    },
  });

  return (
    <>
      <UpdateClientStatusDialog
        clientStatus={clientStatus}
        open={showUpdateDialog}
        onOpenChange={setShowUpdateDialog}
      />

      <ClientStatusRenewDialog
        clientStatus={clientStatus}
        open={showRenewDialog}
        onOpenChange={setShowRenewDialog}
      />

      <ClientStatusMessageDialog
        clientStatus={clientStatus}
        open={showMessageDialog}
        onOpenChange={setShowMessageDialog}
      />

      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!deleteMutation.isPending) setShowDeleteDialog(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              el estado del cliente &quot;{clientName}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                // AlertDialogAction closes the dialog on click; keep it open
                // so the spinner and any error show, and close it on success
                event.preventDefault();
                deleteMutation.mutate();
              }}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
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

      {variant === "buttons" ? (
        <div className="grid grid-cols-4 gap-2">
          <Button
            onClick={() => setShowMessageDialog(true)}
            className="flex h-auto flex-col gap-1 bg-green-700 py-2 text-xs text-white hover:bg-green-800"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>
          <Button
            onClick={() => setShowRenewDialog(true)}
            className="flex h-auto flex-col gap-1 py-2 text-xs"
          >
            <CreditCard className="h-4 w-4" />
            Renovar
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowUpdateDialog(true)}
            className="flex h-auto flex-col gap-1 py-2 text-xs"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive hover:text-destructive border-destructive/40 flex h-auto flex-col gap-1 py-2 text-xs"
          >
            <Trash className="h-4 w-4" />
            Eliminar
          </Button>
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowUpdateDialog(true)}>
              <Pencil className="h-4 w-4" />
              <span>Editar</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowRenewDialog(true)}>
              <CreditCard className="h-4 w-4" />
              <span>Renovar</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowMessageDialog(true)}>
              <MessageCircle className="h-4 w-4 text-green-500" />
              <span>Enviar WhatsApp</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Trash className="text-destructive h-4 w-4" />
              <span>Eliminar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
}
