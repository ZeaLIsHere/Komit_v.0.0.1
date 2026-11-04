"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { completeProfile } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function OnboardingForm() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [nim, setNim] = React.useState("");
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
      setError("NIM harus berupa 7-14 digit angka");
      return;
    }

    startTransition(async () => {
      const result = await completeProfile({
        name: name.trim(),
        nim: nim.trim(),
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push("/courses");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="name"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Nama Lengkap
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="cth. Budi Pratama"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isPending}
          required
        />
        <p className="text-xs text-muted-foreground">
          Gunakan nama asli Anda sesuai daftar hadir perkuliahan.
        </p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="nim"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          NIM (Nomor Induk Mahasiswa)
        </label>
        <Input
          id="nim"
          name="nim"
          type="text"
          placeholder="cth. 211401001"
          value={nim}
          onChange={(e) => setNim(e.target.value)}
          disabled={isPending}
          required
        />
        <p className="text-xs text-muted-foreground">
          NIM digunakan dosen untuk mengenali kontribusi Anda dalam kelompok.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Menyimpan..." : "Simpan dan Lanjutkan"}
      </Button>
    </form>
  );
}
