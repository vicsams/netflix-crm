"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/shared/components/ui/badge";
import ClientActions from "@/features/clients/components/ClientActions";
import { Client } from "@/features/clients/types/client";

export const columns: ColumnDef<Client>[] = [
  {
    accessorKey: "clientName",
    header: () => <div className="w-60">Cliente</div>,
  },
  {
    accessorKey: "phoneNumber",
    header: () => <div className="w-50">Teléfono</div>,
  },
  {
    accessorKey: "subscriptionCount",
    header: () => <div className="w-40">Suscripciones</div>,
    cell: ({ getValue }) => {
      const count = getValue() as number;
      return <Badge variant="secondary">{count}</Badge>;
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => <ClientActions client={row.original} />,
  },
];
