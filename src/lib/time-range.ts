"use client";

import { useSyncExternalStore } from "react";

// Pemilih rentang waktu 7 / 30 / 90 hari di header.
// CATATAN: ini murni state UI. Belum ada endpoint yang menerima parameter
// rentang, jadi nilainya TIDAK dikirim ke API — lihat AUDIT bagian 8.
export const TIME_RANGES = [7, 30, 90] as const;
export type TimeRange = (typeof TIME_RANGES)[number];

const KEY = "pk_time_range";
const DEFAULT: TimeRange = 30;
const listeners = new Set<() => void>();

let current: TimeRange = DEFAULT;
let hydrated = false;

function readStored(): TimeRange {
  try {
    const v = Number(window.localStorage.getItem(KEY));
    return (TIME_RANGES as readonly number[]).includes(v) ? (v as TimeRange) : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function setTimeRange(range: TimeRange) {
  current = range;
  hydrated = true;
  try {
    window.localStorage.setItem(KEY, String(range));
  } catch {
    // localStorage bisa tidak tersedia — pilihan tetap hidup di memori sesi ini.
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): TimeRange {
  if (!hydrated && typeof window !== "undefined") {
    current = readStored();
    hydrated = true;
  }
  return current;
}

export function useTimeRange(): TimeRange {
  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT);
}
