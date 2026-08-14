"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, LogOut, Menu, Scissors, ShieldCheck, Store, Users, MoreHorizontal } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav-items";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clearSession, getUser, type AdminUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

const BOTTOM_NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Verifications", href: "/verifications", icon: ShieldCheck },
  { label: "Shops", href: "/shops", icon: Store },
  { label: "Users", href: "/users", icon: Users },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setUser(getUser());
  }, []);

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  const initials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const currentLabel =
    NAV_ITEMS.find((item) => (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)))
      ?.label ?? "PangkasKAKA";

  return (
    <>
      {/* Top app bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 backdrop-blur-xl md:hidden">
        <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(true)}>
          <Menu className="size-5" />
        </Button>
        <h1 className="text-lg font-bold tracking-tight text-foreground">{currentLabel}</h1>
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button>
                  <Avatar className="size-8 border border-primary/10">
                    <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
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
      </header>

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 z-40 flex h-[72px] w-full items-center justify-around border-t border-sidebar-border bg-sidebar px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgba(0,0,0,0.04)] backdrop-blur-xl md:hidden">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-full w-full flex-col items-center justify-center gap-1 transition-transform active:scale-95",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className={cn("flex items-center justify-center rounded-xl px-4 py-1", isActive && "bg-primary/10")}>
                <Icon className="size-5" />
              </div>
              <span className="text-[10px] font-semibold tracking-wide">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground transition-transform active:scale-95"
        >
          <div className="flex items-center justify-center rounded-xl px-4 py-1">
            <MoreHorizontal className="size-5" />
          </div>
          <span className="text-[10px] font-semibold tracking-wide">More</span>
        </button>
      </nav>

      {/* Full nav drawer (hamburger + More) */}
      <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogContent
          showCloseButton={false}
          className="fixed inset-y-0 left-0 top-0 h-screen w-72 max-w-[85vw] -translate-x-0 -translate-y-0 rounded-none rounded-r-2xl border-r border-sidebar-border bg-sidebar p-0 data-open:slide-in-from-left data-closed:slide-out-to-left"
        >
          <DialogTitle className="sr-only">Navigasi</DialogTitle>
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm">
                <Scissors className="size-4.5" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-bold tracking-tight">PangkasKAKA</p>
                <p className="text-xs font-medium text-muted-foreground">SuperAdmin</p>
              </div>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {NAV_ITEMS.map((item) => {
                const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-1/2 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                    )}
                    <Icon className={cn("size-4 shrink-0", isActive && "text-primary")} />
                    <span className="flex-1">{item.label}</span>
                    {item.blocked && (
                      <Badge variant="outline" className="text-[10px] font-normal">
                        Blocked
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-sidebar-border p-4">
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button className="flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors hover:bg-sidebar-accent/50">
                        <Avatar className="size-8 border border-primary/10">
                          <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1 text-sm">
                          <p className="truncate font-semibold">{user.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </button>
                    }
                  />
                  <DropdownMenuContent side="top" align="start" className="w-56">
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
        </DialogContent>
      </Dialog>
    </>
  );
}
