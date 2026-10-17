"use client";

import { useState, useMemo } from "react";
import { format, differenceInDays, addMonths } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { refreshAfterChange } from "@/shared/lib/refresh";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/lib/errors";
import { cn } from "@/shared/lib/utils";
import { useBinancePrice } from "@/shared/context/BinancePriceContext";
import { updateClientStatus } from "@/features/subscriptions/services/subscriptions";
import {
  renewClientStatusSchema,
  RenewClientStatusValues,
} from "@/features/subscriptions/schemas";
import { Separator } from "@/shared/components/ui/separator";
import { Button } from "@/shared/components/ui/button";
import { Calendar } from "@/shared/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Spinner } from "@/shared/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { formatDate } from "@/shared/lib/date";
import { emptyAsNull, emptyAsZero } from "@/shared/lib/forms";
import AmountNotice from "@/features/subscriptions/components/AmountNotice";
import { ClientStatusRenewDialogProps } from "@/features/subscriptions/types/clientStatus";

const RENEW_PERIODS = [
  { months: 1, label: "1 Mes" },
  { months: 3, label: "3 Meses" },
  { months: 12, label: "1 Año" },
] as const;

type RenewMode = "PRESET" | "CUSTOM";

// Mode panels are stacked and cross-faded: the outgoing one fades out fast,
// then the incoming one fades in. Hidden with opacity, not `invisible`:
// children with `transition-all` (e.g. Button) animate an inherited
// visibility change, so they would linger on top of the incoming panel
const PANEL_CLASS =
  "col-start-1 row-start-1 transition-opacity ease-out motion-reduce:transition-none data-[state=active]:opacity-100 data-[state=active]:duration-200 data-[state=active]:delay-75 data-[state=inactive]:pointer-events-none data-[state=inactive]:opacity-0 data-[state=inactive]:duration-100";

// Renewals extend from the current expiration date (today if there is none)
function getRenewDate(
  expirationDate: string | null | undefined,
  months: number,
) {
  return addMonths(
    expirationDate ? new Date(expirationDate) : new Date(),
    months,
  );
}

