"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/shared/lib/errors";
import CreateClientStatusDialog from "./CreateClientStatusDialog";
import {
  fetchClientStatuses,
  updateClientStatus,
} from "@/features/subscriptions/services/subscriptions";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/shared/components/ui/card";
import { DataTable } from "@/shared/components/ui/data-table";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  columns,
  getDerivedStatus,
  STATUS_LABEL,
} from "@/features/subscriptions/components/table/columns";
import { differenceInDays } from "date-fns";
import { formatDate, formatNumericDate } from "@/shared/lib/date";
import { ClientStatus } from "@/features/subscriptions/types/clientStatus";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Search, X } from "lucide-react";
import ClientStatusList from "@/features/subscriptions/components/ClientStatusList";
import useIsMobile from "@/shared/hooks/useIsMobile";

type SearchField = {
  value: string;
  label: string;
  placeholder: string;
  getText: (row: ClientStatus) => string;
};

const SEARCH_FIELDS: SearchField[] = [
  {
    value: "clientName",
    label: "Cliente",
    placeholder: "Nombre del cliente",
    getText: (row) => row.client?.clientName ?? row.clientName ?? "",
  },
  {
    value: "phoneNumber",
    label: "Teléfono",
    placeholder: "Número de teléfono",
    getText: (row) => row.client?.phoneNumber ?? row.phoneNumber ?? "",
  },
  {
    value: "account",
    label: "Cuenta",
    placeholder: "Correo de la cuenta",
    getText: (row) => row.activeAccount?.email ?? "",
  },
  {
    value: "service",
    label: "Servicio",
    placeholder: "Nombre del servicio",
    getText: (row) => row.service?.serviceName ?? "",
  },
  {
    value: "profile",
    label: "Perfil",
    placeholder: "Nombre del perfil",
    getText: (row) => row.screen?.profileName ?? "",
  },
  {
    value: "status",
    label: "Estado de pago",
    placeholder: "Activo, expirado...",
    getText: (row) => STATUS_LABEL[getDerivedStatus(row)] ?? "",
  },
  {
    value: "purchaseDate",
    label: "Fecha de compra",
    placeholder: "dd/mm/aaaa o 10 de abril",
    getText: (row) =>
      `${formatNumericDate(row.purchaseDate)} ${formatDate(row.purchaseDate)}`,
  },
  {
    value: "expirationDate",
    label: "Fecha de vencimiento",
    placeholder: "dd/mm/aaaa o 10 de abril",
    getText: (row) =>
      `${formatNumericDate(row.expirationDate)} ${formatDate(row.expirationDate)}`,
  },
];

export default function ClientStatusTable() {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const {
    data: clientStatuses,
    isLoading,
    isError,
    error,
  } = useQuery<ClientStatus[]>({
    queryKey: ["clientStatuses"],
    queryFn: fetchClientStatuses,
  });

  React.useEffect(() => {
    if (!clientStatuses) return;

    const checkAndExpire = async () => {
      let hasUpdates = false;
      for (const client of clientStatuses) {
        if (client.status === "ACTIVE" && client.expirationDate) {
          const days = differenceInDays(
            new Date(client.expirationDate),
            new Date(),
          );
          if (days < 0) {
            try {
              await updateClientStatus(client.id, { status: "EXPIRED" });
              hasUpdates = true;
            } catch (e) {
              console.error("Failed to auto-expire client", client.id, e);
            }
          }
        }
      }
      if (hasUpdates) {
        queryClient.invalidateQueries({ queryKey: ["clientStatuses"] });
      }
    };

    checkAndExpire();
  }, [clientStatuses, queryClient]);

  const [searchField, setSearchField] = React.useState(SEARCH_FIELDS[0].value);
  const [searchTerm, setSearchTerm] = React.useState("");

  const activeField =
    SEARCH_FIELDS.find((field) => field.value === searchField) ??
    SEARCH_FIELDS[0];
  const normalizedTerm = searchTerm.trim().toLowerCase();

  const filteredStatuses = React.useMemo(() => {
    if (!clientStatuses) return [];
    if (!normalizedTerm) return clientStatuses;

    return clientStatuses.filter((row) =>
      activeField.getText(row).toLowerCase().includes(normalizedTerm),
    );
  }, [clientStatuses, activeField, normalizedTerm]);

  async function handleCreated() {
    await queryClient.invalidateQueries({ queryKey: ["clientStatuses"] });
  }

  return (
    <Card className="col-span-4 gap-0 py-0 pb-0! max-sm:col-span-1">
      <CardHeader className="gap-0 py-4 shadow-md max-sm:gap-0 max-sm:px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">Suscripciones</CardTitle>
          <CreateClientStatusDialog onCreated={handleCreated} />
        </div>
        <div className="mt-4 flex">
          <Select value={searchField} onValueChange={setSearchField}>
            <SelectTrigger className="w-30 rounded-r-none bg-zinc-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEARCH_FIELDS.map((field) => (
                <SelectItem key={field.value} value={field.value}>
                  {field.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative w-80 max-sm:w-full">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={activeField.placeholder}
              className="rounded-l-none border-l-0 px-9"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
              >
                <span className="sr-only">Limpiar búsqueda</span>
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        {isLoading && isMobile ? (
          <div className="divide-y border-t">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`client-list-skeleton-${index}`}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        ) : isLoading ? (
          <div className="space-y-2 px-4 py-3">
            <div className="grid grid-cols-8 gap-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton
                  key={`client-header-skeleton-${index}`}
                  className="h-8 w-full"
                />
              ))}
            </div>
            {Array.from({ length: 8 }).map((_, rowIndex) => (
              <div
                key={`client-row-skeleton-${rowIndex}`}
                className="grid grid-cols-8 gap-2"
              >
                {Array.from({ length: 8 }).map((_, cellIndex) => (
                  <Skeleton
                    key={`client-cell-skeleton-${rowIndex}-${cellIndex}`}
                    className="h-8 w-full"
                  />
                ))}
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-destructive">
            {getErrorMessage(error, "No se pudieron cargar las suscripciones")}
          </div>
        ) : isMobile ? (
          <ClientStatusList
            data={filteredStatuses}
            emptyMessage={
              normalizedTerm ? "No hay resultados para la búsqueda" : undefined
            }
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredStatuses}
            emptyMessage={
              normalizedTerm ? "No hay resultados para la búsqueda" : undefined
            }
            // getRowClassName={(row) => {
            //   if (row.status === "ACTIVE")
            //     return "bg-green-100 dark:bg-green-900/30";
            //   if (row.status === "EXPIRED")
            //     return "bg-red-100 dark:bg-red-900/30";
            //   return "";
            // }}
          />
        )}
      </CardContent>
    </Card>
  );
}
