export type EmailVerificationWindowProps = {
  // Pre-fills the resend form; the user can type it when missing
  email: string;
  // Better Auth's ?error= when a verification link failed (e.g. token_expired)
  linkError?: string;
};
