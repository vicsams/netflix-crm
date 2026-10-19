"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { PasswordInput } from "@/shared/components/ui/password-input";
import { authClient } from "@/shared/lib/auth-client";
import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldSet,
  FieldError,
  FieldContent,
} from "@/shared/components/ui/field";
import { Spinner } from "@/shared/components/ui/spinner";
import { resetPasswordFormSchema } from "../schemas";

export default function ResetPasswordForm({
  token: tokenProp,
}: {
  token?: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = (tokenProp as string) ?? (searchParams.get("token") as string);

  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof resetPasswordFormSchema>>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof resetPasswordFormSchema>) {
    setIsLoading(true);

    if (values.password !== values.confirmPassword) {
      setIsLoading(false);
      return;
    }

    const { error } = await authClient.resetPassword({
      newPassword: values.password,
      token,
    });

    if (error) {
    } else {
      router.push("/signin");
    }

    setIsLoading(false);
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-6">
      <div className="bg-card w-full max-w-md rounded-lg border shadow-md">
        <Card className="border-0 shadow-none">
          <CardHeader className="text-left">
            <CardTitle className="text-xl">Reiniciar Contraseña</CardTitle>
            <CardDescription>Ingrese su nueva contraseña</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-6">
                <FieldSet>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                      <FieldContent>
                        <PasswordInput
                          id="password"
                          autoComplete="new-password"
                          {...form.register("password")}
                        />
                        <FieldError
                          errors={
                            form.formState.errors.password
                              ? [
                                  {
                                    message: String(
                                      form.formState.errors.password?.message ||
                                        "",
                                    ),
                                  },
                                ]
                              : undefined
                          }
                        />
                      </FieldContent>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="confirmPassword">
                        Confirmar Contraseña
                      </FieldLabel>
                      <FieldContent>
                        <PasswordInput
                          id="confirmPassword"
                          autoComplete="new-password"
                          {...form.register("confirmPassword")}
                        />
                        <FieldError
                          errors={
                            form.formState.errors.confirmPassword
                              ? [
                                  {
                                    message: String(
                                      form.formState.errors.confirmPassword
                                        ?.message || "",
                                    ),
                                  },
                                ]
                              : undefined
                          }
                        />
                      </FieldContent>
                    </Field>
                  </FieldGroup>
                </FieldSet>

                <Button className="w-full" disabled={isLoading} type="submit">
                  {isLoading ? (
                    <>
                      <Spinner />
                      Reiniciando Contraseña
                    </>
                  ) : (
                    "Reiniciar Contraseña"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
