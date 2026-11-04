import Link from "next/link";

export function Footer() {
  return (
    <footer className="py-12 bg-background border-t text-xs text-muted-foreground">
      <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <p className="font-semibold text-foreground text-sm">Komit Platform</p>
          <p>
            Platform Pemantauan Proyek Kelompok Mahasiswa · Program Studi Ilmu Komputer USU
          </p>
        </div>

        <div className="flex items-center gap-6">
          <Link
            href="/panduan"
            className="hover:text-foreground transition-colors"
          >
            Panduan Pengguna
          </Link>
          <Link
            href="/login"
            className="hover:text-foreground transition-colors"
          >
            Masuk
          </Link>
          <a
            href="https://github.com/ZeaLIsHere/Komit_v.0.0.1"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Repositori GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
