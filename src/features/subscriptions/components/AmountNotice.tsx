import { TriangleAlert } from "lucide-react";
import { Spinner } from "@/shared/components/ui/spinner";

type AmountNoticeProps = {
  waitingForRate: boolean;
  customRate: boolean;
  zeroAmount: boolean;
  // What saving 0 Bs means in this flow
  zeroAmountMessage: string;
};

// Explains why the amount can't be saved yet, or warns before saving 0 Bs, so
// a missing rate or a too-high supplier price never records 0 Bs by accident
export default function AmountNotice({
  waitingForRate,
  customRate,
  zeroAmount,
  zeroAmountMessage,
}: AmountNoticeProps) {
  if (waitingForRate) {
    return (
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        {customRate ? (
          "Ingresa la tasa USDT manual para calcular el monto."
        ) : (
          <>
            <Spinner />
            Esperando la tasa de Binance para calcular el monto…
          </>
        )}
      </p>
    );
  }

  if (!zeroAmount) return null;

  return (
    <div className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
      <p>
        <span className="font-semibold">El monto neto es 0 Bs.</span>{" "}
        {zeroAmountMessage}
      </p>
    </div>
  );
}
