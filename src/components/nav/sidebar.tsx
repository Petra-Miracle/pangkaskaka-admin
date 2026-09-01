"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import {
  Command,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
} from "lucide-react";
import { NAV_SECTIONS } from "@/lib/nav-items";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const COLLAPSED_KEY = "pk_sidebar_collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== "undefined" && window.localStorage.getItem(COLLAPSED_KEY) === "1"
  );

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

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 text-sidebar-foreground backdrop-blur-xl transition-all duration-300 ease-out md:flex",
        collapsed ? "w-[76px]" : "w-60"
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-2.5 border-b border-sidebar-border/70",
          collapsed ? "justify-center px-3" : "px-4"
        )}
      >
        <div className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-md shadow-primary/25 ring-1 ring-white/40 ring-inset">
          <Image src="/pangkaskaka-logo.png" alt="PangkasKAKA" fill sizes="36px" className="object-cover" priority />
          <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-sidebar bg-emerald-500" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-bold tracking-tight">PangkasKAKA</p>
            <p className="text-[11px] font-medium text-muted-foreground">SuperAdmin Console</p>
          </div>
        )}
      </div>

      <div className={cn("shrink-0 px-3 pt-4", collapsed && "px-2.5")}>
        <button
          onClick={openCommandPalette}
          title="Pencarian cepat (Ctrl+K)"
          className={cn(
            "flex w-full items-center gap-2 rounded-xl border border-sidebar-border/80 bg-sidebar-accent/40 px-3 py-2 text-sm text-muted-foreground transition-all hover:border-primary/30 hover:bg-sidebar-accent/70 hover:text-foreground",
            collapsed && "justify-center px-0"
          )}
        >
          <Search className="size-3.5 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Cari...</span>
              <kbd className="kbd">
                <Command className="size-2.5" /> K
              </kbd>
            </>
          )}
        </button>
      </div>

      <nav className={cn("flex-1 space-y-6 overflow-y-auto px-3 py-5", collapsed && "px-2.5")}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground/60 uppercase">
                {section.label}
              </p>
            )}
            <div className="space-y-1">
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
                        : "text-sidebar-foreground/70 hover:translate-x-0.5 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
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

      <div className={cn("shrink-0 border-t border-sidebar-border/70 p-3", collapsed && "p-2.5")}>
        <div className="flex items-center justify-between gap-2 rounded-xl border border-sidebar-border/60 bg-sidebar-accent/30 p-2.5">
          {!collapsed && (
            <div className="flex min-w-0 items-center gap-2">
              <span className="relative flex size-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-[11px] font-semibold">API Production</p>
                <p className="truncate text-[10px] text-muted-foreground">Online</p>
              </div>
            </div>
          )}
          <button
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
            title={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
            className={cn(
              "shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
              collapsed && "mx-auto"
            )}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}