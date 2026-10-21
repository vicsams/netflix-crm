"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Download, Search, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { DataTable } from "@/shared/components/ui/data-table";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import useIsMobile from "@/shared/hooks/useIsMobile";
import { getErrorMessage } from "@/shared/lib/errors";
import { fetchServices } from "@/features/streaming-services/services/service-management/services";
import type { ServiceProps } from "@/features/streaming-services/types/service";
import SalesList from "@/features/sales/components/SalesList";
import {
  salesColumns,
  type ServiceColors,
} from "@/features/sales/components/table/columns";
import {
  currentMonth,
  monthLabel,
  shiftMonth,
} from "@/features/sales/lib/month";
import {
  bs,
  downloadCsv,
  salesCsv,
  totalsOf,
  usdt,
} from "@/features/sales/lib/sales";
import { fetchSales } from "@/features/sales/services/sales";

const ALL_SERVICES = "ALL";

function Tile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="bg-muted flex flex-col gap-0.5 rounded-lg px-4 py-3">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-lg font-bold">{value}</span>
      {detail && (
        <span className="text-muted-foreground text-xs">{detail}</span>
      )}
    </div>
  );
}

export default function SalesSection() {
  const isMobile = useIsMobile();
  const thisMonth = currentMonth();
  const [month, setMonth] = useState(thisMonth);
  const [service, setService] = useState(ALL_SERVICES);
  const [searchTerm, setSearchTerm] = useState("");

  const sales = useQuery({
    queryKey: ["sales", month],
    queryFn: () => fetchSales(month),
  });

  const services = useQuery<ServiceProps[]>({
    queryKey: ["services"],
    queryFn: fetchServices,
  });

  // Current colors by name: sales keep only the name of their service
  const colors = useMemo<ServiceColors>(
    () =>
      new Map(
        (services.data ?? []).map((s) => [
          s.serviceName.toLowerCase(),
          { textColor: s.textColor, backgroundColor: s.backgroundColor },
        ]),
      ),
    [services.data],
  );

  const columns = useMemo(() => salesColumns(colors), [colors]);

  const rows = useMemo(() => sales.data?.rows ?? [], [sales.data]);

  const serviceNames = useMemo(
    () =>
      [...new Set(rows.map((row) => row.serviceName))].sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    [rows],
  );

  // A service picked in another month may not be in this one's list
  const activeService = serviceNames.includes(service) ? service : ALL_SERVICES;
  const normalizedTerm = searchTerm.trim().toLowerCase();

  const filteredRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          (activeService === ALL_SERVICES ||
            row.serviceName === activeService) &&
          (!normalizedTerm ||
            row.clientName.toLowerCase().includes(normalizedTerm)),
      ),
    [rows, activeService, normalizedTerm],
  );

  const totals = useMemo(() => totalsOf(filteredRows), [filteredRows]);
  const filtered = activeService !== ALL_SERVICES || !!normalizedTerm;
  const emptyMessage = filtered
    ? "No hay ventas para los filtros seleccionados"
    : `Sin ventas en ${monthLabel(month, false)}`;

  function exportCsv() {
    downloadCsv(`ventas-${month}.csv`, salesCsv(filteredRows));
  }

  return (
    <Card className="col-span-4 gap-0 py-0 pb-0! max-sm:col-span-1">
      <CardHeader className="gap-0 py-4 shadow-md max-sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg font-bold">Ventas</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Mes anterior"
              onClick={() => setMonth(shiftMonth(month, -1))}
            >
              <ChevronLeft />
            </Button>
            <span className="w-32 text-center text-sm font-medium">
              {monthLabel(month)}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Mes siguiente"
              disabled={month >= thisMonth}
              onClick={() => setMonth(shiftMonth(month, 1))}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-3 max-lg:grid-cols-2">
          {sales.isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={`sales-tile-skeleton-${index}`}
                className="h-19 w-full rounded-lg"
              />
            ))
          ) : (
            <>
              <Tile
                label="Ventas"
                value={bs(totals.grossBs)}
                detail={usdt(totals.grossUsdt)}
              />
              <Tile label="Costo proveedor" value={bs(totals.supplierBs)} />
              <Tile
                label="Ganancia"
                value={bs(totals.netBs)}
                detail={usdt(totals.netUsdt)}
              />
              <Tile label="Número de ventas" value={String(totals.count)} />
            </>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Select value={activeService} onValueChange={setService}>
            <SelectTrigger
              aria-label="Filtrar por servicio"
              className="w-44 max-sm:flex-1"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_SERVICES}>Todos los servicios</SelectItem>
              {serviceNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative w-72 max-sm:order-last max-sm:w-full">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente"
              className="px-9"
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
          <Button
            type="button"
            variant="outline"
            className="ml-auto max-sm:ml-0"
            disabled={filteredRows.length === 0}
            onClick={exportCsv}
          >
            <Download />
            Exportar CSV
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-0">
        {sales.isLoading ? (
          <div className="divide-y border-t">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`sales-row-skeleton-${index}`}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        ) : sales.isError ? (
          <div className="text-destructive border-t px-6 py-4">
            {getErrorMessage(sales.error, "No se pudieron cargar las ventas")}
          </div>
        ) : isMobile ? (
          <SalesList
            data={filteredRows}
            colors={colors}
            emptyMessage={emptyMessage}
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredRows}
            emptyMessage={emptyMessage}
            getRowClassName={(row) =>
              row.voidedAt
                ? "text-muted-foreground [&>td:not(:last-child)]:line-through [&>td:not(:last-child)]:opacity-60"
                : ""
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
