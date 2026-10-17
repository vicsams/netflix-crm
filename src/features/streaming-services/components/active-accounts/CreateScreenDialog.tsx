"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useOnOpen from "@/shared/hooks/useOnOpen";
import { refreshAfterChange } from "@/shared/lib/refresh";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/lib/errors";
import { z } from "zod";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Spinner } from "@/shared/components/ui/spinner";
import {
  createScreenSchema,
  type CreateScreenValues,
} from "@/features/streaming-services/schemas";
import { createScreen } from "@/features/streaming-services/services/active-accounts/screens";

type CreateScreenDialogProps = {
  activeAccountId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function CreateScreenDialog({
  activeAccountId,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: CreateScreenDialogProps) {
  const queryClient = useQueryClient();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? setControlledOpen! : setUncontrolledOpen;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof createScreenSchema>, unknown, CreateScreenValues>({
    resolver: zodResolver(createScreenSchema),
    defaultValues: {
      profileName: "",
      profilePIN: "",
      activeAccountId,
    },
  });

  // Start from a blank form each time it opens, so a cancelled attempt
  // doesn't come back
  useOnOpen(open, () => {
    reset();
    setServerError(null);
  });

  const mutation = useMutation({
    mutationFn: createScreen,
    onSuccess: () => {
      toast.success("Pantalla creada");
      setOpen(false);
      reset();
      setServerError(null);
      refreshAfterChange(queryClient, "screen");
    },
    onError: (err: unknown) => {
      setServerError(getErrorMessage(err, "No se pudo crear la pantalla"));
    },
  });

  const onSubmit = (data: CreateScreenValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            + Pantalla
          </Button>
        </DialogTrigger>
      )}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva Pantalla / Perfil</DialogTitle>
          <DialogDescription>
            Crea una nueva pantalla para esta cuenta. (Máximo 5)
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Label>Nombre del Perfil</Label>
            <Input {...register("profileName")} placeholder="Ej: Kids" />
            {errors.profileName && (
              <p className="text-destructive text-sm">
                {String(errors.profileName.message)}
              </p>
            )}
          </div>

          <div>
            <Label>PIN</Label>
            <Input
              type="text"
              maxLength={4}
              inputMode="numeric"
              placeholder="1234"
              autoComplete="off"
              {...register("profilePIN")}
            />
            {errors.profilePIN && (
              <p className="text-destructive text-sm">
                {String(errors.profilePIN.message)}
              </p>
            )}
          </div>

          {serverError && (
            <p className="text-destructive text-sm">{serverError}</p>
          )}

          <DialogFooter className="flex-row justify-end space-x-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Spinner />
                  Creando Pantalla
                </>
              ) : (
                "Crear Pantalla"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
