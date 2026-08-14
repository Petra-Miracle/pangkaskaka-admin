import { useEffect, useSyncExternalStore, useState } from "react";
import { getUser, type AdminUser } from "@/lib/auth";

const noopSubscribe = () => () => {};

export function useStoredAdminUser(): AdminUser | null {
  return useSyncExternalStore(noopSubscribe, () => getUser(), () => null);
}

export function useGreeting(): string {
  return useSyncExternalStore(
    noopSubscribe,
    () => {
      const hour = new Date().getHours();
      if (hour < 11) return "Selamat pagi";
      if (hour < 15) return "Selamat siang";
      if (hour < 19) return "Selamat sore";
      return "Selamat malam";
    },
    () => "Selamat datang kembali"
  );
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function useAnimatedNumber(target: number, duration = 900) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(easeOutCubic(t) * target));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}
