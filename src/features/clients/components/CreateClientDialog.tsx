"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { refreshAfterChange } from "@/shared/lib/refresh";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/lib/errors";
import { createClient } from "@/features/clients/services/clients";
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

export default function CreateClientDialog() {
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof createClientSchema>>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      clientName: "",
      phoneNumber: "",
    },
  });

  const mutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      toast.success("Cliente creado");
      refreshAfterChange(queryClient, "client");
      reset();
      setErrorMessage(null);
      setOpen(false);
    },
    onError: (error: unknown) => {
      setErrorMessage(getErrorMessage(error, "No se pudo crear el cliente"));
    },
  });

  const onSubmit = async (values: z.infer<typeof createClientSchema>) => {
    await mutation.mutateAsync(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Nuevo Cliente</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear cliente</DialogTitle>
          <DialogDescription>
            Complete el formulario para registrar un nuevo cliente.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Label>Nombre del cliente</Label>
            <Input {...register("clientName")} placeholder="Ej: Juan Perez" />
            {errors.clientName && (
              <p className="text-destructive text-sm">
                {String(errors.clientName.message)}
              </p>
            )}
          </div>

          <div>
            <Label>Numero de telefono</Label>
            <Input
              {...register("phoneNumber")}
              placeholder="Ej: 58424XXXXXXX"
            />
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
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {isSubmitting || mutation.isPending ? (
                <>
                  <Spinner />
                  Creando
                </>
              ) : (
                "Crear"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
