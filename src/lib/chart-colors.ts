function cssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function getChartPalette() {
  return {
    chart1: cssVar("--chart-1", "#3b82f6"),
    chart2: cssVar("--chart-2", "#2563eb"),
    chart3: cssVar("--chart-3", "#1d4ed8"),
    chart4: cssVar("--chart-4", "#93c5fd"),
    chart5: cssVar("--chart-5", "#1e3a8a"),
    success: cssVar("--spinner-success", "#047857"),
    danger: cssVar("--spinner-danger", "#be123c"),
    warning: cssVar("--spinner-warning", "#f97316"),
    purple: cssVar("--spinner-purple", "#a855f7"),
    muted: cssVar("--muted-foreground", "#6b7280"),
    border: cssVar("--border", "#e5e7eb"),
    foreground: cssVar("--foreground", "#111827"),
  };
}
