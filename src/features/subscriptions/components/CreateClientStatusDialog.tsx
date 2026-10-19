"use client";

import { useState, useMemo } from "react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { refreshAfterChange } from "@/shared/lib/refresh";
import { formatPin } from "@/shared/lib/pin";
import useOnOpen from "@/shared/hooks/useOnOpen";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/lib/errors";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/shared/lib/utils";
import { useBinancePrice } from "@/shared/context/BinancePriceContext";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import { Spinner } from "@/shared/components/ui/spinner";
import { Separator } from "@/shared/components/ui/separator";
import { Calendar } from "@/shared/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from "@/shared/components/ui/select";

import {
  createClientStatus,
  type CreateClientStatusPayload,
} from "@/features/subscriptions/services/subscriptions";
import { fetchClients } from "@/features/clients/services/clients";
import { fetchServices } from "@/features/streaming-services/services/service-management/services";
import { fetchActiveAccount } from "@/features/streaming-services/services/active-accounts/activeAccount";
import { fetchScreens } from "@/features/streaming-services/services/active-accounts/screens";
import {
  createClientStatusSchema,
  type CreateClientStatusValues,
} from "@/features/subscriptions/schemas";

import { ServiceProps } from "@/features/streaming-services/types/service";
import { ActiveAccountProps } from "@/features/streaming-services/types/activeAccount";
import { ScreenProps } from "@/features/streaming-services/types/screen";
import { Client } from "@/features/clients/types/client";
import { emptyAsNull, emptyAsZero } from "@/shared/lib/forms";
import AmountNotice from "@/features/subscriptions/components/AmountNotice";

export type CreateClientStatusDialogProps = {
  onCreated?: (item: CreateClientStatusPayload) => void;
};

