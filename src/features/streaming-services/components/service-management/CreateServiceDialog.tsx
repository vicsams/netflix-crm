"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { refreshAfterChange } from "@/shared/lib/refresh";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/lib/errors";
import { createService } from "@/features/streaming-services/services/service-management/services";
import {
  createServiceSchema,
  CreateServiceValues,
} from "@/features/streaming-services/schemas";
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
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { Spinner } from "@/shared/components/ui/spinner";
import { z } from "zod";

export default function CreateServiceDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof createServiceSchema>>({
    resolver: zodResolver(createServiceSchema),
    defaultValues: {
      serviceName: "",
      price: 0,
      imageUrl: "",
      description: "",
      currency: "USD",
      textColor: "#111827",
      backgroundColor: "#f3f4f6",
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
      };
      return await createService(payload);
    },
    onSuccess: () => {
      toast.success("Servicio creado");
      refreshAfterChange(queryClient, "service");
      reset();
      setOpen(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "No se pudo crear el servicio"));
    },
  });

  const onSubmit = async (values: CreateServiceValues) => {
    await mutation.mutateAsync(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Crear Servicio</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Formulario para crear servicio</DialogTitle>
          <DialogDescription>
            Complete el formulario para crear un nuevo servicio.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <input type="hidden" {...register("textColor")} />
          <input type="hidden" {...register("backgroundColor")} />

          <div>
            <Label>Nombre del servicio</Label>
            <Input {...register("serviceName")} placeholder="Ej: Netflix" />
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
              placeholder="Ej: 4.00"
            />
            {errors.price && (
              <p className="text-destructive">{String(errors.price.message)}</p>
            )}
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea
              {...register("description")}
              placeholder="Ej: Servicio principal peliculas y series enfocadas en la juventud"
            />
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
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
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