export default function ClientStatusRenewDialog({
  clientStatus,
  open,
  onOpenChange,
}: ClientStatusRenewDialogProps) {
  const clientName = clientStatus.client?.clientName ?? clientStatus.clientName;
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<RenewMode>("PRESET");
  const [presetMonths, setPresetMonths] = useState<number>(1);
  const [customDate, setCustomDate] = useState<Date | undefined>();

  const date =
    mode === "PRESET"
      ? getRenewDate(clientStatus.expirationDate, presetMonths)
      : customDate;

  // The dialog stays mounted, so reset the choice every time it opens
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setMode("PRESET");
      setPresetMonths(1);
      setCustomDate(undefined);
    }
  }

  function changeMode(next: RenewMode) {
    // Start the calendar on the date the preset was showing
    if (next === "CUSTOM" && !customDate) setCustomDate(date);
    setMode(next);
  }

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<RenewClientStatusValues>({
    resolver: zodResolver(renewClientStatusSchema),
    defaultValues: {
      expirationDate: new Date().toISOString(),
      priceSource: "BINANCE",
      customUsdtRate: null,
      supplierPrice: 0,
    },
  });

  const selectedPriceSource = useWatch({
    control,
    name: "priceSource",
  });
  const customUsdtRate = useWatch({
    control,
    name: "customUsdtRate",
  });
  const supplierPrice = useWatch({
    control,
    name: "supplierPrice",
  });

  const { price: binancePrice } = useBinancePrice();

  const calculatedAmount = useMemo(() => {
    const serviceWithPrice = clientStatus.service as { price?: number } | null;
    if (
      !date ||
      !serviceWithPrice ||
      typeof serviceWithPrice.price !== "number"
    )
      return null;
    const servicePriceCents = serviceWithPrice.price;

    const days = differenceInDays(date, new Date());
    if (days <= 0)
      return {
        cents: 0,
        waitingForRate: false,
        usdFormatted: "0.00",
        bsFormatted: "0.00 Bs",
      };

    const usdPriceCents = (servicePriceCents / 30) * days;
    const usdPriceFormatted = (usdPriceCents / 100).toFixed(2);

    const rate =
      selectedPriceSource === "CUSTOM"
        ? typeof customUsdtRate === "number" && customUsdtRate >= 0
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
    clientStatus.service,
    binancePrice,
    selectedPriceSource,
    customUsdtRate,
    supplierPrice,
  ]);

  const mutation = useMutation({
    mutationFn: async () => {
      return await updateClientStatus(clientStatus.id, {
        status: "ACTIVE",
        amount: calculatedAmount?.cents ?? null,
        expirationDate: date ? date.toISOString() : undefined,
      });
    },
    onSuccess: () => {
      toast.success(
        `Suscripción renovada hasta el ${formatDate(date?.toISOString())}`,
      );
      refreshAfterChange(queryClient, "subscription", "bank");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "No se pudo renovar la suscripción"));
    },
  });

  // Without a rate the amount is not real yet, so saving is blocked; a real
  // 0 Bs net is allowed but flagged (no earnings get recorded for it)
  const waitingForRate = calculatedAmount?.waitingForRate ?? false;
  const zeroAmount =
    !!calculatedAmount && !waitingForRate && calculatedAmount.cents <= 0;

  const onSubmit = async () => {
    if (!date) return;
    if (waitingForRate) return;
    await mutation.mutateAsync();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renovar Cliente</DialogTitle>
          <DialogDescription>
            Renueva la suscripción de &quot;{clientName}&quot;. Establece la
            nueva fecha de expiración.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Label>Nueva fecha de expiración</Label>
            <Tabs
              value={mode}
              onValueChange={(value) => changeMode(value as RenewMode)}
              className="mt-2"
            >
              <TabsList className="w-full">
                <TabsTrigger value="PRESET">Tiempo predefinido</TabsTrigger>
                <TabsTrigger value="CUSTOM">Fecha personalizada</TabsTrigger>
              </TabsList>

              {/* Both panels stay mounted and share one grid cell, so the area
                  is as tall as the taller panel and switching does not shift
                  the layout */}
              <div className="grid">
                <TabsContent
                  value="PRESET"
                  forceMount
                  inert={mode !== "PRESET"}
                  className={cn(PANEL_CLASS, "space-y-2")}
                >
                  <div className="grid grid-cols-3 gap-2">
                    {RENEW_PERIODS.map((period) => (
                      <Button
                        key={period.months}
                        type="button"
                        variant={
                          presetMonths === period.months ? "default" : "outline"
                        }
                        aria-pressed={presetMonths === period.months}
                        onClick={() => setPresetMonths(period.months)}
                      >
                        {period.label}
                      </Button>
                    ))}
                  </div>
                  {date && (
                    <p className="text-muted-foreground text-sm">
                      Vence el{" "}
                      <span className="text-foreground font-medium">
                        {formatDate(date.toISOString())}
                      </span>
                    </p>
                  )}
                </TabsContent>

                <TabsContent
                  value="CUSTOM"
                  forceMount
                  inert={mode !== "CUSTOM"}
                  className={PANEL_CLASS}
                >
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant={"outline"}
                        className={cn(
                          "text-muted-foreground w-full justify-start text-left font-normal",
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
                        required
                        selected={date}
                        defaultMonth={date}
                        onSelect={setCustomDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </TabsContent>
              </div>
            </Tabs>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <Label>Modo de tasa USDT</Label>
                <Select
                  defaultValue="BINANCE"
                  onValueChange={(val) =>
                    setValue("priceSource", val as "BINANCE" | "CUSTOM")
                  }
                >
                  <SelectTrigger className="mt-2 w-full">
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
                <div>
                  <Label>Tasa USDT manual</Label>
                  <Input
                    className="mt-2"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ej: 105.25"
                    {...register("customUsdtRate", { setValueAs: emptyAsNull })}
                  />
                  {errors.customUsdtRate && (
                    <p className="text-destructive mt-1 text-sm">
                      {errors.customUsdtRate.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4">
              <Label>Precio proveedor (Bs)</Label>
              <Input
                className="mt-2"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ej: 250.00"
                {...register("supplierPrice", { setValueAs: emptyAsZero })}
              />
              {errors.supplierPrice && (
                <p className="text-destructive mt-1 text-sm">
                  {errors.supplierPrice.message}
                </p>
              )}
            </div>

            <Separator className="my-6" />

            {calculatedAmount && (
              <div className="space-y-1 rounded-md p-0 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-700">
                    Servicio calculado:
                  </span>
                  <span>{calculatedAmount.usdFormatted} USD</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-700">
                    Monto bruto (Bs):
                  </span>
                  <span>{calculatedAmount.grossBsFormatted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-700">
                    Precio proveedor (Bs):
                  </span>
                  <span>- {calculatedAmount.supplierBsFormatted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-700">
                    Monto neto a guardar:
                  </span>
                  <span className="text-md font-bold">
                    {calculatedAmount.netBsFormatted}
                  </span>
                </div>
              </div>
            )}

            <div className="mt-4">
              <AmountNotice
                waitingForRate={waitingForRate}
                customRate={selectedPriceSource === "CUSTOM"}
                zeroAmount={zeroAmount}
                zeroAmountMessage="La fecha se extenderá, pero no se sumará nada a tus ganancias ni se actualizará la fecha de compra."
              />
            </div>

            {!date && (
              <p className="text-destructive mt-1 text-sm">
                La fecha de expiración es requerida
              </p>
            )}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || !date || waitingForRate}
            >
              {mutation.isPending ? (
                <>
                  <Spinner />
                  Renovando
                </>
              ) : zeroAmount ? (
                "Renovar con 0 Bs"
              ) : (
                "Renovar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
