import { CheckCircle2, CircleDashed, Clock, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Satu makna warna di seluruh aplikasi (brief §4.7):
//   success  → aktif / berhasil / disetujui
//   warning  → menunggu / diproses
//   danger   → ditangguhkan / gagal / ditolak
//   neutral  → nonaktif / segera / tidak diketahui
export type StatusTone = "success" | "warning" | "danger" | "neutral";

const TONE_ICON: Record<StatusTone, LucideIcon> = {
  success: CheckCircle2,
  warning: Clock,
  danger: XCircle,
  neutral: CircleDashed,
};

const TONE_VARIANT: Record<StatusTone, "success" | "warning" | "danger" | "neutral"> = {
  success: "success",
  warning: "warning",
  danger: "danger",
  neutral: "neutral",
};

// Peta status domain → nada + label Indonesia.
const STATUS_MAP: Record<string, { tone: StatusTone; label: string }> = {
  // toko / verifikasi
  approved: { tone: "success", label: "Disetujui" },
  pending: { tone: "warning", label: "Menunggu" },
  rejected: { tone: "danger", label: "Ditolak" },
  suspended: { tone: "neutral", label: "Disuspend" },
  // dokumen
  valid: { tone: "success", label: "Valid" },
  invalid: { tone: "danger", label: "Tidak valid" },
  needs_revision: { tone: "warning", label: "Perlu revisi" },
  // akun
  active: { tone: "success", label: "Aktif" },
  inactive: { tone: "neutral", label: "Nonaktif" },
};

export function resolveStatus(status: string): { tone: StatusTone; label: string } {
  return STATUS_MAP[status] ?? { tone: "neutral", label: status };
}

export function StatusBadge({
  status,
  tone: toneProp,
  label: labelProp,
  showIcon = true,
  className,
}: {
  /** Kunci status domain (approved / pending / valid / …). Opsional jika `tone`+`label` diberikan langsung. */
  status?: string;
  tone?: StatusTone;
  label?: string;
  showIcon?: boolean;
  className?: string;
}) {
  const resolved = status ? resolveStatus(status) : { tone: toneProp ?? "neutral", label: labelProp ?? "" };
  const tone = toneProp ?? resolved.tone;
  const label = labelProp ?? resolved.label;
  const Icon = TONE_ICON[tone];

  return (
    <Badge variant={TONE_VARIANT[tone]} className={cn("gap-1", className)}>
      {showIcon && <Icon className="size-3" />}
      {label}
    </Badge>
  );
}
