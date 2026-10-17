"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import BinancePriceCard from "@/shared/components/shell/BinancePriceCard";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { authClient } from "@/shared/lib/auth-client";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const signOutAction = async () => {
    try {
      await authClient.signOut();
      router.push("/signin");
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };
  return (
    <header className="sticky top-0 z-49 flex items-center justify-between bg-white px-10 py-2 max-sm:px-4">
      <div className="flex gap-4">
        <h1 className="text-2xl font-bold">Streamings PZO</h1>
        <BinancePriceCard />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex cursor-pointer items-center gap-3 rounded-xl p-2 text-left transition hover:bg-neutral-200/50">
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={session?.user?.image || ""}
              alt={session?.user?.name || "User Avatar"}
            />
            <AvatarFallback className="text-xl">
              {getInitials(session?.user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="max-sm:hidden">
            <p className="font-medium">{session?.user?.name}</p>
            <p className="text-sm text-neutral-500">{session?.user?.email}</p>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={signOutAction} data-variant="destructive">
            Cerrar Sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
