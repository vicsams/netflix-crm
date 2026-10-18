import { format } from "date-fns";
import { es } from "date-fns/locale";

// e.g. "10 de Abril de 2026"
export function formatDate(value?: string | null) {
  if (!value) return "-";

  const [day, month, year] = format(new Date(value), "d MMMM yyyy", {
    locale: es,
  }).split(" ");

  return `${day} de ${month.charAt(0).toUpperCase()}${month.slice(1)} de ${year}`;
}

// e.g. "10 abr 2026", where space is tight
export function formatShortDate(value: string) {
  return format(new Date(value), "d MMM yyyy", { locale: es });
}

export function formatNumericDate(value?: string | null) {
  return value ? format(new Date(value), "dd/MM/yyyy") : "-";
}
