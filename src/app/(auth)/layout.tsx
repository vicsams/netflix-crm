import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/shared/lib/auth";

// Signed-in users have nothing to do on sign-in or sign-up
export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/dashboard");

  return children;
}
