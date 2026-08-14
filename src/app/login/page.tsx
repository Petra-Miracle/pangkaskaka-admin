"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Scissors,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { setSession, type AdminUser } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type LoginResponse = {
  token: string;
  user: AdminUser;
};

const FEATURES = [
  { icon: ShieldCheck, title: "Verifikasi toko", desc: "Review dokumen dan kelola antrian pendaftaran barbershop." },
  { icon: Store, title: "Pengawasan operasional", desc: "Pantau toko, rating, dan toko berisiko dalam satu layar." },
  { icon: Users, title: "Manajemen pengguna", desc: "Cari dan filter seluruh akun di platform dengan cepat." },
];

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
    if (!blockedUntil) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [blockedUntil]);

  useEffect(() => {
    if (blockedUntil && now >= blockedUntil) setBlockedUntil(null);
  }, [blockedUntil, now]);

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

      if (user?.role !== "admin") {
        throw new Error("Akun ini bukan akun admin. Akses ditolak.");
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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -bottom-32 size-96 rounded-full bg-primary/15 blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="relative mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/30 ring-1 ring-white/40 ring-inset">
            <Scissors className="size-6.5" />
            <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-white bg-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">PangkasKAKA Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Masuk dengan akun admin untuk mengelola platform.
          </p>
        </div>

        <Card className="shadow-2xl shadow-primary/10">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="admin@pangkaskaka.id"
                    className="h-9 pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    className="h-9 pr-9 pl-9"
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

              <Button type="submit" className="h-9 w-full gap-2 shadow-md shadow-primary/20" disabled={loading || isLocked}>
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
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          PangkasKAKA SuperAdmin Console · Akses terbatas untuk administrator platform.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="bg-animated-mesh flex min-h-screen">
      {/* Brand panel (desktop only) */}
      <div className="hero-panel relative hidden w-[46%] shrink-0 overflow-hidden lg:block">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-20" />
        <div className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 -bottom-24 size-96 rounded-full bg-white/5 blur-3xl" />

        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/30 backdrop-blur-md">
              <Scissors className="size-5.5" />
            </div>
            <div className="leading-tight">
              <p className="text-base font-bold tracking-tight">PangkasKAKA</p>
              <p className="text-xs font-medium text-white/60">SuperAdmin Console</p>
            </div>
          </div>

          <div className="max-w-md">
            <h2 className="text-3xl leading-tight font-bold tracking-tight">
              Kelola seluruh platform
              <span className="text-gradient-hero"> barbershop Kupang</span> dari satu tempat.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Verifikasi toko baru, pantau operasional, dan awasi pertumbuhan bisnis para mitra PangkasKAKA.
            </p>

            <div className="mt-8 space-y-4">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 backdrop-blur-md">
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-xs text-white/60">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} PangkasKAKA · Kupang, NTT
          </p>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}