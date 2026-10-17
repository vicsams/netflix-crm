import { toast } from "sonner";

// Copies text and confirms with a toast only when it actually worked: the
// clipboard can be unavailable (insecure context, denied permission)
export async function copyToClipboard(text: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch {
    toast.error("No se pudo copiar. Copia el texto manualmente.");
  }
}
