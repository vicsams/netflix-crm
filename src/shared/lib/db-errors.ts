// Prisma's P2002: a unique constraint failed, e.g. a duplicate account email
export function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}
