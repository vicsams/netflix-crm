"use client";

import { useQuery } from "@tanstack/react-query";
import { getErrorMessage } from "@/shared/lib/errors";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { DataTable } from "@/shared/components/ui/data-table";
import { Skeleton } from "@/shared/components/ui/skeleton";
import CreateClientDialog from "@/features/clients/components/CreateClientDialog";
import { columns } from "@/features/clients/components/table/columns";
import { fetchClients } from "@/features/clients/services/clients";
import { Client } from "@/features/clients/types/client";

export default function ClientsTable() {
  const { data, isLoading, isError, error } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  return (
    <Card className="gap-0 py-0 pb-0!">
      <CardHeader className="gap-0 py-4 shadow-md max-sm:gap-0 max-sm:px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">Clientes</CardTitle>
          <CreateClientDialog />
        </div>
      </CardHeader>
      <CardContent className="px-0">
        {isLoading ? (
          <div className="space-y-2 px-4 py-3">
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton
                  key={`clients-header-${index}`}
                  className="h-8 w-full"
                />
              ))}
            </div>
            {Array.from({ length: 8 }).map((_, rowIndex) => (
              <div
                key={`clients-row-${rowIndex}`}
                className="grid grid-cols-4 gap-2"
              >
                {Array.from({ length: 4 }).map((_, cellIndex) => (
                  <Skeleton
                    key={`clients-cell-${rowIndex}-${cellIndex}`}
                    className="h-8 w-full"
                  />
                ))}
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-destructive px-4 py-3">
            {getErrorMessage(error, "No se pudieron cargar los clientes")}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={data ?? []}
            emptyMessage="No se encontraron clientes"
          />
        )}
      </CardContent>
    </Card>
  );
}
