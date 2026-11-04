"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, requireLecturer } from "@/lib/auth";

export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

const createCourseSchema = z.object({
  name: z.string().min(3, "Nama mata kuliah minimal 3 karakter"),
  code: z.string().min(2, "Kode mata kuliah minimal 2 karakter"),
  semester: z.string().min(2, "Semester harus diisi"),
  academicYear: z.string().min(4, "Tahun ajaran harus diisi"),
});

const updateThresholdsSchema = z
  .object({
    slow: z.number().int().min(1, "Batas melambat minimal 1 hari"),
    inactive: z.number().int().min(2, "Batas tidak aktif minimal 2 hari"),
  })
  .refine((data) => data.slow < data.inactive, {
    message: "Batas melambat (slow) harus lebih kecil daripada batas tidak aktif (inactive)",
    path: ["inactive"],
  });

const updateExcludePatternsSchema = z.object({
  patterns: z.array(z.string().trim()).default([]),
});

/**
 * Creates a new course under the authenticated lecturer.
 */
export async function createCourse(
  input: z.infer<typeof createCourseSchema>
): Promise<ActionResult> {
  try {
    const user = await requireAuth();

    if (user.role !== "LECTURER") {
      return { success: false, error: "Hanya dosen yang dapat membuat mata kuliah" };
    }

    const parsed = createCourseSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message || "Input tidak valid" };
    }

    const formattedSemester = parsed.data.academicYear
      ? `${parsed.data.semester} ${parsed.data.academicYear}`
      : parsed.data.semester;

    const course = await db.course.create({
      data: {
        name: parsed.data.name,
        code: parsed.data.code,
        semester: formattedSemester,
        lecturerId: user.id,
      },
    });

    revalidatePath("/courses");
    return { success: true, data: course };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat mata kuliah";
    return { success: false, error: message };
  }
}

/**
 * Archives a course when the semester ends.
 */
export async function archiveCourse(courseId: string): Promise<ActionResult> {
  try {
    await requireLecturer(courseId);

    const updated = await db.course.update({
      where: { id: courseId },
      data: { archived: true },
    });

    revalidatePath("/courses");
    revalidatePath(`/courses/${courseId}`);
    return { success: true, data: updated };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengarsipkan mata kuliah";
    return { success: false, error: message };
  }
}

/**
 * Updates activity threshold days for slow and inactive alerts.
 */
export async function updateThresholds(
  courseId: string,
  thresholds: { slow: number; inactive: number }
): Promise<ActionResult> {
  try {
    await requireLecturer(courseId);

    const parsed = updateThresholdsSchema.safeParse(thresholds);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message || "Nilai ambang batas tidak valid" };
    }

    const updated = await db.course.update({
      where: { id: courseId },
      data: {
        slowThreshold: parsed.data.slow,
        inactiveThreshold: parsed.data.inactive,
      },
    });

    revalidatePath(`/courses/${courseId}/settings`);
    return { success: true, data: updated };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui ambang batas";
    return { success: false, error: message };
  }
}

/**
 * Updates custom file exclude patterns for noise filtering.
 */
export async function updateExcludePatterns(
  courseId: string,
  patterns: string[]
): Promise<ActionResult> {
  try {
    await requireLecturer(courseId);

    const parsed = updateExcludePatternsSchema.safeParse({ patterns });
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message || "Pola file tidak valid" };
    }

    const cleanedPatterns = parsed.data.patterns.filter((p) => p.length > 0);

    const updated = await db.course.update({
      where: { id: courseId },
      data: {
        excludePatterns: cleanedPatterns,
      },
    });

    revalidatePath(`/courses/${courseId}/settings`);
    return { success: true, data: updated };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui pola pengecualian";
    return { success: false, error: message };
  }
}

