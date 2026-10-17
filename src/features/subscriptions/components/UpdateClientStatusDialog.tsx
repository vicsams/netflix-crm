"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/lib/errors";
import { updateClientStatus } from "@/features/subscriptions/services/subscriptions";
import { fetchClients } from "@/features/clients/services/clients";
import { fetchServices } from "@/features/streaming-services/services/service-management/services";
import { fetchActiveAccount } from "@/features/streaming-services/services/active-accounts/activeAccount";
import { fetchScreens } from "@/features/streaming-services/services/active-accounts/screens";
import {
  updateClientStatusSchema,
  UpdateClientStatusValues,
} from "@/features/subscriptions/schemas";
// import { ClientStatus } from "@/features/subscriptions/types/clientStatus";
import { Client } from "@/features/clients/types/client";
import { ServiceProps } from "@/features/streaming-services/types/service";
import { ActiveAccountProps } from "@/features/streaming-services/types/activeAccount";
import { ScreenProps } from "@/features/streaming-services/types/screen";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
  SelectGroup,
} from "@/shared/components/ui/select";
import { Calendar } from "@/shared/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { isBefore, isSameDay, startOfToday } from "date-fns";
import { formatDate } from "@/shared/lib/date";
import { UpdateClientStatusDialogProps } from "@/features/subscriptions/types/clientStatus";

function toDate(value?: string | null) {
  return value ? new Date(value) : undefined;
}

