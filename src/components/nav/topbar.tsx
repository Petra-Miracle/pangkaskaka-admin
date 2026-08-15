"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, Command, LayoutDashboard, LogOut, Search } from "lucide-react";
import { Avatar as HeroAvatar } from "@heroui/react";
import { ThemeToggle } from "@/components/nav/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NAV_SECTIONS } from "@/lib/nav-items";
import { clearSession } from "@/lib/auth";
import { useStoredAdminUser } from "@/lib/client-values";

function useCurrentPage() {
  const pathname = usePathname();
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
      if (active) {
        return { section: section.label, page: item.label, href: item.href };
      }
    }
  }
  return null;
}

export function Topbar() {
  const router = useRouter();
  const user = useStoredAdminUser();
  const current = useCurrentPage();

  const initials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 hidden h-16 shrink-0 items-center border-b border-sidebar-border bg-sidebar/80 backdrop-blur-xl md:flex">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-6">
        <div className="flex min-w-0 items-center gap-1.5 text-sm">
          {current ? (
            <>
              <Link
                href={current.href}
                className="flex items-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <LayoutDashboard className="size-3.5" />
                {current.section}
              </Link>
              <ChevronRight className="size-3.5 text-muted-foreground/50" />
              <span className="truncate font-semibold text-foreground">{current.page}</span>
            </>
          ) : (
            <span className="font-semibold">PangkasKAKA Console</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => window.dispatchEvent(new Event("pk:open-command"))}
            className="flex h-8 items-center gap-2 rounded-lg border border-border/70 bg-background/60 px-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/25 hover:text-foreground"
            aria-label="Pencarian cepat (Ctrl+K)"
          >
            <Search className="size-3.5" />
            <span className="hidden lg:inline">Cari...</span>
            <kbd className="kbd ml-1">
              <Command className="size-2.5" />K
            </kbd>
          </button>
          <ThemeToggle />
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    className="ml-1 flex items-center gap-2 rounded-full border border-sidebar-border/70 bg-background/60 py-0.5 pr-2 pl-0.5 transition-colors hover:border-primary/25"
                    aria-label="Menu akun"
                  >
                    <HeroAvatar.Root
                      size="sm"
                      variant="soft"
                      color="accent"
                      className="size-7 border border-primary/20"
                    >
                      <HeroAvatar.Fallback className="text-[10px] font-bold">
                        {initials}
                      </HeroAvatar.Fallback>
                    </HeroAvatar.Root>
                    <span className="hidden max-w-32 truncate text-xs font-semibold lg:inline">
                      {user.name}
                    </span>
                  </button>
                }
              />
              <DropdownMenuContent side="bottom" align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="px-2 py-1.5 font-normal">
                    <p className="truncate text-sm font-semibold text-heading">{user.name}</p>
                    <p className="truncate text-xs text-body">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                    <LogOut className="size-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}