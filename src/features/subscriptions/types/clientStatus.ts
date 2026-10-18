export type ClientStatus = {
  id: string;
  clientName: string;
  phoneNumber: string;
  clientId: string;
  client?: {
    id: string;
    clientName: string;
    phoneNumber: string;
  } | null;
  activeAccountId: string;
  activeAccount?: { id: string; email: string } | null;
  serviceId: string;
  service?: {
    id: string;
    serviceName: string;
    textColor?: string | null;
    backgroundColor?: string | null;
  } | null;
  screenId: string;
  screen?: { id: string; profileName: string; profilePIN: number } | null;
  expirationDate?: string | null;
  purchaseDate?: string | null;
  amount?: number | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

export interface ClientStatusActionsProps {
  clientStatus: ClientStatus;
  variant?: "menu" | "buttons";
}

export type ClientStatusMessageDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientStatus: ClientStatus;
};

export interface ClientStatusRenewDialogProps {
  clientStatus: ClientStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export type UpdateClientStatusDialogProps = {
  clientStatus: ClientStatus;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export type ClientStatusListProps = {
  data: ClientStatus[];
  emptyMessage?: string;
};

export type ClientStatusDetailsSheetProps = {
  clientStatus: ClientStatus | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// What status and date displays need, so rows that aren't full ClientStatus
// records (e.g. assistant results) can use the same badge and helpers
export type SubscriptionDates = Pick<
  ClientStatus,
  "status" | "expirationDate" | "purchaseDate"
>;
