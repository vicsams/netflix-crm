"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { refreshAfterChange } from "@/shared/lib/refresh";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/lib/errors";
import { formatMoney } from "@/shared/lib/money";
import {
  fetchBankEarnings,
  withdrawFunds,
  type WithdrawCurrency,
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
  // Money moves only after a second, explicit confirmation of the summary
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: bank } = useQuery({
    queryKey: ["bankEarnings"],
    queryFn: fetchBankEarnings,
    enabled: open,
  });
  const available = bank
    ? (currency === "BS" ? bank.total : bank.totalUsdt) / 100
    : null;

  const resetForm = () => {
    setAmount("");
    setReason("");
    setReviewing(false);
    setError(null);
  };

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
      refreshAfterChange(queryClient, "bank");
      onOpenChange(false);
      resetForm();
    },
    onError: (err: unknown) => {
      setError(getErrorMessage(err, "Ocurrió un error al retirar fondos"));
      setReviewing(false);
    },
  });

  const exceedsBalance =
    typeof amount === "number" &&
    available !== null &&
    Math.round(amount * 100) > Math.round(available * 100);

  const canReview =
    typeof amount === "number" &&
    amount > 0 &&
    !!reason.trim() &&
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

  const currencyLabel = currency === "BS" ? "Bs" : "USDT";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Retirar fondos ({currencyLabel})</DialogTitle>
          <DialogDescription>
            Disponible:{" "}
            <span className="text-foreground font-semibold">
              {available === null
                ? "…"
                : `${formatMoney(available)} ${currencyLabel}`}
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {reviewing ? (
            <div className="bg-muted space-y-2 rounded-md p-4 text-sm">
              <p className="font-semibold">Revisa el retiro</p>
              <div className="flex justify-between font-semibold">
                <span>Monto a retirar</span>
                <span>
                  {formatMoney(Number(amount))} {currencyLabel}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground shrink-0">Motivo</span>
                <span className="text-right break-words">{reason.trim()}</span>
              </div>
              {available !== null && (
                <div className="text-muted-foreground flex justify-between">
                  <span>Te quedarán</span>
                  <span>
                    {formatMoney(available - Number(amount))} {currencyLabel}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor={`withdraw-amount-${currency}`}>
                    Monto a retirar ({currencyLabel})
                  </Label>
                  {available !== null && available > 0 && (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => setAmount(available)}
                    >
                      Máx
                    </Button>
                  )}
                </div>
                <Input
                  id={`withdraw-amount-${currency}`}
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
                {exceedsBalance && (
                  <p className="text-destructive mt-1 text-sm">
                    El monto supera tu saldo disponible.
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor={`withdraw-reason-${currency}`}>
                  Razón del retiro
                </Label>
                <Textarea
                  id={`withdraw-reason-${currency}`}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Pago de proveedor"
                  required
                />
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
                  Retirando
                </>
              ) : reviewing ? (
                "Confirmar retiro"
              ) : (
                "Revisar retiro"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
