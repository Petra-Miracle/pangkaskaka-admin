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
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 ease-out md:flex",
        collapsed ? "w-[76px]" : "w-60"
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-2.5 border-b border-sidebar-border/70",
          collapsed ? "justify-center px-3" : "px-4"
        )}
      >
        <div className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-white/40 ring-inset">
          <Image src="/pangkaskaka-logo.png" alt="PangkasKAKA" fill sizes="36px" className="object-cover" priority />
          <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-sidebar bg-success" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-bold tracking-tight text-sidebar-foreground">PangkasKAKA</p>
            <p className="text-[11px] font-medium text-nav-text">SuperAdmin Console</p>
          </div>
        )}
      </div>

      <div className={cn("shrink-0 px-3 pt-4", collapsed && "px-2.5")}>
        <button
          onClick={openCommandPalette}
          title="Pencarian cepat (Ctrl+K)"
          className={cn(
            "flex w-full items-center gap-2 rounded-xl border border-sidebar-border bg-white/5 px-3 py-2 text-sm text-nav-text transition-colors hover:bg-white/10 hover:text-sidebar-foreground",
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
              <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.16em] text-nav-text/70 uppercase">
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
                      "relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                      collapsed && "justify-center px-0",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-accent-foreground"
                    )}
                  >
                    {active && (
                      <span className="absolute top-1/2 left-0 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-nav-active" />
                    )}
                    <Icon className={cn("size-4 shrink-0", active && "text-nav-active")} />
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.blocked && (
                          <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-nav-text/70">
                            Segera
                          </span>
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
        <div className="flex items-center justify-between gap-2 rounded-xl border border-sidebar-border bg-white/5 p-2.5">
          {!collapsed && (
            <div className="flex min-w-0 items-center gap-2">
              <span className="relative flex size-1.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-success" />
              </span>
              <p className="truncate text-[11px] font-medium text-nav-text">
                API Production · <span className="text-sidebar-foreground">Online</span>
              </p>
            </div>
          )}
          <button
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
            title={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
            className={cn(
              "shrink-0 rounded-lg p-1.5 text-nav-text transition-colors hover:bg-white/10 hover:text-sidebar-foreground",
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