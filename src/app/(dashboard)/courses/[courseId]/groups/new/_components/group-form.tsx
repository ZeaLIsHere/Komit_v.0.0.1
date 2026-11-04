"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createGroup } from "@/actions/group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function GroupForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Nama kelompok minimal 2 karakter");
      return;
    }

    startTransition(async () => {
      const res = await createGroup(courseId, { name: name.trim() });
      if (!res.success) {
        setError(res.error);
        return;
      }

      router.push(`/courses/${courseId}`);
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
        <label htmlFor="groupName" className="text-sm font-medium">
          Nama Kelompok Proyek
        </label>
        <Input
          id="groupName"
          placeholder="cth. Kelompok 1 - Sistem Presensi"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isPending}
          required
        />
        <p className="text-xs text-muted-foreground">
          Kode undangan unik akan dibuat otomatis untuk dibagikan ke mahasiswa.
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Batal
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Menyimpan..." : "Buat Kelompok"}
        </Button>
      </div>
    </form>
  );
}
