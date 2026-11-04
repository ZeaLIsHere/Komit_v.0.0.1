"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createMilestone } from "@/actions/milestone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface MilestoneFormProps {
  courseId: string;
}

export function MilestoneForm({ courseId }: MilestoneFormProps) {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [dueAt, setDueAt] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 2) {
      setError("Judul milestone minimal 2 karakter");
      return;
    }

    if (!dueAt) {
      setError("Tenggat waktu wajib diisi");
      return;
    }

    const dueDate = new Date(dueAt);
    if (isNaN(dueDate.getTime())) {
      setError("Format tanggal tenggat tidak valid");
      return;
    }

    startTransition(async () => {
      const result = await createMilestone(courseId, {
        title: title.trim(),
        description: description.trim() || undefined,
        dueAt: dueDate.toISOString(),
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push(`/courses/${courseId}/milestones`);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="title"
          className="text-sm font-medium leading-none"
        >
          Judul Milestone
        </label>
        <Input
          id="title"
          name="title"
          type="text"
          placeholder="cth. Milestone 1: Desain Basis Data & Skema ER"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isPending}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="description"
          className="text-sm font-medium leading-none"
        >
          Deskripsi & Ketentuan Pengumpulan
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder="Jelaskan kriteria kelulusan milestone dan tautan apa saja yang wajib disertakan oleh mahasiswa (dokumen SRS, repo GitHub, video demo, dll)."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isPending}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="dueAt"
          className="text-sm font-medium leading-none"
        >
          Tenggat Waktu Pengumpulan
        </label>
        <Input
          id="dueAt"
          name="dueAt"
          type="datetime-local"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          disabled={isPending}
          required
        />
        <p className="text-xs text-muted-foreground">
          Kelompok yang belum mengumpulkan saat melewati tenggat ini akan otomatis ditandai Terlambat.
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Batal
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Menyimpan..." : "Buat Milestone"}
        </Button>
      </div>
    </form>
  );
}
