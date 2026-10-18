"use client";

import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { PasswordInput } from "@/shared/components/ui/password-input";
import { Spinner } from "@/shared/components/ui/spinner";
import {
  Field,
  FieldLabel,
  FieldSet,
  FieldLegend,
  FieldDescription,
  FieldGroup,
  FieldError,
} from "@/shared/components/ui/field";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@/shared/lib/auth-client";
import {
  signInFormSchema,
  type SignInFormValues,
} from "@/features/auth/schemas";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export default function SignInForm() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: { email: "", password: "" },
  });

  const signInMutation = useMutation({
    mutationFn: (data: SignInFormValues) =>
      authClient.signIn.email({
        email: data.email,
        password: data.password,
      }),
    onSuccess: (res, variables) => {
      // better-auth does not throw on failure, it returns { error }
      const error = (
        res as { error?: { status?: number; message?: string } } | null
      )?.error;

      if (error?.status === 403) {
        // Better Auth just sent a fresh link (sendOnSignIn)
        router.push(
          `/verify-email?email=${encodeURIComponent(variables.email)}`,
        );
        return;
      }

      if (error) {
        form.setError("email", {
          type: "server",
          message:
            error.status === 401
              ? "Correo o contraseña incorrectos"
              : (error.message ?? "Error al iniciar sesión"),
        });
        return;
      }
      // Optionally invalidate or refetch session/user queries
      queryClient.invalidateQueries({ queryKey: ["session"] });
      router.push("/dashboard");
    },
    onError: (err: unknown, variables) => {
      const e = err as {
        status?: number;
        code?: string;
        message?: string;
      } | null;
      if (e && (e.status === 403 || e.code === "API_ERROR")) {
        // Better Auth just sent a fresh link (sendOnSignIn)
        router.push(
          `/verify-email?email=${encodeURIComponent(variables.email)}`,
        );
        return;
      }
      const message = e && e.message ? e.message : "Error durante el registro";

      if (message.toLowerCase().includes("email")) {
        form.setError("email", { type: "server", message });
      } else {
        form.setError("email", { type: "server", message });
      }
    },
  });

  const onSubmit = async (data: SignInFormValues) => {
    signInMutation.mutate(data);
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 p-6 max-sm:items-start max-sm:pt-[15vh]">
      <div className="h-fit w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldSet>
            <FieldLegend>Formulario de inicio de sesion</FieldLegend>
            <FieldDescription>
              Por favor ingrese su correo y contraseña para iniciar sesión.
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
                      {...field}
                      type="email"
                      autoComplete="email"
                      placeholder="correo@ejemplo.com"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                    <PasswordInput
                      id="password"
                      {...field}
                      autoComplete="current-password"
                      placeholder="Ingrese su contraseña"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <div className="flex items-center justify-between">
                <div />
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:underline"
                >
                  ¿Olvidó su contraseña?
                </Link>
              </div>
              <Button
                type="submit"
                className="w-full font-bold"
                disabled={signInMutation.isPending}
              >
                {signInMutation.isPending ? (
                  <>
                    <Spinner />
                    Iniciando Sesión
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </FieldGroup>
          </FieldSet>
        </form>

        <p className="text-muted-foreground mt-6 text-center text-sm">
          ¿No tiene una cuenta?{" "}
          <Link href="/signup" className="text-primary underline">
            Cree una cuenta
          </Link>
        </p>
      </div>
    </div>
  );
}
