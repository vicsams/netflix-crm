"use client";

import { ColumnDef } from "@tanstack/react-table";
import type {
  ClientStatus,
  SubscriptionDates,
} from "@/features/subscriptions/types/clientStatus";
import ClientStatusActions from "@/features/subscriptions/components/ClientStatusActions";
import { differenceInDays } from "date-fns";
import { formatDate, formatShortDate } from "@/shared/lib/date";
import { formatPin } from "@/shared/lib/pin";
import { getDerivedStatus } from "@/features/subscriptions/lib/status";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

export const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Activo",
  EXPIRED: "Expirado",
  NEAR_EXPIRATION: "Cerca de expirar",
};

export function formatAmount(amount?: number | null) {
  return amount != null ? `${(amount / 100).toFixed(2)} Bs` : "-";
}

export function getRemainingDaysLabel(row: ClientStatus) {
  if (row.status === "EXPIRED") return "Expirado";
  if (row.status === "NEAR_EXPIRATION") return "Cerca de expirar";
  if (!row.expirationDate) return "-";

  const days = differenceInDays(new Date(row.expirationDate), new Date()) + 1;
  return days >= 0 ? pluralDays(days) : "Expirado";
}

// When it expires (or expired), short enough for a mobile details line:
// "vence 6 nov 2026 · 14 días", "vence hoy", "venció 19 oct 2026"
export function getExpiryDetail(row: SubscriptionDates) {
  if (!row.expirationDate) return null;

  const date = formatShortDate(row.expirationDate);
  if (getDerivedStatus(row) === "EXPIRED") return `venció ${date}`;

  // Same count as the "Días restantes" column
  const remaining =
    differenceInDays(new Date(row.expirationDate), new Date()) + 1;
  if (remaining <= 0) return "vence hoy";
  return `vence ${date} · ${pluralDays(remaining)}`;
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

function pluralDays(days: number) {
  return days === 1 ? "1 día" : `${days} días`;
}

// Extra detail for the badge tooltip: whatever the badge itself does not show
function getStatusHint(
  row: SubscriptionDates,
  status: ReturnType<typeof getDerivedStatus>,
) {
  if (!row.expirationDate) return null;

  const expiration = new Date(row.expirationDate);
  // Same count as the "Días restantes" column
  const remaining = differenceInDays(expiration, new Date()) + 1;

  if (status === "ACTIVE") {
    return `Vence el ${formatDate(row.expirationDate)} · ${pluralDays(remaining)} restantes`;
  }

  if (status === "NEAR_EXPIRATION") {
    if (remaining <= 0) return "Vence hoy";
    if (remaining === 1) return "Vence mañana";
    return `Vence en ${pluralDays(remaining)}`;
  }

  const elapsed = differenceInDays(new Date(), expiration);
  // Marked expired by hand before its date: nothing accurate to add
  if (elapsed < 0) return null;
  if (elapsed === 0) return "Venció hoy";
  if (elapsed === 1) return "Venció ayer";
  return `Venció hace ${pluralDays(elapsed)}`;
}

const STATUS_STYLE: Record<string, { badge: string; dot: string }> = {
  ACTIVE: {
    badge: "border-green-200 bg-green-50 text-green-800",
    dot: "bg-green-500",
  },
  EXPIRED: {
    badge: "border-red-200 bg-red-50 text-red-800",
    dot: "bg-red-500",
  },
  NEAR_EXPIRATION: {
    badge: "border-yellow-200 bg-yellow-50 text-yellow-800",
    dot: "bg-yellow-500",
  },
};

export function StatusBadge({
  row,
  className,
  compact = false,
}: {
  row: SubscriptionDates;
  className?: string;
  // Dot and status only, for tight layouts that show the date elsewhere
  compact?: boolean;
}) {
  const status = getDerivedStatus(row);
  const label = STATUS_LABEL[status] ?? status;
  const style = STATUS_STYLE[status];

  if (!style)
    return (
      <Badge variant="secondary" className={className}>
        {label}
      </Badge>
    );

  const detail = compact
    ? null
    : status === "ACTIVE" && row.purchaseDate
      ? `Desde ${formatDate(row.purchaseDate)}`
      : status === "EXPIRED" && row.expirationDate
        ? `Desde ${formatDate(row.expirationDate)}`
        : status === "NEAR_EXPIRATION" && row.expirationDate
          ? `el ${formatDate(row.expirationDate)}`
          : null;

  const badge = (
    <Badge className={cn("gap-1.5 px-2.5 py-1", style.badge, className)}>
      <span className={cn("size-1.5 shrink-0 rounded-full", style.dot)} />
      <span className="font-semibold">{label}</span>
      {detail && (
        <>
          <span className="h-3 w-px bg-current opacity-25" />
          <span className="truncate font-normal opacity-75">{detail}</span>
        </>
      )}
    </Badge>
  );

  const hint = getStatusHint(row, status);
  if (!hint) return badge;

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  );
}

export const columns: ColumnDef<ClientStatus>[] = [
  {
    id: "client",
    header: () => <div className="w-64">Cliente</div>,
    cell: ({ row }) => (
      <div className="flex w-full items-center justify-between gap-4">
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
          {/* Fixed width so badges line up across rows; w-80 fits the longest
              content, "Cerca de expirar | el 28 de Septiembre de 2026" (~302px) */}
          <StatusBadge row={row.original} className="w-80 justify-start" />
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
    header: "Perfil",
    meta: { className: "w-px" },
    accessorFn: (row) => row.screen?.profileName ?? "-",
  },
  {
    id: "profilePIN",
    header: "PIN",
    meta: { className: "w-px" },
    accessorFn: (row) => formatPin(row.screen?.profilePIN),
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
    header: "Días restantes",
    meta: { className: "w-px" },
    cell: ({ row }) => getRemainingDaysLabel(row.original),
  },
  {
    accessorKey: "amount",
    header: "Monto",
    meta: { className: "w-px" },
    cell: ({ row }) => formatAmount(row.original.amount),
  },
];
