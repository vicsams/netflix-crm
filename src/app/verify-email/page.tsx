import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/shared/lib/auth";
import EmailVerificationWindow from "@/features/auth/components/EmailVerificationWindow";

type VerifyEmailSearchParams = {
  email?: string;
  verified?: string;
  error?: string;
};

// Verification links come back here (see VERIFIED_CALLBACK_URL): with
// ?verified=1 once the email is verified, plus ?error= when the link failed
export default async function EmailVerificationPage({
  searchParams,
}: {
  searchParams: Promise<VerifyEmailSearchParams>;
}) {
  const { email, verified, error } = await searchParams;

  if (verified && !error) {
    const session = await auth.api.getSession({ headers: await headers() });
    redirect(session ? "/dashboard?verified=1" : "/signin?verified=1");
  }

  return <EmailVerificationWindow email={email ?? ""} linkError={error} />;
}
