function cssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function getChartPalette() {
  return {
    chart1: cssVar("--chart-1", "#f26b0f"),
    chart2: cssVar("--chart-2", "#fb8c3c"),
    chart3: cssVar("--chart-3", "#c2551a"),
    chart4: cssVar("--chart-4", "#e8b48a"),
    chart5: cssVar("--chart-5", "#8a5a3c"),
    success: cssVar("--spinner-success", "#15803d"),
    danger: cssVar("--spinner-danger", "#b42318"),
    warning: cssVar("--spinner-warning", "#b54708"),
    purple: cssVar("--spinner-purple", "#a855f7"),
    muted: cssVar("--muted-foreground", "#78716c"),
    border: cssVar("--border", "#e7e5e4"),
    foreground: cssVar("--foreground", "#292524"),
    background: cssVar("--background", "#faf9f7"),
  };
}
