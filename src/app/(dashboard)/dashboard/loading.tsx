import { Skeleton } from "@/shared/components/ui/skeleton";

// Shown by Next.js while the dashboard page checks the session
export default function DashboardLoading() {
  return (
    <div className="mx-10 space-y-4 pb-4 max-sm:mx-4" aria-busy="true">
      <span className="sr-only">Cargando…</span>
      <Skeleton className="h-9 w-80 max-sm:w-full" />
      <div className="grid grid-cols-4 gap-4 max-sm:grid-cols-1">
        <Skeleton className="col-span-2 h-30 max-sm:col-span-1" />
        <Skeleton className="h-30" />
        <Skeleton className="h-30" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
