import { useSyncExternalStore } from "react";
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
