"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/lib/errors";
import { updateScreen } from "@/features/streaming-services/services/active-accounts/screens";
import {
  updateScreenSchema,
  UpdateScreenValues,
  UpdateScreenFormValues,
} from "@/features/streaming-services/schemas";
import type { UpdateScreenDialogProps } from "@/features/streaming-services/types/screen";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Spinner } from "@/shared/components/ui/spinner";

export default function UpdateScreenDialog({
  screen,
  open,
  onOpenChange,
}: UpdateScreenDialogProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateScreenFormValues, unknown, UpdateScreenValues>({
    resolver: zodResolver(updateScreenSchema),
    defaultValues: {
      profileName: screen.profileName,
      profilePIN: screen.profilePIN,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: UpdateScreenValues) => {
      return await updateScreen(screen.id, data);
    },
    onSuccess: () => {
      toast.success("Pantalla actualizada");
      queryClient.invalidateQueries({ queryKey: ["activeAccounts"] });
      queryClient.invalidateQueries({ queryKey: ["clientStatuses"] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "No se pudo actualizar la pantalla"));
    },
  });

  const onSubmit = async (values: UpdateScreenValues) => {
    await mutation.mutateAsync(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Actualizar Pantalla</DialogTitle>
          <DialogDescription>
            Modifique el nombre o PIN del perfil.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Label>Nombre del perfil</Label>
            <Input {...register("profileName")} />
            {errors.profileName && (
              <p className="text-destructive text-sm font-medium">
                {String(errors.profileName.message)}
              </p>
            )}
          </div>

          <div>
            <Label>PIN</Label>
            <Input type="number" {...register("profilePIN")} />
            {errors.profilePIN && (
              <p className="text-destructive text-sm font-medium">
                {String(errors.profilePIN.message)}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Spinner />
                  Guardar cambios
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
