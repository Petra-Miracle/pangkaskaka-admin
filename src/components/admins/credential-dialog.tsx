"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type IssuedCredential = {
  title: string;
  email?: string;
  password: string;
};

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Gagal menyalin otomatis — salin manual dari kotak di atas.");
    }
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-muted/50 px-3 py-2 font-mono text-sm">
          {value}
        </code>
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={copy}
          aria-label={`Salin ${label}`}
          title={`Salin ${label}`}
        >
          {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
        </Button>
      </div>
    </div>
  );
}

// Dialog "tampil sekali" untuk kredensial yang dikeluarkan backend (password
// akun admin baru, atau hasil reset password). Dikontrol penuh oleh parent:
// beri `credential` untuk membuka, `onClose` dipanggil saat ditutup.
export function CredentialDialog({
  credential,
  onClose,
}: {
  credential: IssuedCredential | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={!!credential}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <KeyRound className="size-4" />
            </span>
            {credential?.title}
          </DialogTitle>
          <DialogDescription>
            Password ini hanya ditampilkan sekali. Salin sekarang dan sampaikan ke admin toko lewat jalur
            aman — dashboard tidak menyimpan salinannya. Kalau hilang, lakukan reset password dari halaman ini.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {credential?.email && <CopyRow label="Email" value={credential.email} />}
          {credential && <CopyRow label="Password" value={credential.password} />}
        </div>

        <DialogFooter>
          <DialogClose render={<Button>Sudah saya simpan</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
