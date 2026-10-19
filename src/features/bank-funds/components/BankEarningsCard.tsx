"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBankEarnings } from "@/features/bank-funds/services/bankEarnings";
import { formatMoney } from "@/shared/lib/money";
import { Separator } from "@/shared/components/ui/separator";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { ChevronDown, ArrowDownToLine, RefreshCw } from "lucide-react";
import ConvertCurrencyDialog from "./ConvertCurrencyDialog";
import WithdrawFundsDialog from "./WithdrawFundsDialog";
import useIsMobile from "@/shared/hooks/useIsMobile";

export default function BankEarningsCard() {
  const [openConvertDialog, setOpenConvertDialog] = useState(false);
  const [openWithdrawBsDialog, setOpenWithdrawBsDialog] = useState(false);
  const [openWithdrawUsdtDialog, setOpenWithdrawUsdtDialog] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["bankEarnings"],
    queryFn: fetchBankEarnings,
  });

  const totalBs = data ? data.total / 100 : 0;
  const totalUsdt = data?.totalUsdt ? data.totalUsdt / 100 : 0;
  const isMobile = useIsMobile();

  return (
    <div className="col-span-2">
      {isMobile ? (
        <div className="from-lumina-purple to-lumina-crimson text-lumina-cream col-span-2 flex h-fit flex-col items-start justify-between gap-1 rounded-xl bg-linear-to-br p-4 shadow-md">
          <ConvertCurrencyDialog
            open={openConvertDialog}
            onOpenChange={setOpenConvertDialog}
          />
          <WithdrawFundsDialog
            open={openWithdrawBsDialog}
            onOpenChange={setOpenWithdrawBsDialog}
            currency="BS"
          />
          <WithdrawFundsDialog
            open={openWithdrawUsdtDialog}
            onOpenChange={setOpenWithdrawUsdtDialog}
            currency="USDT"
          />
          <div className="flex h-full w-full flex-col justify-between gap-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-normal">
                Dinero acumulado en banco (Bs)
              </h2>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-lumina-cream/15 text-lumina-cream hover:bg-lumina-cream/25 hover:text-lumina-cream h-8 border-none px-2 text-xs"
                  >
                    Acciones <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setOpenConvertDialog(true)}>
                    <RefreshCw className="h-4 w-4" />
                    <span>Convertir a USDT</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setOpenWithdrawBsDialog(true)}
                  >
                    <ArrowDownToLine className="h-4 w-4" />
                    <span>Retirar fondos</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {isLoading ? (
              <Skeleton className="bg-lumina-cream/20 h-8 w-28" />
            ) : (
              <div className="flex items-end justify-between">
                <p className="text-xl font-bold">{formatMoney(totalBs)} Bs</p>
              </div>
            )}
          </div>
          <Separator className="bg-lumina-cream/20 my-2" />
          <div className="flex h-full w-full flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-normal">
                Dinero acumulado en Binance (USDT)
              </h2>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-lumina-cream/15 text-lumina-cream hover:bg-lumina-cream/25 hover:text-lumina-cream h-8 border-none px-2 text-xs"
                  >
                    Acciones <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setOpenWithdrawUsdtDialog(true)}
                  >
                    <ArrowDownToLine className="h-4 w-4" />
                    <span>Retirar fondos</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {isLoading ? (
              <Skeleton className="bg-lumina-cream/20 h-8 w-28" />
            ) : (
              <div className="flex items-end justify-between">
                <p className="text-lumina-cream text-xl font-bold">
                  {formatMoney(totalUsdt)} USDT
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <ConvertCurrencyDialog
            open={openConvertDialog}
            onOpenChange={setOpenConvertDialog}
          />
          <WithdrawFundsDialog
            open={openWithdrawBsDialog}
            onOpenChange={setOpenWithdrawBsDialog}
            currency="BS"
          />
          <WithdrawFundsDialog
            open={openWithdrawUsdtDialog}
            onOpenChange={setOpenWithdrawUsdtDialog}
            currency="USDT"
          />

          <div className="from-lumina-purple to-lumina-crimson text-lumina-cream col-span-2 flex h-30 items-start justify-between gap-1 rounded-xl bg-linear-to-br p-4 shadow-md">
            <div className="flex h-full w-1/2 flex-col justify-between gap-4">
              <h2 className="text-sm font-normal">
                Dinero acumulado en banco (Bs)
              </h2>
              {isLoading ? (
                <Skeleton className="bg-lumina-cream/20 h-8 w-28" />
              ) : (
                <div className="flex items-end justify-between">
                  <p className="text-xl font-bold">{formatMoney(totalBs)} Bs</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="bg-lumina-cream/15 text-lumina-cream hover:bg-lumina-cream/25 hover:text-lumina-cream h-8 border-none px-2 text-xs"
                      >
                        Acciones <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setOpenConvertDialog(true)}
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span>Convertir a USDT</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setOpenWithdrawBsDialog(true)}
                      >
                        <ArrowDownToLine className="h-4 w-4" />
                        <span>Retirar fondos</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
            <Separator
              orientation="vertical"
              className="bg-lumina-cream/20 mx-4"
            />
            <div className="flex h-full w-1/2 flex-col justify-between gap-4">
              <h2 className="text-sm font-normal">
                Dinero acumulado en Binance (USDT)
              </h2>
              {isLoading ? (
                <Skeleton className="bg-lumina-cream/20 h-8 w-28" />
              ) : (
                <div className="flex items-end justify-between">
                  <p className="text-lumina-cream text-xl font-bold">
                    {formatMoney(totalUsdt)} USDT
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="bg-lumina-cream/15 text-lumina-cream hover:bg-lumina-cream/25 hover:text-lumina-cream h-8 border-none px-2 text-xs"
                      >
                        Acciones <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setOpenWithdrawUsdtDialog(true)}
                      >
                        <ArrowDownToLine className="h-4 w-4" />
                        <span>Retirar fondos</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
