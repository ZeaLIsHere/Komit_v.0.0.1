"use client";

import * as React from "react";
import { addLecturerNote, submitMilestone } from "@/actions/milestone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface SubmissionGroupItem {
  id: string;
  status: "PENDING" | "SUBMITTED" | "LATE";
  links: string[];
  lecturerNote: string | null;
  submittedAt: Date | string | null;
  group: {
    id: string;
    name: string;
    memberships?: {
      user: {
        id: string;
        name: string | null;
        nim: string | null;
        username: string;
      };
    }[];
  };
}

export interface MilestoneTrackerProps {
  milestoneId: string;
  title: string;
  description: string | null;
  dueAt: Date | string;
  totalGroups: number;
  submittedCount: number;
  lateCount: number;
  pendingCount: number;
  isLecturer: boolean;
  submissions?: SubmissionGroupItem[];
  studentSubmission?: {
    id: string;
    status: "PENDING" | "SUBMITTED" | "LATE";
    links: string[];
    lecturerNote: string | null;
    submittedAt: Date | string | null;
    groupName: string;
  } | null;
}

export function MilestoneStatusBadge({
  status,
}: {
  status: "PENDING" | "SUBMITTED" | "LATE";
}) {
  switch (status) {
    case "SUBMITTED":
      return (
        <Badge
          variant="default"
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Tepat Waktu
        </Badge>
      );
    case "LATE":
      return <Badge variant="destructive">Terlambat</Badge>;
    case "PENDING":
    default:
      return <Badge variant="secondary">Belum Kumpul</Badge>;
  }
}

