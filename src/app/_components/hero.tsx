import Link from "next/link";
import { Button } from "@/components/ui/button";

export interface HeroProps {
  isAuthenticated: boolean;
}

export function Hero({ isAuthenticated }: HeroProps) {
  return (
    <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 border-b">
      <div className="max-w-4xl mx-auto text-center space-y-6 px-4">
        {/* Category Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/60 px-3 py-1 text-xs text-muted-foreground font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Fokus Pilot: Program Studi S1 Ilmu Komputer USU</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.15]">
          Pantau Aktivitas Proyek Kelompok Otomatis dari GitHub
        </h1>

        {/* Supporting Paragraph */}
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Dosen melihat keaktifan nyata seluruh kelompok dalam satu layar.
          Mahasiswa fokus berkarya tanpa perlu menginput progres tugas dua kali.
        </p>

        {/* Primary CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {isAuthenticated ? (
            <Button asChild size="lg" className="w-full sm:w-auto h-11 px-8 text-sm">
              <Link href="/courses">Buka Dashboard Saya →</Link>
            </Button>
          ) : (
            <Button asChild size="lg" className="w-full sm:w-auto h-11 px-8 text-sm gap-2">
              <Link href="/login">
                <svg
                  className="h-4 w-4 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
                Masuk dengan GitHub
              </Link>
            </Button>
          )}

          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto h-11 px-6 text-sm">
            <Link href="#cara-kerja">Pelajari Cara Kerja</Link>
          </Button>
        </div>

        {/* Honest Value Props Ribbon */}
        <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left border-t border-dashed mt-8">
          <div className="space-y-0.5">
            <p className="font-semibold text-foreground text-sm">Zero Input Manual</p>
            <p className="text-xs text-muted-foreground">Langsung tersinkronisasi dari webhook GitHub.</p>
          </div>
          <div className="space-y-0.5">
            <p className="font-semibold text-foreground text-sm">Filter Noise Bawaan</p>
            <p className="text-xs text-muted-foreground">Lockfile & merge commit tidak dihitung.</p>
          </div>
          <div className="space-y-0.5">
            <p className="font-semibold text-foreground text-sm">Deteksi Dini</p>
            <p className="text-xs text-muted-foreground">Peringatan otomatis saat kelompok pasif.</p>
          </div>
          <div className="space-y-0.5">
            <p className="font-semibold text-foreground text-sm">Aman & Terbuka</p>
            <p className="text-xs text-muted-foreground">Izin read-only, tanpa menyimpan kode sumber.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
