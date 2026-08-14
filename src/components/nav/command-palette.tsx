"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Command, CornerDownLeft, LogOut, Moon, Search, Sun } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NAV_ITEMS } from "@/lib/nav-items";
import { clearSession } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function CommandPalette() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSelected(0);
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    function onOpenEvent() {
      setSelected(0);
      setOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pk:open-command", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pk:open-command", onOpenEvent);
    };
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pages = NAV_ITEMS.filter((item) => !q || item.label.toLowerCase().includes(q)).map((item) => ({
      id: item.href,
      label: item.label,
      hint: item.blocked ? "Segera" : "Buka halaman",
      icon: item.icon,
      onSelect: () => {
        setOpen(false);
        router.push(item.href);
      },
    }));
    const actions = [
      {
        id: "theme",
        label: resolvedTheme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap",
        hint: "Pengaturan tampilan",
        icon: resolvedTheme === "dark" ? Sun : Moon,
        onSelect: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
      },
      {
        id: "logout",
        label: "Keluar",
        hint: "Akhiri sesi",
        icon: LogOut,
        onSelect: () => {
          clearSession();
          setOpen(false);
          router.push("/login");
        },
      },
    ];
    return [...pages, ...actions];
  }, [query, resolvedTheme, router, setTheme]);

  function run(index: number) {
    const item = results[index];
    if (item) item.onSelect();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="top-20 left-1/2 w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-0 rounded-2xl p-0"
      >
        <DialogTitle className="sr-only">Pencarian cepat</DialogTitle>
        <div className="flex items-center gap-2.5 border-b border-border px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelected((s) => Math.min(results.length - 1, s + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelected((s) => Math.max(0, s - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                run(selected);
              }
            }}
            placeholder="Cari halaman atau aksi..."
            autoFocus
            className="h-12 border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
          />
          <kbd className="flex items-center gap-0.5 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            <Command className="size-2.5" /> K
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Tidak ada hasil untuk “{query}”.
            </p>
          )}
          <div className="space-y-0.5">
            {results.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => run(i)}
                  onMouseEnter={() => setSelected(i)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                    i === selected ? "bg-primary/10 text-foreground" : "text-muted-foreground"
                  )}
                >
                  <Icon className={cn("size-4 shrink-0", i === selected && "text-primary")} />
                  <span className="flex-1 font-medium">{item.label}</span>
                  <span className="text-xs text-muted-foreground/70">{item.hint}</span>
                  {i === selected && <CornerDownLeft className="size-3.5 text-muted-foreground" />}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-muted px-1">↑</kbd>
            <kbd className="rounded border border-border bg-muted px-1">↓</kbd>
            navigasi
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-muted px-1">↵</kbd>
            pilih
          </span>
          <span className="ml-auto">PangkasKAKA Console</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