export default function CreateClientStatusDialog({
  onCreated,
}: CreateClientStatusDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateClientStatusValues>({
    resolver: zodResolver(createClientStatusSchema),
    defaultValues: {
      clientId: "",
      activeAccountId: "",
      serviceId: "",
      screenId: "",
      status: "ACTIVE",
      expirationDate: undefined,
      priceSource: "BINANCE",
      customUsdtRate: null,
      supplierPrice: 0,
    },
  });

  const selectedAccountId = useWatch({ control, name: "activeAccountId" });
  const selectedServiceId = useWatch({ control, name: "serviceId" });
  const selectedPriceSource = useWatch({ control, name: "priceSource" });
  const customUsdtRate = useWatch({ control, name: "customUsdtRate" });
  const supplierPrice = useWatch({ control, name: "supplierPrice" });
  const selectedClientId = useWatch({ control, name: "clientId" });
  const selectedScreenId = useWatch({ control, name: "screenId" });

  // Start from a blank form each time it opens, so a cancelled attempt
  // doesn't come back
  useOnOpen(open, () => {
    reset();
    setDate(undefined);
    setError(null);
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  const { data: services = [] } = useQuery<ServiceProps[]>({
    queryKey: ["services"],
    queryFn: fetchServices,
  });

  const { data: accounts = [] } = useQuery<ActiveAccountProps[]>({
    queryKey: ["activeAccounts"],
    queryFn: fetchActiveAccount,
  });

  const { price: binancePrice, isError: binanceFailed } = useBinancePrice();

  const { data: screens = [] } = useQuery<ScreenProps[]>({
    queryKey: ["screens", selectedAccountId],
    queryFn: () =>
      selectedAccountId ? fetchScreens(selectedAccountId) : Promise.resolve([]),
    enabled: !!selectedAccountId,
  });

  const mutation = useMutation({
    mutationFn: createClientStatus,
    onSuccess: (created) => {
      toast.success("Suscripción creada");
      setOpen(false);
      reset();
      setDate(undefined);
      onCreated?.(created);
      refreshAfterChange(queryClient, "subscription", "bank");
    },
    onError: (err: unknown) => {
      setError(getErrorMessage(err, "No se pudo crear la suscripción"));
    },
  });

  const calculatedAmount = useMemo(() => {
    if (!date || !selectedServiceId || !services.length) return null;
    const selectedService = services.find((s) => s.id === selectedServiceId);
    if (!selectedService) return null;

    const days = differenceInDays(date, new Date());
    if (days <= 0)
      return {
        cents: 0,
        waitingForRate: false,
        usdFormatted: "0.00",
        bsFormatted: "0.00 Bs",
      };

    // service.price is in cents
    const usdPriceCents = (selectedService.price / 30) * days;
    const usdPriceFormatted = (usdPriceCents / 100).toFixed(2);

    const rate =
      selectedPriceSource === "CUSTOM"
        ? typeof customUsdtRate === "number" && customUsdtRate > 0
          ? customUsdtRate
          : null
        : binancePrice;

    const grossBsFloat = rate ? (usdPriceCents / 100) * rate : 0;
    const supplierBs =
      typeof supplierPrice === "number" && supplierPrice >= 0
        ? supplierPrice
        : 0;
    const netBsFloat = Math.max(grossBsFloat - supplierBs, 0);

    return {
      cents: Math.round(netBsFloat * 100),
      waitingForRate: !rate,
      usdFormatted: usdPriceFormatted,
      grossBsFormatted: rate
        ? `${grossBsFloat.toFixed(2)} Bs`
        : "Calculando...",
      supplierBsFormatted: `${supplierBs.toFixed(2)} Bs`,
      netBsFormatted: `${netBsFloat.toFixed(2)} Bs`,
    };
  }, [
    date,
    selectedServiceId,
    services,
    binancePrice,
    selectedPriceSource,
    customUsdtRate,
    supplierPrice,
  ]);

  const selectedClient =
    clients.find((client) => client.id === selectedClientId) ?? null;

  // Without a rate the amount is not real yet, so saving is blocked; a real
  // 0 Bs net is allowed but flagged (no earnings get recorded for it)
  const waitingForRate = calculatedAmount?.waitingForRate ?? false;
  const zeroAmount =
    !!calculatedAmount && !waitingForRate && calculatedAmount.cents <= 0;

  const onSubmit = (data: CreateClientStatusValues) => {
    setError(null);
    if (waitingForRate) return;
    let expirationDate = data.expirationDate;

    if (date) {
      expirationDate = date.toISOString();
    }

    mutation.mutate({
      clientId: data.clientId,
      activeAccountId: data.activeAccountId,
      serviceId: data.serviceId,
      screenId: data.screenId,
      status: data.status,
      expirationDate,
      amount: calculatedAmount?.cents ?? null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Nueva Suscripción</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear suscripción</DialogTitle>
          <DialogDescription>
            Seleccione un cliente existente y complete los datos de la
            suscripción.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-2 gap-3"
        >
          <div className="col-span-2">
            <Label>Cliente</Label>
            <Select
              value={selectedClientId || undefined}
              onValueChange={(value) =>
                setValue("clientId", value, { shouldValidate: true })
              }
              disabled={clients.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup className="max-h-70 overflow-y-auto">
                  <SelectLabel className="bg-popover! sticky top-0 z-999">
                    Clientes
                  </SelectLabel>
                  {clients.map((client) => (
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
              <p className="text-destructive text-sm">
                {errors.clientId.message}
              </p>
            )}
          </div>

          <div className="col-span-2 grid grid-cols-2 gap-4">
            {selectedClientId ? (
              <div className="col-span-1">
                <Label>Numero de telefono</Label>
                <Input
                  value={selectedClient?.phoneNumber ?? ""}
                  placeholder="Selecciona un cliente"
                  readOnly
                  disabled
                />
              </div>
            ) : (
              <div></div>
            )}

            <div className="col-span-1">
              <Label>Cuenta activa</Label>
              <Select
                value={selectedAccountId || ""}
                onValueChange={(val) => {
                  setValue("activeAccountId", val, { shouldValidate: true });
                  // A profile belongs to one account: clear the previous
                  // account's, and take the service from the new account
                  setValue("screenId", "");
                  const account = accounts.find((a) => a.id === val);
                  if (account?.serviceId) {
                    setValue("serviceId", account.serviceId, {
                      shouldValidate: true,
                    });
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar cuenta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Cuentas activas</SelectLabel>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.email}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.activeAccountId && (
                <p className="text-destructive text-sm">
                  {errors.activeAccountId.message}
                </p>
              )}
            </div>
          </div>

          <div className="col-span-2 grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <Label>Servicio</Label>
              <Select
                value={selectedServiceId || ""}
                onValueChange={(val) =>
                  setValue("serviceId", val, { shouldValidate: true })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar servicio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Servicios</SelectLabel>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.serviceName}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.serviceId && (
                <p className="text-destructive text-sm">
                  {errors.serviceId.message}
                </p>
              )}
            </div>

            <div className="col-span-1">
              <Label>Pantalla / Perfil</Label>
              <Select
                value={selectedScreenId || ""}
                onValueChange={(val) =>
                  setValue("screenId", val, { shouldValidate: true })
                }
                disabled={!selectedAccountId || screens.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      !selectedAccountId
                        ? "Selecciona una cuenta primero"
                        : screens.length === 0
                          ? "No hay pantallas"
                          : "Seleccionar perfil"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Pantallas de la cuenta</SelectLabel>
                    {screens.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.profileName} (PIN: {formatPin(s.profilePIN)})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.screenId && (
                <p className="text-destructive text-sm">
                  {errors.screenId.message}
                </p>
              )}
            </div>
          </div>

          <div className="col-span-2 flex flex-col">
            <Label>Fecha de expiración</Label>
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

          <div className="col-span-2 grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <Label>Modo de tasa USDT</Label>
              <Select
                value={selectedPriceSource}
                onValueChange={(val) =>
                  setValue("priceSource", val as "BINANCE" | "CUSTOM")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una opción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="BINANCE">Usar Binance</SelectItem>
                    <SelectItem value="CUSTOM">Tasa manual</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {selectedPriceSource === "CUSTOM" && (
              <div className="col-span-1">
                <Label>Tasa USDT manual</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ej: 105.25"
                  {...register("customUsdtRate", { setValueAs: emptyAsNull })}
                />
                {errors.customUsdtRate && (
                  <p className="text-destructive text-sm">
                    {errors.customUsdtRate.message}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="col-span-2">
            <Label>Precio proveedor (Bs)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="Ej: 250.00"
              {...register("supplierPrice", { setValueAs: emptyAsZero })}
            />
            {errors.supplierPrice && (
              <p className="text-destructive text-sm">
                {errors.supplierPrice.message}
              </p>
            )}
          </div>

          {date && selectedServiceId && (
            <Separator className="col-span-2 my-2" />
          )}
          {calculatedAmount && (
            <div className="col-span-2 space-y-1 rounded-md p-0 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-semibold">
                  Servicio calculado:
                </span>
                <span className="text-foreground">
                  {calculatedAmount.usdFormatted} USD
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-semibold">
                  Monto bruto (Bs):
                </span>
                <span className="text-foreground">
                  {calculatedAmount.grossBsFormatted}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-semibold">
                  Precio proveedor (Bs):
                </span>
                <span className="text-foreground">
                  - {calculatedAmount.supplierBsFormatted}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-semibold">
                  Monto neto a guardar:
                </span>
                <span className="text-md text-foreground font-bold">
                  {calculatedAmount.netBsFormatted}
                </span>
              </div>
            </div>
          )}

          <div className="col-span-2">
            <AmountNotice
              waitingForRate={waitingForRate}
              customRate={selectedPriceSource === "CUSTOM"}
              binanceFailed={binanceFailed}
              zeroAmount={zeroAmount}
              zeroAmountMessage="La suscripción se creará sin registrar ningún ingreso en tus ganancias."
            />
          </div>

          {error && <div className="text-destructive text-sm">{error}</div>}

          <DialogFooter className="col-span-2 flex-row justify-end">
            <DialogClose asChild>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={mutation.isPending}
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={mutation.isPending || waitingForRate}
            >
              {mutation.isPending ? (
                <>
                  <Spinner />
                  Creando
                </>
              ) : zeroAmount ? (
                "Crear con 0 Bs"
              ) : (
                "Crear"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
