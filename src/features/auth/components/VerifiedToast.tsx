"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

// Confirms a just-verified email once, then drops ?verified=1 from the URL so
// a reload doesn't show it again
export default function VerifiedToast({ message }: { message: string }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // A fixed id keeps it to one toast even if the effect runs twice
    toast.success(message, { id: "email-verified" });
    router.replace(pathname);
  }, [message, pathname, router]);

  return null;
}
