import * as React from "react";

export interface ConsentBannerProps {
  className?: string;
}

export function ConsentBanner({ className = "" }: ConsentBannerProps) {
  return (
    <div
      className={`rounded-lg border border-border bg-muted/40 p-4 text-xs space-y-2.5 ${className}`}
    >
      <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
        <svg
          className="h-4 w-4 text-primary shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
        <span>Transparansi dan Privasi Data Mahasiswa</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-muted-foreground pt-1">
        <div className="space-y-1">
          <p className="font-medium text-foreground">Data yang Dikumpulkan</p>
          <p>
            Hanya metadata publik: author, waktu commit, judul PR/issue, dan
            jumlah baris. <strong>Isi kode sumber tidak pernah disimpan</strong>.
          </p>
        </div>

        <div className="space-y-1">
          <p className="font-medium text-foreground">Akses Terbatas</p>
          <p>
            Hanya dosen pengampu mata kuliah Anda dan rekan satu kelompok yang
            dapat melihat ringkasan aktivitas repositori ini.
          </p>
        </div>

        <div className="space-y-1">
          <p className="font-medium text-foreground">Hak Penghapusan Data</p>
          <p>
            Seluruh catatan aktivitas proyek dapat dihapus secara permanen atas
            permintaan kelompok setelah semester perkuliahan berakhir.
          </p>
        </div>
      </div>
    </div>
  );
}
