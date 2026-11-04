"use server";

import { requireLecturer } from "@/lib/auth";
import { getCourseExportData } from "@/lib/queries/course-export";

export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "Dikumpulkan",
  LATE: "Terlambat",
  PENDING: "Belum Dikumpulkan",
};

/**
 * Generates a CSV string with UTF-8 BOM for the given course.
 * Only accessible by the course's lecturer.
 */
export async function exportCourseCSV(
  courseId: string
): Promise<ActionResult<{ csv: string; filename: string }>> {
  try {
    await requireLecturer(courseId);

    const { milestones, rows } = await getCourseExportData(courseId);

    // Build header row
    const milestoneHeaders = milestones.map((m) => `Milestone: ${m.title}`);
    const headers = [
      "NIM",
      "Nama Mahasiswa",
      "Kelompok",
      "Commit",
      "PR Dibuka",
      "PR Digabung",
      "Review PR",
      "Hari Aktif",
      "Kontribusi Non-Kode",
      ...milestoneHeaders,
    ];

    const csvLines: string[] = [headers.join(",")];

    for (const row of rows) {
      const milestoneValues = milestones.map((m) => {
        const raw = row.milestoneStatuses[m.title] ?? "PENDING";
        return escapeCell(STATUS_LABEL[raw] ?? raw);
      });

      const cells = [
        escapeCell(row.nim),
        escapeCell(row.name),
        escapeCell(row.groupName),
        String(row.commitCount),
        String(row.prOpenedCount),
        String(row.prMergedCount),
        String(row.reviewCount),
        String(row.activeDays),
        escapeCell(row.nonCodeNotes),
        ...milestoneValues,
      ];

      csvLines.push(cells.join(","));
    }

    // UTF-8 BOM (\uFEFF) for Excel compatibility
    const csv = "\uFEFF" + csvLines.join("\n");

    const date = new Date().toISOString().slice(0, 10);
    const filename = `rekap-${courseId}-${date}.csv`;

    return { success: true, data: { csv, filename } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengekspor data";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wraps a cell in double-quotes and escapes inner double-quotes per RFC 4180. */
function escapeCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

