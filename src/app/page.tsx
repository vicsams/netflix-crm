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
    <div className="flex min-h-dvh flex-col items-center gap-4 pt-[25vh]">
      <h1 className="text-center text-4xl font-bold">
        Servicios Streaming PZO
      </h1>
      <div className="mt-8 flex gap-4">
        <Button asChild size="lg">
          <Link href="/signup">Crear Cuenta</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/signin">Iniciar Sesión</Link>
        </Button>
      </div>
    </div>
  );
}