export function MilestoneTracker({
  title,
  description,
  dueAt,
  totalGroups,
  submittedCount,
  lateCount,
  pendingCount,
  isLecturer,
  submissions = [],
  studentSubmission,
}: MilestoneTrackerProps) {
  const [activeTabOpen, setActiveTabOpen] = React.useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    React.useState<SubmissionGroupItem | null>(null);

  // Lecturer note modal state
  const [noteText, setNoteText] = React.useState("");
  const [isNotePending, startNoteTransition] = React.useTransition();
  const [noteError, setNoteError] = React.useState<string | null>(null);

  // Student submit modal state
  const [isSubmitOpen, setIsSubmitOpen] = React.useState(false);
  const [linkInput, setLinkInput] = React.useState("");
  const [linkList, setLinkList] = React.useState<string[]>(
    studentSubmission?.links ?? []
  );
  const [isSubmitPending, startSubmitTransition] = React.useTransition();
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const completedCount = submittedCount + lateCount;
  const progressPercent =
    totalGroups > 0 ? Math.round((completedCount / totalGroups) * 100) : 0;

  const dueDate = new Date(dueAt);
  const formattedDueDate = dueDate.toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleOpenNote = (sub: SubmissionGroupItem) => {
    setSelectedSubmission(sub);
    setNoteText(sub.lecturerNote ?? "");
    setNoteError(null);
  };

  const handleSaveNote = () => {
    if (!selectedSubmission) return;
    setNoteError(null);

    startNoteTransition(async () => {
      const res = await addLecturerNote(selectedSubmission.id, {
        note: noteText.trim(),
      });
      if (!res.success) {
        setNoteError(res.error);
        return;
      }
      selectedSubmission.lecturerNote = res.data.lecturerNote;
      setSelectedSubmission(null);
    });
  };

  const handleAddLink = () => {
    const trimmed = linkInput.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
      setLinkList([...linkList, trimmed]);
      setLinkInput("");
    } catch {
      setSubmitError("URL tidak valid. Sertakan protokol seperti https://");
    }
  };

  const handleRemoveLink = (index: number) => {
    setLinkList(linkList.filter((_, i) => i !== index));
  };

  const handleSubmitLinks = () => {
    if (!studentSubmission) return;
    setSubmitError(null);

    if (linkList.length === 0) {
      setSubmitError("Minimal sertakan 1 tautan hasil pengerjaan");
      return;
    }

    startSubmitTransition(async () => {
      const res = await submitMilestone(studentSubmission.id, {
        links: linkList,
      });

      if (!res.success) {
        setSubmitError(res.error);
        return;
      }

      setIsSubmitOpen(false);
    });
  };

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {description}
            </p>
          )}
          <p className="text-xs text-muted-foreground pt-1">
            Tenggat:{" "}
            <span className="font-medium text-foreground">
              {formattedDueDate}
            </span>
          </p>
        </div>

        {/* Action Button for Student */}
        {!isLecturer && studentSubmission && (
          <div className="flex items-center gap-2">
            <MilestoneStatusBadge status={studentSubmission.status} />
            <Button
              size="sm"
              variant={
                studentSubmission.status === "PENDING" ? "default" : "outline"
              }
              onClick={() => {
                setLinkList(studentSubmission.links ?? []);
                setSubmitError(null);
                setIsSubmitOpen(true);
              }}
            >
              {studentSubmission.status === "PENDING"
                ? "Kumpulkan Milestone"
                : "Ubah Pengumpulan"}
            </Button>
          </div>
        )}
      </div>

      {/* Progress Bar for Lecturer */}
      {isLecturer && (
        <div className="space-y-2 pt-2 border-t">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              Progres Pengumpulan: {completedCount} dari {totalGroups} Kelompok (
              {progressPercent}%)
            </span>
            <div className="flex gap-3">
              <span className="text-emerald-600 font-medium">
                {submittedCount} Tepat Waktu
              </span>
              <span className="text-destructive font-medium">
                {lateCount} Terlambat
              </span>
              <span>{pendingCount} Belum Kumpul</span>
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Toggle view submissions */}
          {submissions.length > 0 && (
            <div className="pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground h-8 px-2"
                onClick={() => setActiveTabOpen(!activeTabOpen)}
              >
                {activeTabOpen
                  ? "Sembunyikan Daftar Kelompok"
                  : `Lihat Pengumpulan (${submissions.length} Kelompok)`}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Student View Details: Show links & notes */}
      {!isLecturer && studentSubmission && (
        <div className="space-y-2 pt-2 border-t text-sm">
          {studentSubmission.links.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Tautan Terkumpul:
              </p>
              <ul className="list-disc list-inside space-y-1 pt-1">
                {studentSubmission.links.map((link, i) => (
                  <li key={i}>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline break-all"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Belum ada tautan yang dikumpulkan oleh kelompok Anda.
            </p>
          )}

          {studentSubmission.lecturerNote && (
            <div className="rounded-md bg-muted/50 p-3 mt-2 border text-xs space-y-1">
              <p className="font-semibold text-foreground">Catatan Dosen:</p>
              <p className="text-muted-foreground">
                {studentSubmission.lecturerNote}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Lecturer Expanded Submissions Table */}
      {isLecturer && activeTabOpen && (
        <div className="mt-3 border rounded-md overflow-hidden text-sm">
          <table className="w-full text-left">
            <thead className="bg-muted text-muted-foreground text-xs font-medium">
              <tr>
                <th className="p-3">Nama Kelompok</th>
                <th className="p-3">Status</th>
                <th className="p-3">Waktu Kumpul</th>
                <th className="p-3">Tautan</th>
                <th className="p-3">Catatan Dosen</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-muted/40 transition-colors">
                  <td className="p-3 font-medium">{sub.group.name}</td>
                  <td className="p-3">
                    <MilestoneStatusBadge status={sub.status} />
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {sub.submittedAt
                      ? new Date(sub.submittedAt).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </td>
                  <td className="p-3 text-xs max-w-xs truncate">
                    {sub.links.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {sub.links.map((link, idx) => (
                          <a
                            key={idx}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline truncate"
                          >
                            {link}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground max-w-xs truncate">
                    {sub.lecturerNote || "-"}
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleOpenNote(sub)}
                    >
                      Beri Catatan
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog for Lecturer Note */}
      <Dialog
        open={Boolean(selectedSubmission)}
        onOpenChange={(open) => !open && setSelectedSubmission(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Catatan Dosen untuk {selectedSubmission?.group.name}
            </DialogTitle>
            <DialogDescription>
              Tulis catatan atau feedback untuk kelompok ini terkait pengumpulan
              milestone.
            </DialogDescription>
          </DialogHeader>

          {noteError && (
            <div className="rounded-md bg-destructive/15 p-2.5 text-xs text-destructive font-medium">
              {noteError}
            </div>
          )}

          <div className="space-y-2">
            <textarea
              rows={4}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              disabled={isNotePending}
              placeholder="cth. Dokumentasi skema sudah cukup baik, perlu menambahkan normalisasi bentuk ketiga (3NF)."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedSubmission(null)}
              disabled={isNotePending}
            >
              Batal
            </Button>
            <Button onClick={handleSaveNote} disabled={isNotePending}>
              {isNotePending ? "Menyimpan..." : "Simpan Catatan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for Student Milestone Submission */}
      <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kumpulkan {title}</DialogTitle>
            <DialogDescription>
              Masukkan tautan pengerjaan proyek (dokumen, repo GitHub, slide, atau
              video demo).
            </DialogDescription>
          </DialogHeader>

          {submitError && (
            <div className="rounded-md bg-destructive/15 p-2.5 text-xs text-destructive font-medium">
              {submitError}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="https://github.com/..."
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddLink();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={handleAddLink}>
                Tambah
              </Button>
            </div>

            {linkList.length > 0 && (
              <div className="space-y-1.5 border rounded-md p-2 max-h-48 overflow-y-auto text-xs">
                {linkList.map((link, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 p-1.5 rounded hover:bg-muted"
                  >
                    <span className="truncate">{link}</span>
                    <button
                      type="button"
                      className="text-destructive font-bold px-1"
                      onClick={() => handleRemoveLink(idx)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSubmitOpen(false)}
              disabled={isSubmitPending}
            >
              Batal
            </Button>
            <Button onClick={handleSubmitLinks} disabled={isSubmitPending}>
              {isSubmitPending ? "Menyimpan..." : "Kirim Pengumpulan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