export default function UpdateClientStatusDialog({
  clientStatus,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: UpdateClientStatusDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? setControlledOpen : setUncontrolledOpen;
  const queryClient = useQueryClient();

  const services = useQuery<ServiceProps[]>({
    queryKey: ["services"],
    queryFn: fetchServices,
  });

  const clients = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  const activeAccounts = useQuery<ActiveAccountProps[]>({
    queryKey: ["activeAccounts"],
    queryFn: fetchActiveAccount,
  });

  // The expiration date lives outside the form: it is only sent when the user
  // changes it, as a full timestamp. Resending the stored one (cut to
  // "YYYY-MM-DD") made the server read it as UTC midnight, a day earlier
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(() =>
    toDate(clientStatus.expirationDate),
  );
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setExpirationDate(toDate(clientStatus.expirationDate));
  }

  const {
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<UpdateClientStatusValues>({
    resolver: zodResolver(updateClientStatusSchema),
    defaultValues: {
      clientId: clientStatus.clientId,
      activeAccountId: clientStatus.activeAccountId,
      serviceId: clientStatus.serviceId,
      screenId: clientStatus.screenId,
      status:
        (clientStatus.status as "ACTIVE" | "EXPIRED" | "NEAR_EXPIRATION") ??
        "NEAR_EXPIRATION",
    },
  });

  const selectedAccountId = useWatch({
    control,
    name: "activeAccountId",
  });

  const selectedServiceId = useWatch({
    control,
    name: "serviceId",
  });

  const selectedScreenId = useWatch({
    control,
    name: "screenId",
  });

  const selectedClientId = useWatch({
    control,
    name: "clientId",
  });

  const selectedClient =
    clients.data?.find((client) => client.id === selectedClientId) ?? null;

  const screens = useQuery<ScreenProps[]>({
    queryKey: ["screens", selectedAccountId],
    queryFn: () =>
      selectedAccountId ? fetchScreens(selectedAccountId) : Promise.resolve([]),
    enabled: !!selectedAccountId,
  });

  useEffect(() => {
    if (!open) return;

    reset({
      clientId: clientStatus.clientId,
      activeAccountId: clientStatus.activeAccountId,
      serviceId: clientStatus.serviceId,
      screenId: clientStatus.screenId,
      status:
        (clientStatus.status as "ACTIVE" | "EXPIRED" | "NEAR_EXPIRATION") ??
        "NEAR_EXPIRATION",
    });
  }, [clientStatus, open, reset]);

  useEffect(() => {
    if (!selectedAccountId || !screens.data || !selectedScreenId) return;

    const screenBelongsToSelectedAccount = screens.data.some(
      (screen) => screen.id === selectedScreenId,
    );

    if (!screenBelongsToSelectedAccount) {
      setValue("screenId", undefined, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [screens.data, selectedAccountId, selectedScreenId, setValue]);

  const mutation = useMutation({
    mutationFn: async (data: UpdateClientStatusValues) => {
      return await updateClientStatus(clientStatus.id, {
        ...data,
      });
    },
    onSuccess: () => {
      toast.success("Suscripción actualizada");
      queryClient.invalidateQueries({ queryKey: ["clientStatuses"] });
      if (setOpen) setOpen(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error, "No se pudo actualizar la suscripción"),
      );
    },
  });

  const onSubmit = async (values: UpdateClientStatusValues) => {
    const originalDate = toDate(clientStatus.expirationDate);
    const dateChanged =
      !!expirationDate &&
      (!originalDate || !isSameDay(expirationDate, originalDate));

    await mutation.mutateAsync({
      ...values,
      // A corrected date also corrects the status; no amount is sent, so the
      // server records no earnings (that is what Renovar is for)
      ...(dateChanged && {
        expirationDate: expirationDate.toISOString(),
        status: isBefore(expirationDate, startOfToday()) ? "EXPIRED" : "ACTIVE",
      }),
    });
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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Actualizar suscripcion</DialogTitle>
          <DialogDescription>
            Modifique los datos de la suscripcion.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Label>Cliente</Label>
            <Select
              value={selectedClientId || undefined}
              onValueChange={(value) =>
                setValue("clientId", value, { shouldValidate: true })
              }
              disabled={clients.isLoading || (clients.data?.length ?? 0) === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup className="max-h-70 overflow-y-auto">
                  <SelectLabel className="sticky top-0 z-999 bg-white!">
                    Clientes
                  </SelectLabel>
                  {(clients.data ?? []).map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.clientName} ({client.phoneNumber})
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground mt-1 text-xs">
              Si no encuentras el cliente, crealo primero en la pestaña
              Clientes.
            </p>
            {errors.clientId && (
              <p className="text-destructive">
                {String(errors.clientId.message)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Telefono</Label>
              <Input value={selectedClient?.phoneNumber ?? ""} readOnly />
            </div>

            <div>
              <Label>Cuenta Activa</Label>
              <Select
                value={selectedAccountId || undefined}
                onValueChange={(val) => {
                  const selectedAccount = activeAccounts.data?.find(
                    (account) => account.id === val,
                  );

                  setValue("activeAccountId", val, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  setValue("screenId", undefined, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });

                  if (selectedAccount?.serviceId) {
                    setValue("serviceId", selectedAccount.serviceId, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccione una cuenta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Cuentas Activas</SelectLabel>
                    {activeAccounts.data?.map((account: ActiveAccountProps) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.email}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.activeAccountId && (
                <p className="text-destructive">
                  {String(errors.activeAccountId.message)}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Servicio</Label>
              <Select
                value={selectedServiceId || undefined}
                onValueChange={(val) =>
                  setValue("serviceId", val, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccione un servicio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Servicios</SelectLabel>
                    {services.data?.map((service: ServiceProps) => (
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

            <div>
              <Label>Perfil</Label>
              <Select
                value={selectedScreenId || undefined}
                onValueChange={(val) =>
                  setValue("screenId", val, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                disabled={
                  !selectedAccountId || (screens.data?.length ?? 0) === 0
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      !selectedAccountId
                        ? "Seleccione una cuenta primero"
                        : screens.data?.length === 0
                          ? "No hay pantallas"
                          : "Seleccione una pantalla"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Perfiles</SelectLabel>
                    {screens.data?.map((screen: ScreenProps) => (
                      <SelectItem key={screen.id} value={screen.id}>
                        {screen.profileName} (PIN: {screen.profilePIN})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.screenId && (
                <p className="text-destructive">
                  {String(errors.screenId.message)}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label>Fecha de vencimiento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="text-muted-foreground w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expirationDate ? (
                    formatDate(expirationDate.toISOString())
                  ) : (
                    <span>Sin fecha de vencimiento</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expirationDate}
                  defaultMonth={expirationDate}
                  onSelect={setExpirationDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-muted-foreground mt-1 text-xs">
              Corrige la fecha sin registrar un pago. Para cobrar una
              renovación, usa Renovar.
            </p>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen && setOpen(false)}
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
