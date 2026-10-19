"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { refreshAfterChange } from "@/shared/lib/refresh";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/lib/errors";
import { fetchClientStatuses } from "@/features/subscriptions/services/subscriptions";
import type { ClientStatus } from "@/features/subscriptions/types/clientStatus";
import { deleteActiveAccount } from "@/features/streaming-services/services/active-accounts/activeAccount";
import { ActiveAccountActionsProps } from "@/features/streaming-services/types/activeAccount";
import UpdateActiveAccountDialog from "@/features/streaming-services/components/active-accounts/UpdateActiveAccountDialog";
import CreateScreenDialog from "@/features/streaming-services/components/active-accounts/CreateScreenDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Button } from "@/shared/components/ui/button";
import { MoreHorizontal, Pencil, Trash, Plus } from "lucide-react";
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
import { Spinner } from "@/shared/components/ui/spinner";
import DeleteConsequences from "@/features/streaming-services/components/DeleteConsequences";

export default function ActiveAccountActions({
  activeAccount,
}: ActiveAccountActionsProps) {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCreateScreenDialog, setShowCreateScreenDialog] = useState(false);
  const queryClient = useQueryClient();

  // The database deletes this account's screens and subscriptions with it,
  // so the confirmation spells out what else will go
  const subscriptionsQuery = useQuery<ClientStatus[]>({
    queryKey: ["clientStatuses"],
    queryFn: fetchClientStatuses,
    enabled: showDeleteDialog,
  });
  const linkedSubscriptions = (subscriptionsQuery.data ?? []).filter(
    (subscription) => subscription.activeAccountId === activeAccount.id,
  );
  const activeSubscriptions = linkedSubscriptions.filter(
    (subscription) =>
      !subscription.expirationDate ||
      new Date(subscription.expirationDate) >= new Date(),
  ).length;
  const screenCount = activeAccount.screens?.length ?? 0;
  const deletesMore = screenCount > 0 || linkedSubscriptions.length > 0;

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await deleteActiveAccount(activeAccount.id);
    },
    onSuccess: () => {
      toast.success("Cuenta eliminada");
      refreshAfterChange(queryClient, "account");
      setShowDeleteDialog(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "No se pudo eliminar la cuenta"));
    },
  });

  return (
    <>
      <UpdateActiveAccountDialog
        activeAccount={activeAccount}
        open={showUpdateDialog}
        onOpenChange={setShowUpdateDialog}
      />

      <CreateScreenDialog
        activeAccountId={activeAccount.id}
        open={showCreateScreenDialog}
        onOpenChange={setShowCreateScreenDialog}
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
              la cuenta activa &quot;{activeAccount.email}&quot;.
            </AlertDialogDescription>
            <DeleteConsequences
              loading={subscriptionsQuery.isLoading}
              failed={subscriptionsQuery.isError}
              screenCount={screenCount}
              subscriptionCount={linkedSubscriptions.length}
              activeSubscriptions={activeSubscriptions}
            />
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
              disabled={
                deleteMutation.isPending ||
                subscriptionsQuery.isLoading ||
                subscriptionsQuery.isError
              }
            >
              {deleteMutation.isPending ? (
                <>
                  <Spinner />
                  Eliminando
                </>
              ) : deletesMore ? (
                "Eliminar todo"
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            // Follows the card, which takes its service's text color
            className="h-8 w-8 p-0 text-current hover:bg-current/10 hover:text-current"
          >
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowUpdateDialog(true)}>
            <Pencil className="h-4 w-4" />
            <span>Editar</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowCreateScreenDialog(true)}>
            <Plus className="h-4 w-4" />
            <span>Agregar pantalla</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="focus:bg-destructive/10 text-destructive focus:text-destructive"
          >
            <Trash className="text-destructive h-4 w-4" />
            <span>Eliminar</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
