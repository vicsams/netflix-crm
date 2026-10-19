"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { PasswordInput } from "@/shared/components/ui/password-input";
import { Spinner } from "@/shared/components/ui/spinner";
import { useRouter } from "next/navigation";
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
// import { signUpAction } from "@/app/actions/auth";
import { authClient } from "@/shared/lib/auth-client";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  signUpFormSchema,
  type SignUpFormValues,
} from "@/features/auth/schemas";
import {
  type SignUpApiError,
  type SignUpError,
  type SignUpResult,
} from "../types/signUp";

type GeneralError = { title: string; description: string };

const EMAIL_IN_USE: GeneralError = {
  title: "El correo ingresado ya está en uso",
  description:
    "Por favor intente nuevamente con otro correo o compruebe que haya introducido correctamente su correo.",
};

export default function SignUpForm() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const [generalError, setGeneralError] = useState<GeneralError | null>(null);

  // Any error means no account was created: show it and stay on the form
  // instead of sending the user to "check your email"
  function handleSignUpError(error: SignUpApiError) {
    switch (error.code) {
      case "USER_ALREADY_EXISTS":
      case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
        setGeneralError(EMAIL_IN_USE);
        return;
      case "PASSWORD_TOO_SHORT":
        form.setError("password", {
          type: "server",
          message: "La contraseña debe tener al menos 8 caracteres",
        });
        return;
      case "PASSWORD_TOO_LONG":
        form.setError("password", {
          type: "server",
          message: "La contraseña no puede tener más de 128 caracteres",
        });
        return;
      case "INVALID_EMAIL":
        form.setError("email", { type: "server", message: "Correo no válido" });
        return;
    }

    if (error.status === 422) {
      setGeneralError(EMAIL_IN_USE);
      return;
    }

    setGeneralError({
      title: "No se pudo crear la cuenta",
      description:
        "Ocurrió un error inesperado. Por favor intente nuevamente en unos minutos.",
    });
  }

  const signUpMutation = useMutation<
    SignUpResult,
    SignUpError,
    SignUpFormValues
  >({
    mutationFn: (data: SignUpFormValues) =>
      authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
      }),
    onMutate: () => {
      setGeneralError(null);
    },
    onSuccess: (data: SignUpResult, variables) => {
      if (data?.error) {
        handleSignUpError(data.error);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["session"] });
      router.push(`/verify-email?email=${encodeURIComponent(variables.email)}`);
    },
    onError: (err: SignUpError) => {
      handleSignUpError(err);
    },
  });

  const onSubmit = async (data: SignUpFormValues) => {
    signUpMutation.mutate(data);
  };

  return (
    <div className="bg-background flex min-h-dvh flex-col items-center justify-center gap-6 p-6 max-sm:justify-start max-sm:pt-[8vh]">
      <Image
        src="/brand/lumina-logo.png"
        alt="Lumina Play"
        width={304}
        height={259}
        priority
        className="h-28 w-auto max-sm:h-20"
      />
      <div className="bg-card h-fit w-full max-w-md rounded-lg border p-8 shadow-md">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldSet>
            <FieldLegend>Formulario de creación de cuenta</FieldLegend>
            <FieldDescription>
              Complete el formulario para crear una nueva cuenta.
            </FieldDescription>

            <FieldGroup>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="name">Nombre Completo</FieldLabel>
                    <Input
                      id="name"
                      autoComplete="name"
                      placeholder="Su nombre"
                      {...field}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

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

              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                    <PasswordInput
                      id="password"
                      autoComplete="new-password"
                      placeholder="Ingrese una contraseña"
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
                disabled={signUpMutation.isPending}
              >
                {signUpMutation.isPending ? (
                  <>
                    <Spinner />
                    Creando Cuenta
                  </>
                ) : (
                  "Crear Cuenta"
                )}
              </Button>
            </FieldGroup>
          </FieldSet>
        </form>

        {generalError && (
          <Dialog defaultOpen={true}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{generalError.title}</DialogTitle>
                <DialogDescription>
                  {generalError.description}
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        )}

        <p className="text-muted-foreground mt-6 text-center text-sm">
          ¿Ya tiene una cuenta?{" "}
          <Link href="/signin" className="text-lumina-crimson-light underline">
            Inicie Sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
