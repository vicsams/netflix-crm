"use client";

import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Spinner } from "@/shared/components/ui/spinner";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldError,
} from "@/shared/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@/shared/lib/auth-client";
import { useMutation } from "@tanstack/react-query";
import { MailOpen } from "lucide-react";
import {
  forgotPasswordFormSchema,
  ForgotPasswordFormValues,
  CheckEmailResponse,
} from "../schemas";

async function checkEmailVerification(email: string) {
  const res = await fetch("/api/users/check-email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const json = (await res.json()) as CheckEmailResponse & { message?: string };

  if (!res.ok) {
    return {
      ok: false as const,
      error: { message: json?.message || "Error verificando el correo" },
    };
  }

  return { ok: true as const, data: json };
}

export default function ForgotPasswordForm() {
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: { email: "" },
  });

  const [dialogOpen, setDialogOpen] = useState(false);

  const mutation = useMutation<unknown, Error, ForgotPasswordFormValues>({
    mutationFn: async (data: ForgotPasswordFormValues) => {
      try {
        // Check whether the email exists and is verified
        const verification = await checkEmailVerification(data.email);
        if (!verification.ok) {
          return { error: verification.error };
        }

        const { exists, emailVerified } = verification.data;

        // If user exists but email is not verified, do not send reset
        if (exists && !emailVerified) {
          return {
            error: {
              code: "not_verified",
              message:
                "Este correo aún no está verificado. Revisa tu bandeja de entrada y verifícalo primero.",
            },
          };
        }
      } catch {
        return { error: { message: "Error verificando el correo" } };
      }

      // Proceed with password reset request
      const redirectTo = new URL(
        "/reset-password",
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost:3000",
      ).toString();

      return authClient.requestPasswordReset({
        email: data.email,
        redirectTo,
      });
    },
    onSuccess: (res: unknown) => {
      if (res && typeof res === "object" && "error" in res) {
        const error = (res as { error?: unknown }).error;

        // Some APIs return `{ error: null }` on success. Only treat as error if it's truthy.
        if (error) {
          const message =
            (typeof error === "object" && "message" in error
              ? String((error as { message?: unknown }).message ?? "")
              : "") ||
            (typeof error === "string" ? error : "") ||
            "Error al solicitar reinicio";

          // Only one field in the form, so always surface the error there
          form.setError("email", { type: "server", message });
          return;
        }
      }

      setDialogOpen(true);
    },
    onError: (err: Error) => {
      const message = err?.message || "Error al solicitar reinicio";
      form.setError("email", { type: "server", message });
    },
  });

  const onSubmit = (data: ForgotPasswordFormValues) => mutation.mutate(data);

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-6">
      <div className="bg-card w-full max-w-md rounded-lg p-8 shadow-md">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldSet>
            <FieldLegend>Recuperar contraseña</FieldLegend>
            <FieldDescription>
              Ingrese su correo para restablecer la contraseña.
            </FieldDescription>

            <FieldGroup>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="email">Correo</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="correo@ejemplo.com"
                      {...field}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Button
                type="submit"
                className="w-full font-bold"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Spinner />
                    Enviando
                  </>
                ) : (
                  "Enviar enlace"
                )}
              </Button>
            </FieldGroup>
          </FieldSet>
        </form>

        <p className="text-muted-foreground mt-6 text-center text-sm">
          ¿No tienes una cuenta?{" "}
          <Link href="/signup" className="text-lumina-crimson-light underline">
            Crear una cuenta
          </Link>
        </p>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex flex-col justify-center gap-4">
              <div className="bg-lumina-purple w-fit self-center rounded-full p-4">
                <MailOpen className="text-lumina-cream mx-auto h-12 w-12" />
              </div>
              <p className="text-center">Revisa tu correo electrónico</p>
            </DialogTitle>
            <DialogDescription className="mt-4">
              Hemos enviado un correo a tu buzón de entrada. Ingresa a tu correo
              para restablecer tu contraseña.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
