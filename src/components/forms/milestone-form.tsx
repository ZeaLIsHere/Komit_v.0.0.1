"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createMilestone } from "@/actions/milestone";
import { MILESTONE_TEMPLATES, type MilestoneTemplateItem } from "@/lib/templates/milestones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface MilestoneFormProps {
  courseId: string;
}

function formatDateTimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function MilestoneForm({ courseId }: MilestoneFormProps) {
  const router = useRouter();
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string>("");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [dueAt, setDueAt] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    setSelectedTemplateId(templateId);

    if (!templateId) return;

    for (const cat of MILESTONE_TEMPLATES) {
      const found = cat.milestones.find((m) => m.id === templateId);
      if (found) {
        setTitle(found.title);
        setDescription(found.description);

        const target = new Date();
        target.setDate(target.getDate() + found.offsetDays);
        target.setHours(23, 59, 0, 0);
        setDueAt(formatDateTimeLocal(target));
        break;
      }
    }
  };

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

      {/* Template selector */}
      <div className="space-y-1.5 p-3.5 rounded-lg border bg-muted/30">
        <div className="flex items-center justify-between">
          <label
            htmlFor="template"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Pilihan Cepat: Gunakan Template Milestone
          </label>
          {selectedTemplateId && (
            <button
              type="button"
              onClick={() => {
                setSelectedTemplateId("");
                setTitle("");
                setDescription("");
                setDueAt("");
              }}
              className="text-[11px] text-muted-foreground hover:text-foreground underline"
            >
              Reset Form
            </button>
          )}
        </div>
        <select
          id="template"
          aria-label="Pilih Template Milestone"
          value={selectedTemplateId}
          onChange={handleTemplateChange}
          disabled={isPending}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">-- Pilih Template Mata Kuliah USU --</option>
          {MILESTONE_TEMPLATES.map((cat) => (
            <optgroup key={cat.id} label={`${cat.name} (${cat.code})`}>
              {cat.milestones.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} (+{m.offsetDays} hari)
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <p className="text-[11px] text-muted-foreground">
          Memilih template akan otomatis mengisi judul, deskripsi kriteria, dan default jarak tenggat waktu.
        </p>
      </div>

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
