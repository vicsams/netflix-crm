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
import Image from "next/image";
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
    <header className="bg-background/85 sticky top-0 z-49 flex items-center justify-between gap-3 border-b px-10 py-2 backdrop-blur max-sm:px-4">
      <div className="flex min-w-0 items-center gap-4 max-sm:gap-2">
        <div className="flex shrink-0 items-center gap-2.5">
          <Image
            src="/brand/lumina-mark.png"
            alt=""
            width={134}
            height={259}
            priority
            className="h-9 w-auto"
          />
          <h1 className="text-2xl font-bold tracking-tight whitespace-nowrap max-sm:sr-only">
            Lumina Play
          </h1>
        </div>
        <BinancePriceCard />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger className="hover:bg-accent flex shrink-0 cursor-pointer items-center gap-3 rounded-xl p-2 text-left transition">
          <Avatar className="h-12 w-12 max-sm:h-10 max-sm:w-10">
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
            <p className="text-muted-foreground text-sm">
              {session?.user?.email}
            </p>
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
