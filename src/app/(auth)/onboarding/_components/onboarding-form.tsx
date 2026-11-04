"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { completeProfile } from "@/actions/auth";
import { joinGroup } from "@/actions/group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export interface OnboardingFormProps {
  initialName?: string;
  githubUsername?: string;
}

export function OnboardingForm({
  initialName = "",
  githubUsername = "",
}: OnboardingFormProps) {
  const router = useRouter();
  const [name, setName] = React.useState(initialName);
  const [nim, setNim] = React.useState("");
  const [inviteCode, setInviteCode] = React.useState("");
  const [consentPdp, setConsentPdp] = React.useState(true);
  const [consentTelemetry, setConsentTelemetry] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Nama lengkap minimal 2 karakter");
      return;
    }

    if (!/^\d{7,14}$/.test(nim.trim())) {
      setError("NIM harus berupa 7-14 digit angka (sesuai KTM USU)");
      return;
    }

    if (!consentPdp || !consentTelemetry) {
      setError("Anda wajib menyetujui kepatuhan etika dan kebijakan UU PDP untuk melanjutkan.");
      return;
    }

    startTransition(async () => {
      // 1. Complete student profile
      const result = await completeProfile({
        name: name.trim(),
        nim: nim.trim(),
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      // 2. If student provided an invite code, join group automatically
      if (inviteCode.trim()) {
        const joinResult = await joinGroup(inviteCode.trim());
        if (!joinResult.success) {
          // Profile succeeded, but group code failed. Redirect to courses with warning or let them know.
          // Still proceed to courses so onboarding is finished
          router.push("/courses");
          router.refresh();
          return;
        }
      }

      router.push("/courses");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Linear Stepper Indicator */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Step 1 */}
          <div className="flex items-center gap-3 p-2.5 bg-primary-container/10 border border-primary-container/30 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xs shrink-0">
              1
            </div>
            <div>
              <div className="text-xs font-bold text-primary">Identitas Akademik</div>
              <div className="text-[11px] text-on-surface-variant">Validasi NIM & SIA</div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-center gap-3 p-2.5 bg-surface-container-low border border-outline-variant rounded-lg">
            <div className="w-7 h-7 rounded-full bg-surface-container-highest text-primary font-bold text-xs flex items-center justify-center border border-outline-variant shrink-0">
              2
            </div>
            <div>
              <div className="text-xs font-semibold text-on-surface">Etika & PDP</div>
              <div className="text-[11px] text-on-surface-variant">UU No. 27/2022</div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-center gap-3 p-2.5 bg-surface-container-low border border-outline-variant rounded-lg">
            <div className="w-7 h-7 rounded-full bg-surface-container-highest text-primary font-bold text-xs flex items-center justify-center border border-outline-variant shrink-0">
              3
            </div>
            <div>
              <div className="text-xs font-semibold text-on-surface">Kode Token</div>
              <div className="text-[11px] text-on-surface-variant">Opsional Kelompok</div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Academic Identity */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-sm font-bold text-on-surface">
                Langkah 1: Identitas Akademik Terverifikasi
              </h2>
              <p className="text-[11px] text-on-surface-variant">
                Hubungkan akun GitHub Anda (@{githubUsername}) dengan basis data perkuliahan USU.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
            SIA USU
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <label
              htmlFor="name"
              className="block text-xs font-semibold text-on-surface"
            >
              Nama Lengkap (Sesuai KTM / SIA) <span className="text-destructive">*</span>
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="cth. Muhammad Hafiz Lubis"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              required
              className="h-10 text-sm bg-surface-container-low border-outline-variant focus:border-primary-container"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label
              htmlFor="nim"
              className="block text-xs font-semibold text-on-surface"
            >
              Nomor Induk Mahasiswa (NIM) <span className="text-destructive">*</span>
            </label>
            <Input
              id="nim"
              name="nim"
              type="text"
              placeholder="cth. 221401088"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              disabled={isPending}
              required
              className="h-10 text-sm font-mono bg-surface-container-low border-outline-variant focus:border-primary-container"
            />
            <p className="text-[11px] text-on-surface-variant">
              NIM digunakan dosen dan asisten lab untuk memetakan kepemilikan komit dan PR Anda.
            </p>
          </div>
        </div>
      </div>

      {/* STEP 2: PDP & Academic Ethics Agreement */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-outline-variant/60">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-on-surface">
              Langkah 2: Persetujuan Etika & Kebijakan Perlindungan Data (UU PDP)
            </h2>
            <p className="text-[11px] text-on-surface-variant">
              Kepatuhan hukum terhadap UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 rounded-lg border border-outline-variant bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors">
            <input
              type="checkbox"
              checked={consentPdp}
              onChange={(e) => setConsentPdp(e.target.checked)}
              className="mt-0.5 rounded border-outline-variant text-primary focus:ring-primary h-4 w-4"
            />
            <div className="text-xs text-on-surface leading-normal">
              <span className="font-semibold block text-on-surface">
                Persetujuan Pemrosesan Telemetri Git Akademik
              </span>
              <span className="text-on-surface-variant text-[11px] mt-0.5 block">
                Saya mengizinkan sistem membaca metadata komit, waktu perubahan berkas tugas besar, 
                dan aktivitas kolaborasi tim untuk keperluan audit objektif perkuliahan.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-outline-variant bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors">
            <input
              type="checkbox"
              checked={consentTelemetry}
              onChange={(e) => setConsentTelemetry(e.target.checked)}
              className="mt-0.5 rounded border-outline-variant text-primary focus:ring-primary h-4 w-4"
            />
            <div className="text-xs text-on-surface leading-normal">
              <span className="font-semibold block text-on-surface">
                Klausul Pembinaan & Evaluasi Formatif
              </span>
              <span className="text-on-surface-variant text-[11px] mt-0.5 block">
                Saya memahami bahwa statistik aktivitas GitHub bukan penentu nilai otomatis, 
                melainkan instrumen pembinaan dan bahan diskusi kualitatif bersama dosen pengampu.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* STEP 3: Optional Invite Token */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 pb-2">
          <div className="w-7 h-7 rounded-lg bg-surface-container text-primary flex items-center justify-center">
            <KeyRound className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-on-surface">
              Langkah 3: Kode Token Kelompok (Opsional)
            </h2>
            <p className="text-[11px] text-on-surface-variant">
              Jika ketua kelompok sudah memberikan kode token 8-karakter, masukkan di sini.
            </p>
          </div>
        </div>

        <div>
          <Input
            id="inviteCode"
            type="text"
            placeholder="cth. A3F89C12 (Dapat dilewati jika belum ada)"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            disabled={isPending}
            className="h-10 text-xs font-mono tracking-wider bg-surface-container-low border-outline-variant focus:border-primary-container uppercase"
          />
        </div>
      </div>

      {/* Final Action Button */}
      <Button
        type="submit"
        size="lg"
        className="w-full bg-primary-container hover:bg-primary text-white font-semibold text-sm gap-2 shadow-xs h-11"
        disabled={isPending}
      >
        <span>
          {isPending ? "Menyimpan Data..." : "Selesaikan Registrasi & Masuk Dashboard"}
        </span>
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
