import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`
}

// Ambang minimum sampel sebelum persentase perbandingan (mis. "-66,7% vs bulan
// lalu") layak ditampilkan. Di bawah ini basisnya terlalu kecil — "-66,7%" dari
// 3 pelanggan atau rating 5,0 dari 2 ulasan menyesatkan, jadi tampilkan angka
// mentahnya saja dengan label netral.
export const MIN_SAMPLE_FOR_COMPARISON = 10

export function hasEnoughSample(n: number | undefined | null): boolean {
  return typeof n === "number" && n >= MIN_SAMPLE_FOR_COMPARISON
}

export function formatNumber(n: number) {
  return n.toLocaleString("id-ID")
}

export function formatRelativeTime(dateInput: string | number | Date) {
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) return "—"

  const diffMs = Date.now() - date.getTime()
  const seconds = Math.round(diffMs / 1000)
  const minutes = Math.round(seconds / 60)
  const hours = Math.round(minutes / 60)
  const days = Math.round(hours / 24)

  if (seconds < 60) return "Baru saja"
  if (minutes < 60) return `${minutes} menit lalu`
  if (hours < 24) return `${hours} jam lalu`
  if (days < 7) return `${days} hari lalu`
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
}
