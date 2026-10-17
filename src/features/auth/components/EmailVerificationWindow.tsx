"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Spinner } from "@/shared/components/ui/spinner";
import { MailOpen, MailWarning, ArrowLeft } from "lucide-react";
import { authClient } from "@/shared/lib/auth-client";
import type { EmailVerificationWindowProps } from "@/features/auth/types/emailVerification";

// Seconds before another verification email can be requested
const RESEND_COOLDOWN = 60;

export default function EmailVerificationWindow({
  email: initialEmail,
  linkError,
}: EmailVerificationWindowProps) {
  const [email, setEmail] = useState(initialEmail);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || sending || cooldown > 0) return;

    setSending(true);
    // The server points the new link back to /verify-email
    const { error } = await authClient.sendVerificationEmail({
      email: email.trim(),
    });
    setSending(false);

    if (error) {
      toast.error(
        error.status === 429
          ? "Demasiados intentos. Espera unos minutos e inténtalo de nuevo."
          : "No se pudo enviar el correo. Inténtalo de nuevo.",
      );
      return;
    }

    toast.success("Te enviamos un nuevo correo de verificación");
    setCooldown(RESEND_COOLDOWN);
  };

  const Icon = linkError ? MailWarning : MailOpen;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <Card className="border-none shadow-none">
          <div className="w-fit self-center rounded-full bg-yellow-400 p-4">
            <Icon className="mx-auto h-12 w-12 text-neutral-900" />
          </div>
          <CardHeader>
            <CardTitle className="text-center text-lg font-bold">
              {linkError
                ? "El enlace no es válido o expiró"
                : "Revisa tu correo"}
            </CardTitle>
            <CardDescription>
              {linkError
                ? "Solicita un nuevo correo de verificación y usa el enlace más reciente."
                : "Te enviamos un correo de verificación. Abre el enlace que contiene para activar tu cuenta. Si no lo ves, revisa la carpeta de spam."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleResend} className="space-y-2">
              <Label htmlFor="resend-email">¿No te llegó?</Label>
              <Input
                id="resend-email"
                type="email"
                autoComplete="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button
                type="submit"
                variant="outline"
                className="w-full"
                disabled={sending || cooldown > 0 || !email.trim()}
              >
                {sending ? (
                  <>
                    <Spinner />
                    Enviando
                  </>
                ) : cooldown > 0 ? (
                  `Reenviar en ${cooldown} s`
                ) : (
                  "Reenviar correo"
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter>
            <div className="flex w-full justify-center gap-2">
              <Button asChild variant="ghost" type="button">
                <Link href="/signin" className="flex items-center gap-2">
                  <ArrowLeft />
                  Volver a inicio de sesión
                </Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
