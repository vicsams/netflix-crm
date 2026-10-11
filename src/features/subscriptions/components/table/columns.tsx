"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ClientStatus } from "@/features/subscriptions/types/clientStatus";
import ClientStatusActions from "@/features/subscriptions/components/ClientStatusActions";
import { differenceInDays, format } from "date-fns";
import { Badge } from "@/shared/components/ui/badge";

export const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Activo",
  EXPIRED: "Expirado",
  NEAR_EXPIRATION: "Cerca de expirar",
};

export function getDerivedStatus(
  row: ClientStatus,
): "ACTIVE" | "EXPIRED" | "NEAR_EXPIRATION" {
  const currentStatus = row.status as "ACTIVE" | "EXPIRED" | "NEAR_EXPIRATION";

  if (currentStatus === "EXPIRED") return "EXPIRED";

  if (!row.expirationDate)
    return currentStatus === "NEAR_EXPIRATION" ? "NEAR_EXPIRATION" : "ACTIVE";

  const days = differenceInDays(new Date(row.expirationDate), new Date()) + 1;

  if (days < 0) return "EXPIRED";
  if (days <= 3) return "NEAR_EXPIRATION";

  return "ACTIVE";
}

export function formatDate(value?: string | null) {
  return value ? format(new Date(value), "dd/MM/yyyy") : "-";
}

export function formatAmount(amount?: number | null) {
  return amount != null ? `${(amount / 100).toFixed(2)} Bs` : "-";
}

export function getRemainingDaysLabel(row: ClientStatus) {
  if (row.status === "EXPIRED") return "Expirado";
  if (row.status === "NEAR_EXPIRATION") return "Cerca de expirar";
  if (!row.expirationDate) return "-";

  const days = differenceInDays(new Date(row.expirationDate), new Date()) + 1;
  return days >= 0 ? `${days} días` : "Expirado";
}

export function ServiceBadge({ row }: { row: ClientStatus }) {
  const service = row.service;

  if (!service) {
    return <Badge variant="secondary">{row.serviceId}</Badge>;
  }

  return (
    <Badge
      className="font-bold"
      style={{
        color: service.textColor ?? "#111827",
        backgroundColor: service.backgroundColor ?? "#f3f4f6",
      }}
    >
      {service.serviceName}
    </Badge>
  );
}

export function StatusBadge({ row }: { row: ClientStatus }) {
  const status = getDerivedStatus(row);
  const label = STATUS_LABEL[status] ?? status;

  if (status === "ACTIVE") {
    return <Badge className="bg-green-200 text-green-700">{label}</Badge>;
  }

  if (status === "EXPIRED") {
    return <Badge className="bg-red-200 text-red-700">{label}</Badge>;
  }

  if (status === "NEAR_EXPIRATION") {
    return <Badge className="bg-yellow-200 text-yellow-700">{label}</Badge>;
  }

  return <Badge variant="secondary">{label}</Badge>;
}

export const columns: ColumnDef<ClientStatus>[] = [
  {
    id: "client",
    header: () => <div className="w-64">Cliente</div>,
    cell: ({ row }) => (
      <div className="flex w-64 items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate font-medium">
            {row.original.client?.clientName ?? row.original.clientName ?? "-"}
          </span>
          <span className="text-muted-foreground text-xs">
            {row.original.client?.phoneNumber ??
              row.original.phoneNumber ??
              "-"}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <StatusBadge row={row.original} />
          <ClientStatusActions clientStatus={row.original} />
        </div>
      </div>
    ),
  },
  {
    id: "activeAccount",
    header: () => <div className="w-40">Cuenta activa</div>,
    accessorFn: (row) => row.activeAccount?.email ?? row.activeAccountId,
  },
  {
    id: "service",
    header: () => <div className="w-40">Servicio</div>,
    cell: ({ row }) => <ServiceBadge row={row.original} />,
  },
  {
    id: "profileName",
    header: () => <div className="w-40">Perfil</div>,
    accessorFn: (row) => row.screen?.profileName ?? "-",
  },
  {
    id: "profilePIN",
    header: () => <div className="w-40">PIN</div>,
    accessorFn: (row) => row.screen?.profilePIN ?? "-",
  },
  {
    id: "purchaseDate",
    header: () => <div className="w-32">Fecha de compra</div>,
    cell: ({ row }) => formatDate(row.original.purchaseDate),
  },
  {
    id: "expirationDateValue",
    header: () => <div className="w-36">Fecha de vencimiento</div>,
    cell: ({ row }) => formatDate(row.original.expirationDate),
  },
  {
    accessorKey: "expirationDate",
    header: () => <div className="w-40">Días restantes</div>,
    cell: ({ row }) => getRemainingDaysLabel(row.original),
  },
  {
    accessorKey: "amount",
    header: "Monto",
    cell: ({ row }) => formatAmount(row.original.amount),
  },
];
