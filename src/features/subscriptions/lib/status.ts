import { differenceInDays } from "date-fns";
import type { ClientStatus } from "@/features/subscriptions/types/clientStatus";

// Status as shown to the user: the stored status can lag behind the date
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
