"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/lib/errors";
import {
  withdrawFunds,
  type WithdrawCurrency,
} from "@/features/bank-funds/services/bankEarnings";
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
import { Textarea } from "@/shared/components/ui/textarea";

type WithdrawFundsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: WithdrawCurrency;
};

export default function WithdrawFundsDialog({
  open,
  onOpenChange,
  currency,
}: WithdrawFundsDialogProps) {
  const [amount, setAmount] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (typeof amount !== "number") return;
      return withdrawFunds({
        currency,
        amount,
        reason,
      });
    },
    onSuccess: () => {
      toast.success("Retiro registrado");
      queryClient.invalidateQueries({ queryKey: ["bankEarnings"] });
      queryClient.invalidateQueries({ queryKey: ["bankWithdrawals"] });
      onOpenChange(false);
      setAmount("");
      setReason("");
      setError(null);
    },
    onError: (err: unknown) => {
      setError(getErrorMessage(err, "Ocurrió un error al retirar fondos"));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (typeof amount !== "number" || amount <= 0) {
      setError("El monto debe ser mayor a 0");
      return;
    }

    if (!reason.trim()) {
      setError("La razón del retiro es requerida");
      return;
    }

    mutation.mutate();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setAmount("");
      setReason("");
      setError(null);
    }
  };

  const currencyLabel = currency === "BS" ? "Bs" : "USDT";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Retirar fondos ({currencyLabel})</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Monto a retirar ({currencyLabel})</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value ? parseFloat(e.target.value) : "")
              }
              placeholder="Ej: 100.00"
              required
            />
          </div>

          <div>
            <Label>Razón del retiro</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Pago de proveedor"
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending || !amount || !reason.trim()}
          >
            {mutation.isPending ? (
              <>
                <Spinner />
                Confirmar retiro
              </>
            ) : (
              "Confirmar retiro"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
