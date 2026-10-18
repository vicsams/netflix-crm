import axios from "axios";

// The message to show the user for a failed request: the API's own message
// when it sent one, otherwise a Spanish description of what went wrong
export function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: unknown } | undefined)
      ?.message;
    if (typeof message === "string" && message.trim()) return message;

    if (!error.response) {
      return error.code === "ECONNABORTED"
        ? "El servidor tardó demasiado en responder. Intenta de nuevo."
        : "No se pudo conectar con el servidor. Revisa tu conexión.";
    }
  }

  return fallback;
}
