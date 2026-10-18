"use client";

import { useState } from "react";
import ClientStatusActions from "@/features/subscriptions/components/ClientStatusActions";
import ClientStatusDetailsSheet from "@/features/subscriptions/components/ClientStatusDetailsSheet";
import {
  getExpiryDetail,
  StatusBadge,
} from "@/features/subscriptions/components/table/columns";
import { ClientStatusListProps } from "@/features/subscriptions/types/clientStatus";

export default function ClientStatusList({
  data,
  emptyMessage = "No se encontraron clientes activos",
}: ClientStatusListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Read the selected row from the latest data so the sheet reflects
  // edits and renewals, and closes on its own if the row is deleted
  const selected = data.find((row) => row.id === selectedId) ?? null;

  function openSheet(id: string) {
    setSelectedId(id);
    setSheetOpen(true);
  }

  if (data.length === 0) {
    return (
      <div className="text-muted-foreground border-t py-10 text-center text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      <ul className="divide-y border-t">
        {data.map((row) => (
          <li
            key={row.id}
            role="button"
            tabIndex={0}
            onClick={() => openSheet(row.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openSheet(row.id);
              }
            }}
            className="active:bg-muted flex cursor-pointer items-center justify-between gap-3 px-4 py-3"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              {/* The name gets the room: the badge is compact here and the
                  dates go in the details line below */}
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate font-medium">
                  {row.client?.clientName ?? row.clientName}
                </span>
                <span className="shrink-0">
                  <StatusBadge row={row} compact />
                </span>
              </div>
              <span className="text-muted-foreground truncate text-xs">
                {[row.service?.serviceName ?? "-", getExpiryDetail(row)]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              <span className="text-muted-foreground truncate text-xs">
                {row.activeAccount?.email ?? "-"}
              </span>
            </div>
            {/* React events bubble through portals: keep taps on the menu
                and its dialogs from also opening the details sheet */}
            <div
              className="shrink-0"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <ClientStatusActions clientStatus={row} />
            </div>
          </li>
        ))}
      </ul>

      <ClientStatusDetailsSheet
        clientStatus={selected}
        open={sheetOpen && !!selected}
        onOpenChange={setSheetOpen}
      />
    </>
  );
}
