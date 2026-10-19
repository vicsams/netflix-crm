import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/shared/lib/auth";
import { Button } from "@/shared/components/ui/button";

export default async function Home() {
  // The landing page is only for visitors; signed-in users go to their data
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/dashboard");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
      {/* The logo carries the name; the heading keeps it for screen readers */}
      <h1 className="sr-only">Lumina Play</h1>
      <Image
        src="/brand/lumina-logo.png"
        alt="Lumina Play"
        width={304}
        height={259}
        priority
        className="h-40 w-auto max-sm:h-32"
      />
      <p className="text-muted-foreground text-center">
        Gestión de suscripciones de streaming
      </p>
      <div className="mt-4 flex gap-4">
        <Button asChild size="lg">
          <Link href="/signup">Crear Cuenta</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/signin">Iniciar Sesión</Link>
        </Button>
      </div>
    </main>
  );
}
