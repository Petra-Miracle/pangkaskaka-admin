"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Command, CornerDownLeft, LogOut, Moon, Search, Sun } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NAV_SECTIONS } from "@/lib/nav-items";
import { clearSession } from "@/lib/auth";
import { cn } from "@/lib/utils";

type PaletteItem = {
  id: string;
  label: string;
  hint: string;
  group: string;
  icon: typeof Search;
  onSelect: () => void;
};

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
    const pages: PaletteItem[] = NAV_SECTIONS.flatMap((section) =>
      section.items
        .filter((item) => !q || item.label.toLowerCase().includes(q) || section.label.toLowerCase().includes(q))
        .map((item) => ({
          id: item.href,
          label: item.label,
          hint: item.blocked ? "Segera" : "Buka halaman",
          group: section.label,
          icon: item.icon,
          onSelect: () => {
            setOpen(false);
            router.push(item.href);
          },
        }))
    );
    const actions: PaletteItem[] = [
      {
        id: "theme",
        label: resolvedTheme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap",
        hint: "Pengaturan tampilan",
        group: "Aksi",
        icon: resolvedTheme === "dark" ? Sun : Moon,
        onSelect: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
      },
      {
        id: "logout",
        label: "Keluar",
        hint: "Akhiri sesi",
        group: "Aksi",
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

  const grouped = useMemo(() => {
    const map = new Map<string, PaletteItem[]>();
    for (const item of results) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return Array.from(map.entries());
  }, [results]);

  function run(index: number) {
    const item = results[index];
    if (item) item.onSelect();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="top-16 left-1/2 w-[min(600px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-0 rounded-2xl p-0 shadow-popover"
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
          <kbd className="kbd">
            <Command className="size-2.5" /> K
          </kbd>
        </div>
        <div className="max-h-[min(480px,60vh)] overflow-y-auto p-2">
          {results.length === 0 && (
            <p className="px-3 py-10 text-center text-sm text-muted-foreground">
              Tidak ada hasil untuk “{query}”.
            </p>
          )}
          {grouped.map(([group, items]) => (
            <div key={group} className="mb-1">
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground/60 uppercase">
                {group}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const index = results.indexOf(item);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => run(index)}
                      onMouseEnter={() => setSelected(index)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                        index === selected ? "bg-primary/10 text-foreground" : "text-muted-foreground"
                      )}
                    >
                      <Icon className={cn("size-4 shrink-0", index === selected && "text-primary")} />
                      <span className="flex-1 font-medium">{item.label}</span>
                      <span className="text-xs text-muted-foreground/70">{item.hint}</span>
                      {index === selected && <CornerDownLeft className="size-3.5 text-muted-foreground" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="kbd">↑</kbd>
            <kbd className="kbd">↓</kbd>
            navigasi
          </span>
          <span className="flex items-center gap-1">
            <kbd className="kbd">↵</kbd>
            pilih
          </span>
          <span className="ml-auto">PangkasKAKA Console</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}