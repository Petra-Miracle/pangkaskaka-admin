"use client";

import { type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export function SearchBox({
  placeholder,
  value,
  onChange,
  icon,
  busy,
}: {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  icon: ReactNode;
  busy?: boolean;
}) {
  return (
    <div className="relative flex-1 sm:max-w-sm">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-9 pl-9"
        aria-label={placeholder}
      />
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">
        {busy ? <Spinner size="xs" color="brand" label="Mencari..." /> : icon}
      </span>
      {busy && (
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] font-medium text-muted-foreground animate-pulse">
          Mencari…
        </span>
      )}
    </div>
  );
}