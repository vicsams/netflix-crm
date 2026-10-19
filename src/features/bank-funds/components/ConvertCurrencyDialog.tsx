"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { refreshAfterChange } from "@/shared/lib/refresh";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/lib/errors";
import { formatMoney } from "@/shared/lib/money";
import {
  convertCurrency,
  fetchBankEarnings,
} from "@/features/bank-funds/services/bankEarnings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Spinner } from "@/shared/components/ui/spinner";
import { ConvertCurrencyDialogProps } from "@/features/bank-funds/types/bankEarnings";

export default function ConvertCurrencyDialog({
  open,
  onOpenChange,
}: ConvertCurrencyDialogProps) {
  const [amountBs, setAmountBs] = useState<number | "">("");
  const [rate, setRate] = useState<number | "">("");
  // Money moves only after a second, explicit confirmation of the summary
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: bank } = useQuery({
    queryKey: ["bankEarnings"],
    queryFn: fetchBankEarnings,
    enabled: open,
  });
  const availableBs = bank ? bank.total / 100 : null;

  const resetForm = () => {
    setAmountBs("");
    setRate("");
    setReviewing(false);
    setError(null);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (typeof amountBs !== "number" || typeof rate !== "number") return;
      return convertCurrency({ amountBs, rate });
    },
    onSuccess: () => {
      toast.success("Conversión realizada");
      refreshAfterChange(queryClient, "bank");
      onOpenChange(false);
      resetForm();
    },
    onError: (err: unknown) => {
      setError(getErrorMessage(err, "Ocurrió un error en la conversión"));
      setReviewing(false);
    },
  });

  const expectedUsdt =
    typeof amountBs === "number" && typeof rate === "number" && rate > 0
      ? amountBs / rate
      : 0;

  const exceedsBalance =
    typeof amountBs === "number" &&
    availableBs !== null &&
    Math.round(amountBs * 100) > Math.round(availableBs * 100);

  const canReview =
    typeof amountBs === "number" &&
    amountBs > 0 &&
    typeof rate === "number" &&
    rate > 0 &&
    !exceedsBalance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!canReview) return;
    if (!reviewing) {
      setReviewing(true);
      return;
    }
    mutation.mutate();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (mutation.isPending) return;
    onOpenChange(nextOpen);
    if (!nextOpen) resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convertir Bs a USDT</DialogTitle>
          <DialogDescription>
            Disponible:{" "}
            <span className="text-foreground font-semibold">
              {availableBs === null ? "…" : `${formatMoney(availableBs)} Bs`}
            </span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {reviewing ? (
            <div className="bg-muted space-y-2 rounded-md p-4 text-sm">
              <p className="font-semibold">Revisa la conversión</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monto a convertir</span>
                <span>{formatMoney(Number(amountBs))} Bs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tasa</span>
                <span>{formatMoney(Number(rate))} Bs por USDT</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Recibirás aprox.</span>
                <span>{formatMoney(expectedUsdt)} USDT</span>
              </div>
              {availableBs !== null && (
                <div className="text-muted-foreground flex justify-between">
                  <span>Te quedarán</span>
                  <span>{formatMoney(availableBs - Number(amountBs))} Bs</span>
                </div>
              )}
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="convert-amount">
                    Monto en Bs a convertir
                  </Label>
                  {availableBs !== null && availableBs > 0 && (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => setAmountBs(availableBs)}
                    >
                      Máx
                    </Button>
                  )}
                </div>
                <Input
                  id="convert-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amountBs}
                  onChange={(e) =>
                    setAmountBs(
                      e.target.value ? parseFloat(e.target.value) : "",
                    )
                  }
                  placeholder="Ej: 10000"
                  required
                />
                {exceedsBalance && (
                  <p className="text-destructive mt-1 text-sm">
                    El monto supera tu saldo disponible.
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="convert-rate">
                  Tasa de cambio (Ej: 400 Bs por 1 USDT)
                </Label>
                <Input
                  id="convert-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={rate}
                  onChange={(e) =>
                    setRate(e.target.value ? parseFloat(e.target.value) : "")
                  }
                  placeholder="Ej: 400"
                  required
                />
              </div>
              <div className="bg-muted rounded p-3 text-sm">
                <strong>Recibirás aprox:</strong> {formatMoney(expectedUsdt)}{" "}
                USDT
              </div>
            </>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex gap-2">
            {reviewing && (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={mutation.isPending}
                onClick={() => setReviewing(false)}
              >
                Volver
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1"
              disabled={mutation.isPending || !canReview}
            >
              {mutation.isPending ? (
                <>
                  <Spinner />
                  Convirtiendo
                </>
              ) : reviewing ? (
                "Confirmar conversión"
              ) : (
                "Revisar conversión"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
