import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { OnboardingForm } from "./_components/onboarding-form";
import { Terminal, Shield, CheckCircle2, Lock, Scale, GraduationCap } from "lucide-react";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Dosen or students who already filled both name and nim skip onboarding
  if (
    session.user.role === "LECTURER" ||
    (session.user.name && session.user.nim)
  ) {
    redirect("/courses");
  }

  const githubUsername =
    session.user.name ||
    (session.user.email ? session.user.email.split("@")[0] : null) ||
    "mahasiswa-usu";

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      {/* Top Academic Navigation / Header */}
      <header className="bg-surface sticky top-0 z-40 border-b border-outline-variant bg-surface/90 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-white shadow-xs">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-sm sm:text-base font-bold text-primary tracking-tight">
                  USU CS Project Pulse
                </span>
                <span className="text-[10px] font-mono uppercase bg-secondary-fixed text-on-secondary-fixed font-bold px-1.5 py-0.5 rounded border border-secondary/20">
                  FASILKOM-TI
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant hidden sm:block">
                Laboratorium Rekayasa Perangkat Lunak & Basis Data
              </p>
            </div>
          </div>

          {/* GitHub Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-lg border border-outline-variant">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-medium text-on-surface">
              @{githubUsername}
            </span>
            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200 hidden sm:inline">
              GitHub Terhubung
            </span>
          </div>
        </div>
      </header>

      {/* Main Canvas Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Top Context Banner */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-primary uppercase tracking-wider mb-1">
                <Shield className="h-3.5 w-3.5 text-emerald-600" />
                <span>Portal Onboarding Mandiri Mahasiswa</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                Registrasi Profil & Persetujuan Kepatuhan Etika
              </h1>
              <p className="text-on-surface-variant text-sm mt-1 max-w-3xl leading-relaxed">
                Sistem pengawasan terdistribusi berbasis Git untuk perkuliahan Ilmu Komputer USU. 
                Data aktivitas commits dan PR diproses secara proporsional demi evaluasi tim yang akuntabel, terlindungi UU Perlindungan Data Pribadi (UU PDP No. 27/2022).
              </p>
            </div>
            <div className="shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high text-primary text-xs font-semibold rounded-lg border border-outline-variant">
                <GraduationCap className="h-4 w-4 text-primary" />
                Fasilkom-TI USU
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Layout: Form Flow vs Institutional Side Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Stages (8 Columns) */}
          <div className="lg:col-span-8">
            <OnboardingForm
              initialName={session.user.name ?? ""}
              githubUsername={githubUsername}
            />
          </div>

          {/* Right Column: Institutional Policy Side Panel (4 Columns) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-outline-variant">
                <Scale className="h-5 w-5 text-primary" />
                <h3 className="font-display text-sm font-bold text-on-surface">
                  Prinsip Etika & UU PDP (No. 27/2022)
                </h3>
              </div>

              <div className="space-y-3.5 text-xs text-on-surface-variant leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <strong className="text-on-surface font-semibold block">
                      Tujuan Evaluasi Formatif
                    </strong>
                    Data aktivitas Git dianalisis untuk pembinaan dan diskusi kelompok, bukan penentu nilai otomatis dosen.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <strong className="text-on-surface font-semibold block">
                      Akses Metadata Terbatas
                    </strong>
                    Sistem hanya membaca log komit, PR, dan issue pada repositori tugas. Konten pribadi Anda tidak pernah diakses.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Shield className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <strong className="text-on-surface font-semibold block">
                      Hak Klarifikasi Mahasiswa
                    </strong>
                    Mahasiswa selalu berhak mengklarifikasi kontribusi teknis dan non-koding kepada dosen sebelum evaluasi akhir.
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-outline-variant text-[11px] text-on-surface-variant/80">
                Lembaga Penjaminan Mutu & Etika Akademik Fasilkom-TI Universitas Sumatera Utara.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
