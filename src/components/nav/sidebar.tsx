"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ChevronsUpDown,
  Command,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Scissors,
  Search,
} from "lucide-react";
import { NAV_SECTIONS } from "@/lib/nav-items";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { clearSession } from "@/lib/auth";
import { useStoredAdminUser } from "@/lib/client-values";
import { cn } from "@/lib/utils";

const COLLAPSED_KEY = "pk_sidebar_collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useStoredAdminUser();
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== "undefined" && window.localStorage.getItem(COLLAPSED_KEY) === "1"
  );

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      }
      return next;
    });
  }

  function openCommandPalette() {
    window.dispatchEvent(new Event("pk:open-command"));
  }

  const initials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground backdrop-blur-xl transition-all duration-300 ease-out md:flex",
        collapsed ? "w-[76px]" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-2.5 border-b border-sidebar-border",
          collapsed ? "justify-center px-3" : "px-5"
        )}
      >
        <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-primary/70 text-primary-foreground shadow-md shadow-primary/25 ring-1 ring-white/40 ring-inset">
          <Scissors className="size-4.5" />
          <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-sidebar bg-emerald-500" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-bold tracking-tight">PangkasKAKA</p>
            <p className="text-xs font-medium text-muted-foreground">SuperAdmin Console</p>
          </div>
        )}
        {!collapsed && <ThemeToggle className="size-7" />}
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
          title={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
          className={cn(
            "shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
            collapsed && "absolute top-4 -right-3 z-10 size-7 rounded-full border border-sidebar-border bg-sidebar shadow-sm"
          )}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>

      <div className={cn("shrink-0 px-3 pt-3", collapsed && "px-2")}>
        <button
          onClick={openCommandPalette}
          className={cn(
            "flex w-full items-center gap-2 rounded-xl border border-sidebar-border/80 bg-sidebar-accent/40 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/25 hover:text-foreground",
            collapsed && "justify-center px-0"
          )}
          title="Pencarian cepat (Ctrl+K)"
        >
          <Search className="size-3.5 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Cari...</span>
              <kbd className="flex items-center gap-0.5 rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-semibold">
                <Command className="size-2.5" /> K
              </kbd>
            </>
          )}
        </button>
      </div>

      <nav className={cn("flex-1 space-y-5 overflow-y-auto px-3 py-4", collapsed && "px-2.5")}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="mb-1.5 px-3 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground/70 uppercase">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      collapsed && "justify-center px-0",
                      active
                        ? "bg-gradient-to-r from-primary/15 via-primary/8 to-transparent text-sidebar-accent-foreground shadow-sm"
                        : "text-sidebar-foreground/70 hover:translate-x-0.5 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    )}
                  >
                    {active && (
                      <span className="absolute top-1/2 left-0 h-1/2 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary to-primary/60 shadow-sm shadow-primary/40" />
                    )}
                    <Icon className={cn("size-4 shrink-0", active && "text-primary")} />
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.blocked && (
                          <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                            Segera
                          </Badge>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className={cn("shrink-0 border-t border-sidebar-border p-4", collapsed && "p-2.5")}>
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl border border-sidebar-border/70 bg-sidebar-accent/30 p-2 text-left transition-colors hover:bg-sidebar-accent/60",
                    collapsed && "justify-center p-1.5"
                  )}
                >
                  <Avatar className="size-8 border border-primary/15">
                    <AvatarFallback className="bg-gradient-to-br from-primary/15 to-primary/5 text-xs font-bold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <>
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="truncate font-semibold">{user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
                    </>
                  )}
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
                <DropdownMenuItem
                  render={
                    <Link href="/">
                      <LayoutDashboard className="size-4" />
                      Dashboard
                    </Link>
                  }
                />
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
    </aside>
  );
}
