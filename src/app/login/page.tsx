"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@heroui/react";
import { Spinner } from "@/components/ui/spinner";
import { setSession, type AdminUser } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type LoginResponse = {
  token: string;
  user: AdminUser;
};

// SECURITY_AUDIT.md S3: no backend rate-limit exists on /auth/login yet, so
// this is a client-side speed bump only (a scripted attacker can clear
// localStorage) — real brute-force protection still has to land server-side.
const ATTEMPTS_KEY = "pk_login_attempts";
const COOLDOWN_AFTER_ATTEMPT = 2; // start throttling from the 2nd failure
const COOLDOWN_MS = 4000;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

type AttemptState = { count: number; lockedUntil: number | null };

function readAttempts(): AttemptState {
  try {
    const raw = window.localStorage.getItem(ATTEMPTS_KEY);
    if (!raw) return { count: 0, lockedUntil: null };
    return JSON.parse(raw) as AttemptState;
  } catch {
    return { count: 0, lockedUntil: null };
  }
}

function writeAttempts(state: AttemptState) {
  window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(state));
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    // One-time hydration from localStorage (an existing lock survives a
    // page reload) — not a value React needs to keep synchronized every
    // render, so a plain effect-on-mount is the right tool here.
    const attempts = readAttempts();
    if (attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBlockedUntil(attempts.lockedUntil);
    }
  }, []);

  useEffect(() => {
    if (!blockedUntil) return;
    const id = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= blockedUntil) clearInterval(id);
    }, 500);
    return () => clearInterval(id);
  }, [blockedUntil]);

  const remainingSeconds = blockedUntil ? Math.max(0, Math.ceil((blockedUntil - now) / 1000)) : 0;
  const isLocked = blockedUntil !== null && remainingSeconds > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const attempts = readAttempts();
    if (attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
      setBlockedUntil(attempts.lockedUntil);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        // 401 = wrong credentials, safe/useful to show as-is. Anything else
        // (5xx, network hiccup) may carry backend internals — keep it generic.
        if (res.status !== 401) {
          console.error("[login] request failed", res.status, data?.detail ?? data?.message);
        }
        throw new Error(
          res.status === 401
            ? (data?.detail ?? data?.message ?? "Email atau password salah.")
            : "Login gagal. Coba lagi beberapa saat lagi."
        );
      }

      const { token, user } = data as LoginResponse;

      if (user?.role !== "superadmin") {
        throw new Error("Akun ini bukan akun superadmin. Akses ditolak.");
      }

      writeAttempts({ count: 0, lockedUntil: null });
      setSession(token, user);
      const next = searchParams.get("next") ?? "/";
      router.push(next);
    } catch (err) {
      const nextCount = attempts.count + 1;
      if (nextCount >= MAX_ATTEMPTS) {
        const lockedUntil = Date.now() + LOCKOUT_MS;
        writeAttempts({ count: 0, lockedUntil });
        setBlockedUntil(lockedUntil);
        setError("Terlalu banyak percobaan gagal. Form dikunci sementara.");
      } else {
        writeAttempts({ count: nextCount, lockedUntil: null });
        if (nextCount >= COOLDOWN_AFTER_ATTEMPT) {
          setBlockedUntil(Date.now() + COOLDOWN_MS);
        }
        setError(err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-7 flex flex-col items-center text-center animate-fade-up">
        <div className="relative mb-4 flex size-14 items-center justify-center overflow-hidden rounded-2xl shadow-lg shadow-primary/30 ring-1 ring-white/40 ring-inset animate-float">
          <Image src="/pangkaskaka-logo.png" alt="PangkasKAKA" fill sizes="56px" className="object-cover" priority />
          <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-white bg-emerald-500" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">PangkasKAKA</h1>
        <p className="mt-1 text-sm text-muted-foreground">Masuk untuk mengelola platform</p>
      </div>

      <Card
        className="glass-card card-glow shadow-popover animate-fade-up [animation-delay:80ms]"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          e.currentTarget.style.setProperty("--glow-x", `${e.clientX - rect.left}px`);
          e.currentTarget.style.setProperty("--glow-y", `${e.clientY - rect.top}px`);
        }}
      >
        <div className="divider-gradient mx-4" />
        <Card.Content>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  autoFocus
                  placeholder="admin@pangkaskaka.id"
                  className="h-10 pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="h-10 pr-10 pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive animate-scale-in">
                {error}
                {isLocked && ` Coba lagi dalam ${remainingSeconds} detik.`}
              </div>
            )}

            <Button
              type="submit"
              className="btn-shine relative h-10 w-full gap-2 overflow-hidden shadow-glow"
              disabled={loading || isLocked}
            >
              {loading ? (
                <>
                  <Spinner color="brand" size="xs" label="Memproses..." />
                  Memproses...
                </>
              ) : isLocked ? (
                `Coba lagi dalam ${remainingSeconds}d`
              ) : (
                "Masuk"
              )}
            </Button>
          </form>
        </Card.Content>
      </Card>

      <p className="mt-6 text-center text-[11px] text-muted-foreground animate-fade-up [animation-delay:160ms]">
        Akses terbatas untuk administrator · © {new Date().getFullYear()} PangkasKAKA
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="bg-animated-mesh relative flex min-h-screen overflow-hidden">
      <div className="bg-noise pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -top-40 -left-32 size-[28rem] animate-float-soft rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 -bottom-40 size-[30rem] animate-float-soft rounded-full bg-violet-500/15 blur-3xl [animation-delay:-6s]" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 size-40 rounded-full bg-sky-500/10 blur-3xl" />

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}