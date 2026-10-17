"use client";

import ClientStatusActions from "@/features/subscriptions/components/ClientStatusActions";
import {
  formatAmount,
  getRemainingDaysLabel,
  ServiceBadge,
  StatusBadge,
} from "@/features/subscriptions/components/table/columns";
import { formatDate } from "@/shared/lib/date";
import { formatPin } from "@/shared/lib/pin";
import { ClientStatusDetailsSheetProps } from "@/features/subscriptions/types/clientStatus";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/components/ui/drawer";

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="truncate text-right text-sm font-medium">
        {children}
      </span>
    </div>
  );
}

export default function ClientStatusDetailsSheet({
  clientStatus,
  open,
  onOpenChange,
}: ClientStatusDetailsSheetProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        {clientStatus && (
          <>
            <DrawerHeader className="text-left">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <DrawerTitle className="text-left">
                    {clientStatus.client?.clientName ?? clientStatus.clientName}
                  </DrawerTitle>
                  <DrawerDescription>
                    {clientStatus.client?.phoneNumber ??
                      clientStatus.phoneNumber}
                  </DrawerDescription>
                </div>
                <StatusBadge row={clientStatus} />
              </div>
            </DrawerHeader>

            <div className="divide-y overflow-y-auto px-4">
              <DetailRow label="Servicio">
                <ServiceBadge row={clientStatus} />
              </DetailRow>
              <DetailRow label="Cuenta">
                {clientStatus.activeAccount?.email ?? "-"}
              </DetailRow>
              <DetailRow label="Perfil">
                {clientStatus.screen?.profileName ?? "-"}
              </DetailRow>
              <DetailRow label="PIN">
                {formatPin(clientStatus.screen?.profilePIN)}
              </DetailRow>
              <DetailRow label="Fecha de compra">
                {formatDate(clientStatus.purchaseDate)}
              </DetailRow>
              <DetailRow label="Fecha de vencimiento">
                {formatDate(clientStatus.expirationDate)}
              </DetailRow>
              <DetailRow label="Días restantes">
                {getRemainingDaysLabel(clientStatus)}
              </DetailRow>
              <DetailRow label="Monto">
                {formatAmount(clientStatus.amount)}
              </DetailRow>
            </div>

            <DrawerFooter>
              <ClientStatusActions
                clientStatus={clientStatus}
                variant="buttons"
              />
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
