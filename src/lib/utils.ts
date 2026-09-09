import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(n: number) {
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`
}

export function formatNumber(n: number) {
  return n.toLocaleString("id-ID")
}

// Hitungan (toko, user, dokumen, …) selalu bilangan bulat.
export function formatCount(n: number) {
  return Math.round(n).toLocaleString("id-ID")
}

// Persen: satu desimal. `signed` menambahkan "+" untuk nilai >= 0 (indikator tren).
export function formatPercent(n: number, { signed = false }: { signed?: boolean } = {}) {
  const sign = signed && n >= 0 ? "+" : ""
  return `${sign}${n.toFixed(1)}%`
}

// Sampel kecil membuat persentase perbandingan menyesatkan ("-66.7%" dari 4 user).
// Di bawah ambang ini, sembunyikan persen dan tampilkan teks netral.
export const MIN_SAMPLE_FOR_COMPARISON = 10

export function hasEnoughSample(n: number | undefined | null) {
  return typeof n === "number" && n >= MIN_SAMPLE_FOR_COMPARISON
}

// Seluruh dashboard memakai waktu Indonesia Tengah (Kupang, NTT). API mengirim
// timestamp UTC/ISO; konversi ke WITA murni tampilan.
const WITA_TZ = "Asia/Makassar"

export function formatDateTimeWITA(dateInput: string | number | Date) {
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) return "—"
  const s = date.toLocaleString("id-ID", {
    timeZone: WITA_TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
  return `${s} WITA`
}

export function formatTimeWITA(dateInput: string | number | Date) {
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) return "—"
  const s = date.toLocaleTimeString("id-ID", {
    timeZone: WITA_TZ,
    hour: "2-digit",
    minute: "2-digit",
  })
  return `${s} WITA`
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
