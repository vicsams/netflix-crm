import { TriangleAlert } from "lucide-react";
import { Spinner } from "@/shared/components/ui/spinner";

type DeleteConsequencesProps = {
  loading: boolean;
  failed: boolean;
  subscriptionCount: number;
  activeSubscriptions: number;
  screenCount?: number;
  // Accounts are kept when their service is deleted, just left unassigned
  unassignedAccountCount?: number;
};

function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

// Lists what the database deletes along with the item (cascading deletes), so
// the user is not surprised by customer subscriptions disappearing
export default function DeleteConsequences({
  loading,
  failed,
  subscriptionCount,
  activeSubscriptions,
  screenCount = 0,
  unassignedAccountCount = 0,
}: DeleteConsequencesProps) {
  if (loading) {
    return (
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        <Spinner />
        Revisando qué más se eliminará…
      </p>
    );
  }

  if (failed) {
    return (
      <p className="text-destructive text-sm">
        No se pudo comprobar qué más se eliminará. Cierra e inténtalo de nuevo.
      </p>
    );
  }

  const deleted = [
    subscriptionCount > 0 &&
      `${plural(subscriptionCount, "suscripción de cliente", "suscripciones de clientes")}${
        activeSubscriptions > 0
          ? ` (${plural(activeSubscriptions, "activa", "activas")})`
          : ""
      }`,
    screenCount > 0 && plural(screenCount, "pantalla", "pantallas"),
  ].filter(Boolean);

  if (deleted.length === 0 && unassignedAccountCount === 0) return null;

  return (
    <div className="border-destructive/30 bg-destructive/5 text-destructive space-y-1 rounded-md border p-3 text-left text-sm">
      {deleted.length > 0 && (
        <>
          <p className="flex items-center gap-2 font-semibold">
            <TriangleAlert className="size-4 shrink-0" />
            También se eliminarán:
          </p>
          <ul className="list-disc pl-10">
            {deleted.map((item) => (
              <li key={String(item)}>{item}</li>
            ))}
          </ul>
        </>
      )}
      {unassignedAccountCount > 0 && (
        <p className="text-muted-foreground">
          {unassignedAccountCount === 1
            ? "La cuenta de este servicio se conservará, pero quedará sin servicio asignado."
            : `Las ${unassignedAccountCount} cuentas de este servicio se conservarán, pero quedarán sin servicio asignado.`}
        </p>
      )}
    </div>
  );
}
