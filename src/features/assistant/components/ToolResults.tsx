"use client";

import { useState, type ReactNode } from "react";
import type { InferToolOutput } from "ai";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";
import { StatusBadge } from "@/features/subscriptions/components/table/columns";
import { formatShortDate } from "@/shared/lib/date";
import { formatMoney } from "@/shared/lib/money";
// Type-only: the tools run on the server
import type { AssistantTools } from "@/features/assistant/server/tools";

type Output<NAME extends keyof AssistantTools> = InferToolOutput<
  AssistantTools[NAME]
>;

// Rows shown before "Ver todos"
const COLLAPSED_ROWS = 10;

function shortDate(value: string | null) {
  return value ? formatShortDate(value) : "-";
}

// The frame around every result: count, the rows (collapsed past 10), and a
// note when the tool returned fewer rows than it matched
function ResultFrame<ROW>({
  title,
  total,
  rows,
  header,
  renderRow,
  empty,
}: {
  title: string;
  total: number;
  rows: ROW[];
  header: ReactNode;
  renderRow: (row: ROW) => ReactNode;
  empty?: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? rows : rows.slice(0, COLLAPSED_ROWS);

  return (
    <div className="bg-background w-full overflow-hidden rounded-lg border">
      <div className="text-muted-foreground flex items-center justify-between gap-2 border-b px-3 py-2 text-xs">
        <span className="text-foreground font-medium">{title}</span>
        <span>
          {total === 1 ? "1 resultado" : `${total} resultados`}
          {rows.length < total && ` · mostrando ${rows.length}`}
        </span>
      </div>
      {rows.length === 0 ? (
        <div className="text-muted-foreground px-3 py-4 text-center text-sm">
          {empty ?? "Sin resultados"}
        </div>
      ) : (
        <>
          <Table className="text-xs">
            <TableHeader>
              <TableRow>{header}</TableRow>
            </TableHeader>
            <TableBody>{visible.map(renderRow)}</TableBody>
          </Table>
          {rows.length > COLLAPSED_ROWS && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full rounded-none border-t text-xs"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? "Ver menos" : `Ver todos (${rows.length})`}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

function ServicesHint({ names }: { names?: string[] }) {
  if (!names?.length) return null;
  return <>Servicios disponibles: {names.join(", ")}</>;
}

function SubscriptionsResult({
  output,
}: {
  output: Output<"buscarSuscripciones">;
}) {
  return (
    <ResultFrame
      title="Suscripciones"
      total={output.total}
      rows={output.rows}
      empty={<ServicesHint names={output.availableServices} />}
      header={
        <>
          <TableHead>Cliente</TableHead>
          <TableHead>Servicio</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Vence</TableHead>
          <TableHead className="text-right">Monto</TableHead>
        </>
      }
      renderRow={(row) => (
        <TableRow key={row.id}>
          <TableCell>
            <div className="font-medium">{row.clientName}</div>
            <div className="text-muted-foreground">{row.phoneNumber}</div>
          </TableCell>
          <TableCell>
            <div>{row.serviceName}</div>
            <div className="text-muted-foreground">
              {row.profileName} · {row.accountEmail}
            </div>
          </TableCell>
          <TableCell>
            <StatusBadge row={row} compact />
          </TableCell>
          <TableCell>{shortDate(row.expirationDate)}</TableCell>
          <TableCell className="text-right">
            {row.amountBs === null ? "-" : `${formatMoney(row.amountBs)} Bs`}
          </TableCell>
        </TableRow>
      )}
    />
  );
}

function ClientsResult({ output }: { output: Output<"listarClientes"> }) {
  return (
    <ResultFrame
      title="Clientes"
      total={output.total}
      rows={output.rows}
      header={
        <>
          <TableHead>Cliente</TableHead>
          <TableHead>Suscripciones</TableHead>
          <TableHead>Servicios</TableHead>
        </>
      }
      renderRow={(row) => (
        <TableRow key={row.id}>
          <TableCell>
            <div className="font-medium">{row.clientName}</div>
            <div className="text-muted-foreground">{row.phoneNumber}</div>
          </TableCell>
          <TableCell>
            {row.activeCount} vigentes / {row.subscriptionCount}
          </TableCell>
          <TableCell className="whitespace-normal">
            {row.services.join(", ") || "-"}
          </TableCell>
        </TableRow>
      )}
    />
  );
}

function AccountsResult({ output }: { output: Output<"listarCuentas"> }) {
  return (
    <ResultFrame
      title="Cuentas"
      total={output.total}
      rows={output.rows}
      empty={<ServicesHint names={output.availableServices} />}
      header={
        <>
          <TableHead>Cuenta</TableHead>
          <TableHead>Vence</TableHead>
          <TableHead>Pantallas</TableHead>
        </>
      }
      renderRow={(row) => (
        <TableRow key={row.id}>
          <TableCell>
            <div className="font-medium">{row.email}</div>
            <div className="text-muted-foreground">
              {row.serviceName ?? "Sin servicio"}
            </div>
          </TableCell>
          <TableCell>{shortDate(row.expirationDate)}</TableCell>
          <TableCell className="whitespace-normal">
            <div>
              {row.screensFree} libres de {row.screensTotal}
            </div>
            {row.freeProfiles.length > 0 && (
              <div className="text-muted-foreground">
                {row.freeProfiles.join(", ")}
              </div>
            )}
          </TableCell>
        </TableRow>
      )}
    />
  );
}

function ServicesResult({ output }: { output: Output<"listarServicios"> }) {
  return (
    <ResultFrame
      title="Servicios"
      total={output.total}
      rows={output.rows}
      header={
        <>
          <TableHead>Servicio</TableHead>
          <TableHead>Precio</TableHead>
          <TableHead>Cuentas</TableHead>
          <TableHead>Vigentes</TableHead>
        </>
      }
      renderRow={(row) => (
        <TableRow key={row.id}>
          <TableCell className="font-medium">{row.serviceName}</TableCell>
          <TableCell>
            {formatMoney(row.price)} {row.currency}
          </TableCell>
          <TableCell>{row.accounts}</TableCell>
          <TableCell>{row.activeSubscriptions}</TableCell>
        </TableRow>
      )}
    />
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border px-3 py-2">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function EarningsResult({ output }: { output: Output<"resumenGanancias"> }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2 max-sm:grid-cols-1">
        <Stat label="Banco" value={`${formatMoney(output.bankBs)} Bs`} />
        <Stat label="Binance" value={`${formatMoney(output.bankUsdt)} USDT`} />
        <Stat
          label={`Ventas ${shortDate(output.desde)} – ${shortDate(output.hasta)}`}
          value={`${formatMoney(output.salesBs)} Bs (${output.salesCount})`}
        />
      </div>
      <ResultFrame
        title="Ventas por servicio"
        total={output.byService.length}
        rows={output.byService}
        header={
          <>
            <TableHead>Servicio</TableHead>
            <TableHead>Ventas</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </>
        }
        renderRow={(row) => (
          <TableRow key={row.serviceName}>
            <TableCell className="font-medium">{row.serviceName}</TableCell>
            <TableCell>{row.count}</TableCell>
            <TableCell className="text-right">
              {formatMoney(row.totalBs)} Bs
            </TableCell>
          </TableRow>
        )}
      />
    </div>
  );
}

function WithdrawalsResult({ output }: { output: Output<"listarRetiros"> }) {
  const currencyLabel = (currency: string) =>
    currency === "BS" ? "Bs" : currency;

  return (
    <div className="space-y-2">
      {output.totalsByCurrency.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {output.totalsByCurrency.map((total) => (
            <Stat
              key={total.currency}
              label={`Retirado en ${currencyLabel(total.currency)} (${total.count})`}
              value={`${formatMoney(total.amount)} ${currencyLabel(total.currency)}`}
            />
          ))}
        </div>
      )}
      <ResultFrame
        title={`Retiros ${shortDate(output.desde)} – ${shortDate(output.hasta)}`}
        total={output.total}
        rows={output.rows}
        header={
          <>
            <TableHead>Fecha</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Motivo</TableHead>
          </>
        }
        renderRow={(row) => (
          <TableRow key={row.id}>
            <TableCell>{shortDate(row.createdAt)}</TableCell>
            <TableCell>
              {formatMoney(row.amount)} {currencyLabel(row.currency)}
            </TableCell>
            <TableCell className="whitespace-normal">{row.reason}</TableCell>
          </TableRow>
        )}
      />
    </div>
  );
}

export const TOOL_LABELS: Record<keyof AssistantTools, string> = {
  buscarSuscripciones: "Consultando suscripciones…",
  listarClientes: "Consultando clientes…",
  listarCuentas: "Consultando cuentas…",
  listarServicios: "Consultando servicios…",
  resumenGanancias: "Calculando ganancias…",
  listarRetiros: "Consultando retiros…",
};

// Renders a finished tool call as its table
export function ToolResult({
  name,
  output,
}: {
  name: keyof AssistantTools;
  output: unknown;
}) {
  switch (name) {
    case "buscarSuscripciones":
      return (
        <SubscriptionsResult output={output as Output<"buscarSuscripciones">} />
      );
    case "listarClientes":
      return <ClientsResult output={output as Output<"listarClientes">} />;
    case "listarCuentas":
      return <AccountsResult output={output as Output<"listarCuentas">} />;
    case "listarServicios":
      return <ServicesResult output={output as Output<"listarServicios">} />;
    case "resumenGanancias":
      return <EarningsResult output={output as Output<"resumenGanancias">} />;
    case "listarRetiros":
      return <WithdrawalsResult output={output as Output<"listarRetiros">} />;
  }
}
