import { NextResponse } from "next/server";
import { auth } from "@/shared/lib/auth";

type SessionResult =
  | { userId: string; response: null }
  | { userId: null; response: NextResponse };

// Resolves the signed-in user for an API route. When there is no session,
// `response` holds the 401 that the route should return as-is.
export async function requireUser(req: Request): Promise<SessionResult> {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return {
      userId: null,
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  return { userId: session.user.id, response: null };
}
