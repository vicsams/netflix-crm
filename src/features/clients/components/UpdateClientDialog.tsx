"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/lib/errors";
import { updateClient } from "@/features/clients/services/clients";
import { createClientSchema } from "@/features/clients/schemas";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Spinner } from "@/shared/components/ui/spinner";
import { UpdateClientDialogProps } from "@/features/clients/types/client";

export default function UpdateClientDialog({
  client,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: UpdateClientDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? setControlledOpen : setUncontrolledOpen;
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof createClientSchema>>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      clientName: client.clientName,
      phoneNumber: client.phoneNumber,
    },
  });

  useEffect(() => {
    reset({
      clientName: client.clientName,
      phoneNumber: client.phoneNumber,
    });
  }, [client, reset]);

  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof createClientSchema>) =>
      updateClient(client.id, data),
    onSuccess: () => {
      toast.success("Cliente actualizado");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clientStatuses"] });
      setErrorMessage(null);
      setOpen?.(false);
    },
    onError: (error: unknown) => {
      setErrorMessage(
        getErrorMessage(error, "No se pudo actualizar el cliente"),
      );
    },
  });

  const onSubmit = async (values: z.infer<typeof createClientSchema>) => {
    await mutation.mutateAsync(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Editar
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Actualizar cliente</DialogTitle>
          <DialogDescription>
            Modifique los datos del cliente.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Label>Nombre del cliente</Label>
            <Input {...register("clientName")} />
            {errors.clientName && (
              <p className="text-destructive text-sm">
                {String(errors.clientName.message)}
              </p>
            )}
          </div>

          <div>
            <Label>Numero de telefono</Label>
            <Input {...register("phoneNumber")} />
            {errors.phoneNumber && (
              <p className="text-destructive text-sm">
                {String(errors.phoneNumber.message)}
              </p>
            )}
          </div>

          {errorMessage && (
            <p className="text-destructive text-sm">{errorMessage}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen?.(false)}
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
