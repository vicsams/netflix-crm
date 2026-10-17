"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { refreshAfterChange } from "@/shared/lib/refresh";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/lib/errors";
import { updateService } from "@/features/streaming-services/services/service-management/services";
import {
  createServiceSchema,
  CreateServiceValues,
} from "@/features/streaming-services/schemas";
// import type { ServiceProps } from "@/features/streaming-services/types/service";
import { HexColorPicker } from "react-colorful";

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
import { Textarea } from "@/shared/components/ui/textarea";
import { z } from "zod";
import { UpdateServiceDialogProps } from "@/features/streaming-services/types/service";

export default function UpdateServiceDialog({
  service,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: UpdateServiceDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? setControlledOpen : setUncontrolledOpen;
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<z.infer<typeof createServiceSchema>>({
    resolver: zodResolver(createServiceSchema),
    defaultValues: {
      serviceName: service.serviceName,
      price: service.price / 100, // Convert cents to dollars
      description: service.description ?? "",
      currency: service.currency,
      textColor: service.textColor ?? "#111827",
      backgroundColor: service.backgroundColor ?? "#f3f4f6",
    },
  });

  const textColor = useWatch({
    control,
    name: "textColor",
  });

  const backgroundColor = useWatch({
    control,
    name: "backgroundColor",
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateServiceValues) => {
      const payload = {
        serviceName: data.serviceName,
        description: data.description ?? "",
        price: data.price,
        currency: data.currency ?? "USD",
        textColor: data.textColor.toLowerCase(),
        backgroundColor: data.backgroundColor.toLowerCase(),
        imageUrl: data.imageUrl,
      };
      return await updateService(service.id, payload);
    },
    onSuccess: () => {
      toast.success("Servicio actualizado");
      refreshAfterChange(queryClient, "service");
      setOpen?.(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "No se pudo actualizar el servicio"));
    },
  });

  const onSubmit = async (values: CreateServiceValues) => {
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
          <DialogTitle>Actualizar Servicio</DialogTitle>
          <DialogDescription>
            Modifique los datos del servicio.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <input type="hidden" {...register("textColor")} />
          <input type="hidden" {...register("backgroundColor")} />

          <div>
            <Label>Nombre del servicio</Label>
            <Input {...register("serviceName")} />
            {errors.serviceName && (
              <p className="text-destructive">
                {String(errors.serviceName.message)}
              </p>
            )}
          </div>

          <div>
            <Label>Precio (USD)</Label>
            <Input
              type="number"
              step="0.01"
              {...register("price", { valueAsNumber: true })}
            />
            {errors.price && (
              <p className="text-destructive">{String(errors.price.message)}</p>
            )}
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea {...register("description")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Color de texto</Label>
              <HexColorPicker
                color={textColor ?? "#111827"}
                onChange={(color) =>
                  setValue("textColor", color, { shouldValidate: true })
                }
                className="mt-2! w-full!"
              />
              <Input
                className="mt-2"
                value={textColor ?? "#111827"}
                onChange={(e) =>
                  setValue("textColor", e.target.value, {
                    shouldValidate: true,
                  })
                }
                placeholder="#111827"
              />
              {errors.textColor && (
                <p className="text-destructive mt-1 text-sm">
                  {String(errors.textColor.message)}
                </p>
              )}
            </div>

            <div>
              <Label>Color de fondo</Label>
              <HexColorPicker
                color={backgroundColor ?? "#f3f4f6"}
                onChange={(color) =>
                  setValue("backgroundColor", color, { shouldValidate: true })
                }
                className="mt-2! w-full!"
              />
              <Input
                className="mt-2"
                value={backgroundColor ?? "#f3f4f6"}
                onChange={(e) =>
                  setValue("backgroundColor", e.target.value, {
                    shouldValidate: true,
                  })
                }
                placeholder="#f3f4f6"
              />
              {errors.backgroundColor && (
                <p className="text-destructive mt-1 text-sm">
                  {String(errors.backgroundColor.message)}
                </p>
              )}
            </div>
          </div>

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
