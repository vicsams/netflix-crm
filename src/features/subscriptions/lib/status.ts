import { differenceInDays } from "date-fns";
import type { SubscriptionDates } from "@/features/subscriptions/types/clientStatus";

// Accepts API rows (ISO strings) and Prisma rows (Date objects) alike
type StatusInput = Pick<SubscriptionDates, "status"> & {
  expirationDate?: string | Date | null;
};

// Status as shown to the user: the stored status can lag behind the date
export function getDerivedStatus(
  row: StatusInput,
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
