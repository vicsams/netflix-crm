import type { QueryClient } from "@tanstack/react-query";

export type ChangedRecord =
  | "service"
  | "account"
  | "screen"
  | "client"
  | "subscription"
  | "bank";

// Every cached list that displays each kind of record (including through
// cascading deletes), so a change refreshes all the places that show it:
// - services: their own list, account cards and the subscriptions table
// - accounts: their cards, subscriptions table, profile dropdowns
// - screens: account cards, subscriptions table, profile dropdowns
// - clients: their table and the subscriptions table
// - subscriptions: their table and the clients' subscription counts
const AFFECTED_QUERIES: Record<ChangedRecord, string[]> = {
  service: ["services", "activeAccounts", "clientStatuses", "clients"],
  account: ["activeAccounts", "screens", "clientStatuses", "clients"],
  screen: ["screens", "activeAccounts", "clientStatuses"],
  client: ["clients", "clientStatuses"],
  subscription: ["clientStatuses", "clients"],
  bank: ["bankEarnings", "bankWithdrawals"],
};

// Refetches every list affected by the changed records. Keys match by prefix,
// so "screens" also covers ["screens", accountId]
export function refreshAfterChange(
  queryClient: QueryClient,
  ...changed: ChangedRecord[]
) {
  const keys = new Set(changed.flatMap((record) => AFFECTED_QUERIES[record]));
  return Promise.all(
    [...keys].map((key) => queryClient.invalidateQueries({ queryKey: [key] })),
  );
}
