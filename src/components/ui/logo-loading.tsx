"use client";

import Image from "next/image";
import { Scissors } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function LogoLoading({
  label = "Memuat...",
  compact = false,
  className,
}: {
  label?: string;
  compact?: boolean;
  className?: string;
}) {
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2.5 text-sm text-muted-foreground", className)}>
        <div className="relative size-7 overflow-hidden rounded-lg border border-border bg-background shadow-soft">
          <Image
            src="/pangkaskaka-logo.png"
            alt="PangkasKAKA"
            fill
            sizes="28px"
            className="object-contain"
            priority
          />
        </div>
        <Spinner color="brand" size="sm" label={label} />
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 animate-fade-in">
      <div className="relative">
        <span className="absolute inset-0 -m-6 animate-ping rounded-[2rem] bg-primary/10 [animation-duration:2.2s]" />
        <span className="absolute -inset-3 rounded-3xl bg-primary/10 blur-xl" />
        <div className="relative flex size-28 items-center justify-center overflow-hidden rounded-3xl border border-border bg-background shadow-card animate-scale-in">
          <Image
            src="/pangkaskaka-logo.png"
            alt="PangkasKAKA"
            width={112}
            height={112}
            className="h-full w-full object-contain"
            priority
          />
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner color="brand" size="sm" label={label} />
        <Scissors className="size-3.5 text-primary/60" />
        <span>{label}</span>
      </div>
    </div>
  );
}