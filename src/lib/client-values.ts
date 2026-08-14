import { useEffect, useSyncExternalStore, useState } from "react";
import { getUser, type AdminUser } from "@/lib/auth";

const noopSubscribe = () => () => {};

// NOTE: getUser() re-parses JSON on every call, so it can never back a
// useSyncExternalStore snapshot directly — a fresh object each call reads as
// "changed" to React's tearing check, which schedules a re-render, which
// calls getSnapshot again, which returns yet another fresh object... an
// infinite loop (React error #185 in production). Plain mount-effect state
// avoids the stable-reference requirement entirely.
export function useStoredAdminUser(): AdminUser | null {
  const [user, setUser] = useState<AdminUser | null>(null);
  useEffect(() => {
    // One-time hydration from localStorage on mount — not a value React
    // needs to keep synchronized every render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(getUser());
  }, []);
  return user;
}

export function useGreeting(): string {
  // Safe as useSyncExternalStore: every branch returns the same string
  // primitive across calls within an hour, and primitives compare by value.
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

// Renders the locale-formatted date only after mount. Vercel's serverless
// Node runtime doesn't ship full ICU data for "id-ID" by default, so
// computing this during SSR can produce different text server vs. client —
// a hydration mismatch (React error #418). getServerSnapshot below is used
// for both the SSR pass and the initial client hydration pass, so they
// always agree; the real formatted date swaps in right after.
export function useTodayLabel(): string {
  return useSyncExternalStore(
    noopSubscribe,
    () =>
      new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    () => ""
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
