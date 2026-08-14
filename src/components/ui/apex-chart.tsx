"use client";

import { useEffect, useRef } from "react";
import type ApexChartsType from "apexcharts";
import type { ApexOptions } from "apexcharts";

type ApexChartsInstance = InstanceType<typeof ApexChartsType>;
type ApexChartsCtor = new (el: Element, options: ApexOptions) => ApexChartsInstance;

// Mirrors Flowbite's own chart init pattern (flowbite.com/docs/plugins/charts):
// new ApexCharts(el, options).render() — kept imperative on purpose so it
// stays a drop-in match for any config copied from the Flowbite examples.
export function ApexChart({ options, className }: { options: ApexOptions; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    let chart: ApexChartsInstance | null = null;

    import("apexcharts").then((mod) => {
      if (cancelled || !containerRef.current) return;
      const ApexCharts = (mod as unknown as { default: ApexChartsCtor }).default;
      chart = new ApexCharts(containerRef.current, options);
      chart.render();
    });

    return () => {
      cancelled = true;
      chart?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(options)]);

  return <div ref={containerRef} className={className} />;
}
