"use client";

import { CalendarDays } from "lucide-react";
import { TIME_RANGES, setTimeRange, useTimeRange } from "@/lib/time-range";
import { cn } from "@/lib/utils";

// Pil rentang waktu (7 / 30 / 90 hari). UI-only — lihat lib/time-range.ts.
export function TimeRangePicker({ className }: { className?: string }) {
  const active = useTimeRange();
  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-lg border border-border bg-background/60 p-0.5",
        className
      )}
      role="group"
      aria-label="Rentang waktu"
    >
      <CalendarDays className="mx-1 size-3.5 shrink-0 text-muted-foreground" />
      {TIME_RANGES.map((range) => (
        <button
          key={range}
          type="button"
          onClick={() => setTimeRange(range)}
          aria-pressed={active === range}
          className={cn(
            "rounded-md px-2 py-0.5 text-xs font-medium tabular-nums transition-colors",
            active === range
              ? "bg-accent-500 text-white"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {range}h
        </button>
      ))}
    </div>
  );
}
