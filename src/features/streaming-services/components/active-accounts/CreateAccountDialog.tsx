"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useOnOpen from "@/shared/hooks/useOnOpen";
import { refreshAfterChange } from "@/shared/lib/refresh";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/lib/errors";
import { createActiveAccount } from "@/features/streaming-services/services/active-accounts/activeAccount";
import { fetchServices } from "@/features/streaming-services/services/service-management/services";
import type { ServiceProps } from "@/features/streaming-services/types/service";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/shared/components/ui/popover";
import { Calendar } from "@/shared/components/ui/calendar";
import { Label } from "@/shared/components/ui/label";
import { Spinner } from "@/shared/components/ui/spinner";
import { CreateAccountFormValues } from "@/features/streaming-services/types/activeAccount";

export default function CreateAccountDialog() {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateAccountFormValues>({
    defaultValues: { email: "", password: "", serviceId: "" },
  });

  const selectedServiceId = useWatch({
    control,
    name: "serviceId",
  });

  const servicesQuery = useQuery<ServiceProps[]>({
    queryKey: ["services"],
    queryFn: fetchServices,
  });

  // Start from a blank form each time it opens, so a cancelled attempt
  // doesn't come back
  useOnOpen(open, () => {
    reset();
    setServerError(null);
    setDate(undefined);
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateAccountFormValues) => {
      let expirationDate = new Date().toISOString();
      if (date) {
        expirationDate = date.toISOString();
      }
      return await createActiveAccount({
        email: data.email,
        password: data.password,
        serviceId: data.serviceId,
        expirationDate,
      });
    },
    onSuccess: () => {
      toast.success("Cuenta creada");
      refreshAfterChange(queryClient, "account");
      reset();
      setServerError(null);
      setDate(undefined);
      setOpen(false);
    },
    onError: (err: unknown) => {
      setServerError(getErrorMessage(err, "No se pudo crear la cuenta"));
    },
  });

  const onSubmit = async (values: CreateAccountFormValues) => {
    if (!date) {
      setServerError("La fecha de expiración es obligatoria");
      return;
    }
    setServerError(null);
    await mutation.mutateAsync(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Crear Cuenta</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Cuenta Activa</DialogTitle>
          <DialogDescription>
            Complete el formulario para crear una cuenta activa.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <input
            type="hidden"
            {...register("serviceId", {
              required: "El servicio es obligatorio",
            })}
          />

          <div>
            <Label>Correo Electrónico</Label>
            <Input
              type="email"
              {...register("email", {
                required: "El correo electrónico es obligatorio",
              })}
              placeholder="Ej: cuentanetflix@gmail.com"
            />
            {errors.email && (
              <p className="text-destructive">{String(errors.email.message)}</p>
            )}
          </div>

          <div>
            <Label>Contraseña</Label>
            <Input
              type="text"
              {...register("password", {
                required: "La contraseña es obligatoria",
              })}
              placeholder="Ingrese la contraseña para la cuenta activa"
            />
            {errors.password && (
              <p className="text-destructive">
                {String(errors.password.message)}
              </p>
            )}
          </div>

          <div>
            <Label>Servicio</Label>
            <Select
              value={selectedServiceId}
              onValueChange={(val) => setValue("serviceId", val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccione un servicio" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Servicios</SelectLabel>
                  {servicesQuery.data?.map((service: ServiceProps) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.serviceName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.serviceId && (
              <p className="text-destructive">
                {String(errors.serviceId.message)}
              </p>
            )}
          </div>

          <div className="flex flex-col">
            <Label>Fecha de Expiración</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? (
                    format(date, "PPP", { locale: es })
                  ) : (
                    <span>Elige una fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {serverError && (
            <p className="text-destructive text-sm">{serverError}</p>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                reset();
                setDate(undefined);
                setServerError(null);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {mutation.isPending ? (
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
