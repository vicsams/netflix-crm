"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/lib/errors";
import { convertCurrency } from "@/features/bank-funds/services/bankEarnings";
import {
  Dialog,
  DialogContent,
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
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (typeof amountBs !== "number" || typeof rate !== "number") return;
      return convertCurrency({ amountBs, rate });
    },
    onSuccess: () => {
      toast.success("Conversión realizada");
      queryClient.invalidateQueries({ queryKey: ["bankEarnings"] });
      onOpenChange(false);
      setAmountBs("");
      setRate("");
      setError(null);
    },
    onError: (err: unknown) => {
      setError(getErrorMessage(err, "Ocurrió un error en la conversión"));
    },
  });

  const expectedUsdt =
    typeof amountBs === "number" && typeof rate === "number" && rate > 0
      ? (amountBs / rate).toFixed(2)
      : "0.00";

  const isRateTooHigh =
    typeof amountBs === "number" && typeof rate === "number" && rate > amountBs;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isRateTooHigh) return;
    mutation.mutate();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setAmountBs("");
      setRate("");
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convertir Bs a USDT</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Monto en Bs a convertir</Label>
            <Input
              type="number"
              step="0.01"
              value={amountBs}
              onChange={(e) =>
                setAmountBs(e.target.value ? parseFloat(e.target.value) : "")
              }
              placeholder="Ej: 10000"
              required
            />
          </div>
          <div>
            <Label>Tasa de cambio (Ej: 400 Bs por 1 USDT)</Label>
            <Input
              type="number"
              step="0.01"
              value={rate}
              onChange={(e) =>
                setRate(e.target.value ? parseFloat(e.target.value) : "")
              }
              placeholder="Ej: 400"
              required
            />
            {isRateTooHigh && (
              <p className="text-sm text-red-500">
                La tasa de cambio no puede ser mayor que el monto a convertir.
              </p>
            )}
          </div>
          <div className="rounded bg-neutral-100 p-3 text-sm text-neutral-800">
            <strong>Recibirás aprox:</strong> {expectedUsdt} USDT
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending || !amountBs || !rate || isRateTooHigh}
          >
            {mutation.isPending ? (
              <>
                <Spinner />
                Convirtiendo
              </>
            ) : (
              "Confirmar Conversión"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
