"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/lib/errors";
import { fetchClientStatuses } from "@/features/subscriptions/services/subscriptions";
import type { ClientStatus } from "@/features/subscriptions/types/clientStatus";
import { fetchActiveAccount } from "@/features/streaming-services/services/active-accounts/activeAccount";
import type { ActiveAccountProps } from "@/features/streaming-services/types/activeAccount";
import { deleteService } from "@/features/streaming-services/services/service-management/services";
import UpdateServiceDialog from "@/features/streaming-services/components/service-management/UpdateServiceDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Button } from "@/shared/components/ui/button";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
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
import { ServiceActionsProps } from "@/features/streaming-services/types/service";

export default function ServiceActions({ service }: ServiceActionsProps) {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const queryClient = useQueryClient();

  // The database deletes this service's subscriptions with it, and leaves
  // its accounts without a service, so the confirmation spells that out
  const subscriptionsQuery = useQuery<ClientStatus[]>({
    queryKey: ["clientStatuses"],
    queryFn: fetchClientStatuses,
    enabled: showDeleteDialog,
  });
  const accountsQuery = useQuery<ActiveAccountProps[]>({
    queryKey: ["activeAccounts"],
    queryFn: fetchActiveAccount,
    enabled: showDeleteDialog,
  });
  const linkedSubscriptions = (subscriptionsQuery.data ?? []).filter(
    (subscription) => subscription.serviceId === service.id,
  );
  const activeSubscriptions = linkedSubscriptions.filter(
    (subscription) =>
      !subscription.expirationDate ||
      new Date(subscription.expirationDate) >= new Date(),
  ).length;
  const linkedAccounts = (accountsQuery.data ?? []).filter(
    (account) => account.serviceId === service.id,
  ).length;
  const checking = subscriptionsQuery.isLoading || accountsQuery.isLoading;
  const checkFailed = subscriptionsQuery.isError || accountsQuery.isError;

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await deleteService(service.id);
    },
    onSuccess: () => {
      toast.success("Servicio eliminado");
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["activeAccounts"] });
      queryClient.invalidateQueries({ queryKey: ["clientStatuses"] });
      setShowDeleteDialog(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "No se pudo eliminar el servicio"));
    },
  });

  return (
    <>
      <UpdateServiceDialog
        service={service}
        open={showUpdateDialog}
        onOpenChange={setShowUpdateDialog}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              el servicio &quot;{service.serviceName}&quot;.
            </AlertDialogDescription>
            <DeleteConsequences
              loading={checking}
              failed={checkFailed}
              subscriptionCount={linkedSubscriptions.length}
              activeSubscriptions={activeSubscriptions}
              unassignedAccountCount={linkedAccounts}
            />
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteMutation.isPending || checking || checkFailed}
            >
              {deleteMutation.isPending ? (
                <>
                  <Spinner />
                  Eliminando
                </>
              ) : linkedSubscriptions.length > 0 ? (
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
          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-transparent">
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal
              className="h-4 w-4"
              style={{ color: service.textColor }}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowUpdateDialog(true)}>
            <Pencil className="h-4 w-4" />
            <span>Editar</span>
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
    </>
  );
}
