"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Ban } from "lucide-react";
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
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Spinner } from "@/shared/components/ui/spinner";
import { getErrorMessage } from "@/shared/lib/errors";
import { refreshAfterChange } from "@/shared/lib/refresh";
import { voidSale } from "@/features/sales/services/sales";
import { bs } from "@/features/sales/lib/sales";
import type { SaleRow } from "@/features/sales/types/sale";

export default function SaleVoidAction({ sale }: { sale: SaleRow }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: () => voidSale(sale.id),
    onSuccess: () => {
      toast.success("Venta anulada");
      refreshAfterChange(queryClient, "sale");
      setOpen(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "No se pudo anular la venta"));
    },
  });

  if (sale.voidedAt) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Anulada
      </Badge>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-destructive h-7 px-2 text-xs"
        onClick={() => setOpen(true)}
      >
        <Ban className="size-3.5" />
        Anular
      </Button>

      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          if (!mutation.isPending) setOpen(next);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Anular esta venta?</AlertDialogTitle>
            <AlertDialogDescription>
              La venta de {sale.clientName} ({sale.serviceName}) por{" "}
              {bs(sale.grossBs)} quedará marcada como anulada y no contará en
              los totales. Se descontará su ganancia ({bs(sale.netBs)}) del
              banco. Las fechas de la suscripción no cambian; si hace falta,
              corrígelas desde Editar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              disabled={mutation.isPending}
              onClick={(event) => {
                // Keep the dialog open until the request finishes
                event.preventDefault();
                mutation.mutate();
              }}
            >
              {mutation.isPending ? (
                <>
                  <Spinner />
                  Anulando
                </>
              ) : (
                "Anular venta"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
