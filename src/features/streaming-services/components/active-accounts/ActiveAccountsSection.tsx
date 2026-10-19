"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getErrorMessage } from "@/shared/lib/errors";
import CreateAccountDialog from "./CreateAccountDialog";
import { fetchActiveAccount } from "@/features/streaming-services/services/active-accounts/activeAccount";
import type { ActiveAccountProps } from "@/features/streaming-services/types/activeAccount";
import { ChevronDown } from "lucide-react";
import { Skeleton } from "@/shared/components/ui/skeleton";
import useIsMobile from "@/shared/hooks/useIsMobile";
import ActiveAccountCard from "@/features/streaming-services/components/active-accounts/ActiveAccountCard";

export default function ActiveAccountsSection() {
  const [accountIsOpen, setAccountIsOpen] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(false);
  const isMobile = useIsMobile();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["activeAccounts"],
    queryFn: fetchActiveAccount,
  });

  const handleAccountClick = () => {
    setAccountIsOpen(!accountIsOpen);
  };

  useEffect(() => {
    if (isLoading || !data || data.length === 0) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      setCardsVisible(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [isLoading, data]);

  return (
    <div
      className={`bg-card col-span-2 flex max-h-91 flex-col overflow-y-scroll rounded-xl border shadow-md transition-all duration-300 ease-in-out ${accountIsOpen ? "max-sm:max-h-94" : "max-sm:max-h-17 max-sm:overflow-y-hidden"}`}
    >
      <div
        onClick={handleAccountClick}
        className="bg-card sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 p-4"
      >
        <div className="flex items-center gap-1">
          <h2 className="text-lg font-bold">Correos Activos</h2>
          {isMobile && (
            <ChevronDown
              className={`h-5 w-5 transition-transform duration-300 ${
                accountIsOpen ? "rotate-180" : ""
              }`}
            />
          )}
        </div>
        <div></div>
        <div onClick={(e) => e.stopPropagation()}>
          <CreateAccountDialog />
        </div>
      </div>

      <div>
        {isLoading && (
          <div className="grid grid-cols-2 gap-4 max-xl:grid-cols-1">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`account-skeleton-${index}`}
                className="bg-card rounded-xl border p-4"
              >
                <Skeleton className="mb-3 h-6 w-1/2" />
                <Skeleton className="mb-2 h-4 w-3/4" />
                <Skeleton className="mb-2 h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        )}
        {isError && (
          <div className="text-destructive">
            {getErrorMessage(error, "No se pudieron cargar las cuentas")}
          </div>
        )}

        {!isLoading && !isError && (!data || data.length === 0) && (
          <div className="text-muted-foreground flex h-20 items-center justify-center text-sm">
            No se encontraron cuentas activas
          </div>
        )}

        {!isLoading && !isError && data && data.length > 0 && (
          <div
            className={`grid grid-cols-2 gap-4 px-4 pb-4 transition-all duration-300 ease-in-out max-xl:grid-cols-1 ${accountIsOpen ? "" : "transition-discrete max-sm:hidden max-sm:opacity-0"}`}
          >
            {data.map((activeAccount: ActiveAccountProps) => (
              <div
                key={activeAccount.id}
                className={`transition-all duration-500 ease-out ${cardsVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
              >
                <ActiveAccountCard activeAccount={activeAccount} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
