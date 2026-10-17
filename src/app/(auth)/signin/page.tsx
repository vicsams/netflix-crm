import SignInForm from "@/features/auth/components/SignInForm";
import VerifiedToast from "@/features/auth/components/VerifiedToast";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string }>;
}) {
  const { verified } = await searchParams;

  return (
    <main>
      {verified && (
        <VerifiedToast message="¡Correo verificado! Ya puedes iniciar sesión." />
      )}
      <SignInForm />
    </main>
  );
}
