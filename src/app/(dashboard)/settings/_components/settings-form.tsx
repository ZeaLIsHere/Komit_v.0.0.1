"use client";

import * as React from "react";
import { updatePreferences } from "@/actions/notification";
import { Button } from "@/components/ui/button";

export interface SettingsFormProps {
  isLecturer: boolean;
  initialPreferences: {
    emailGroupInactive: boolean;
    emailMilestoneReminder: boolean;
    emailWeeklySummary: boolean;
  };
}

export function SettingsForm({
  isLecturer,
  initialPreferences,
}: SettingsFormProps) {
  const [emailGroupInactive, setEmailGroupInactive] = React.useState(
    initialPreferences.emailGroupInactive
  );
  const [emailMilestoneReminder, setEmailMilestoneReminder] = React.useState(
    initialPreferences.emailMilestoneReminder
  );
  const [emailWeeklySummary, setEmailWeeklySummary] = React.useState(
    initialPreferences.emailWeeklySummary
  );

  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const res = await updatePreferences({
        emailGroupInactive,
        emailMilestoneReminder,
        emailWeeklySummary,
      });

      if (!res.success) {
        setFeedback({ type: "error", message: res.error });
        return;
      }

      setFeedback({
        type: "success",
        message: "Pengaturan notifikasi berhasil disimpan.",
      });
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {feedback && (
        <div
          className={`rounded-md p-3 text-sm font-medium ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-destructive/15 text-destructive"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="space-y-4">
        {/* Toggle 1: Group Inactivity */}
        {isLecturer && (
          <label className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={emailGroupInactive}
              onChange={(e) => setEmailGroupInactive(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-ring"
              disabled={isPending}
            />
            <div className="space-y-0.5">
              <span className="text-sm font-medium leading-none">
                Peringatan Kelompok Tidak Aktif
              </span>
              <p className="text-xs text-muted-foreground">
                Kirim email saat ada kelompok yang melampaui batas ambang hari tanpa aktivitas di GitHub.
              </p>
            </div>
          </label>
        )}

        {/* Toggle 2: Milestone Reminder */}
        <label className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={emailMilestoneReminder}
            onChange={(e) => setEmailMilestoneReminder(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-ring"
            disabled={isPending}
          />
          <div className="space-y-0.5">
            <span className="text-sm font-medium leading-none">
              Pengingat Tenggat Milestone (H-3 dan H-1)
            </span>
            <p className="text-xs text-muted-foreground">
              Kirim email pengingat 3 hari dan 1 hari sebelum batas waktu pengumpulan milestone berakhir.
            </p>
          </div>
        </label>

        {/* Toggle 3: Weekly Summary (Lecturer only) */}
        {isLecturer && (
          <label className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={emailWeeklySummary}
              onChange={(e) => setEmailWeeklySummary(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-ring"
              disabled={isPending}
            />
            <div className="space-y-0.5">
              <span className="text-sm font-medium leading-none">
                Ringkasan Mingguan Dosen
              </span>
              <p className="text-xs text-muted-foreground">
                Kirim rekap email setiap hari Senin pukul 08:00 WIB mengenai status seluruh kelompok dan milestone tertunda.
              </p>
            </div>
          </label>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>
    </form>
  );
}
