"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireLecturer, requireMember } from "@/lib/auth";
import { db } from "@/lib/db";
import { type Milestone, type Submission } from "@prisma/client";

export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const createMilestoneSchema = z.object({
  title: z.string().trim().min(2, "Judul milestone minimal 2 karakter"),
  description: z.string().trim().optional(),
  dueAt: z
    .string()
    .datetime({ message: "Format tanggal tidak valid" })
    .or(z.date()),
});

export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;

export async function createMilestone(
  courseId: string,
  rawInput: CreateMilestoneInput
): Promise<ActionResponse<Milestone>> {
  try {
    await requireLecturer(courseId);

    const parsed = createMilestoneSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Input tidak valid",
      };
    }

    const { title, description, dueAt } = parsed.data;
    const dueDate = new Date(dueAt);

    // Create milestone and auto-create PENDING submissions for all groups in course
    const milestone = await db.$transaction(async (tx) => {
      const createdMilestone = await tx.milestone.create({
        data: {
          courseId,
          title,
          description: description || null,
          dueAt: dueDate,
        },
      });

      const groups = await tx.group.findMany({
        where: { courseId },
        select: { id: true },
      });

      if (groups.length > 0) {
        await tx.submission.createMany({
          data: groups.map((g) => ({
            milestoneId: createdMilestone.id,
            groupId: g.id,
            status: "PENDING",
            links: [],
          })),
        });
      }

      return createdMilestone;
    });

    revalidatePath(`/courses/${courseId}/milestones`);

    return {
      success: true,
      data: milestone,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat milestone";
    return { success: false, error: message };
  }
}

const submitMilestoneSchema = z.object({
  links: z
    .array(z.string().url("Tautan harus berupa URL yang valid (cth. https://...)"))
    .min(1, "Minimal sertakan 1 tautan hasil pengerjaan"),
});

export type SubmitMilestoneInput = z.infer<typeof submitMilestoneSchema>;

export async function submitMilestone(
  submissionId: string,
  rawInput: SubmitMilestoneInput
): Promise<ActionResponse<Submission>> {
  try {
    const parsed = submitMilestoneSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Input tidak valid",
      };
    }

    const submission = await db.submission.findUnique({
      where: { id: submissionId },
      include: {
        milestone: true,
      },
    });

    if (!submission) {
      return { success: false, error: "Data pengumpulan tidak ditemukan" };
    }

    // Verify user is a member of the group
    await requireMember(submission.groupId);

    const now = new Date();
    const isLate = now.getTime() > submission.milestone.dueAt.getTime();
    const newStatus = isLate ? "LATE" : "SUBMITTED";

    const updatedSubmission = await db.submission.update({
      where: { id: submissionId },
      data: {
        links: parsed.data.links,
        status: newStatus,
        submittedAt: now,
      },
    });

    revalidatePath(`/courses/${submission.milestone.courseId}/milestones`);

    return {
      success: true,
      data: updatedSubmission,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal mengumpulkan milestone";
    return { success: false, error: message };
  }
}

const addLecturerNoteSchema = z.object({
  note: z.string().trim().min(1, "Catatan tidak boleh kosong"),
});

export type AddLecturerNoteInput = z.infer<typeof addLecturerNoteSchema>;

export async function addLecturerNote(
  submissionId: string,
  rawInput: AddLecturerNoteInput
): Promise<ActionResponse<Submission>> {
  try {
    const parsed = addLecturerNoteSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Catatan tidak valid",
      };
    }

    const submission = await db.submission.findUnique({
      where: { id: submissionId },
      include: {
        milestone: {
          select: {
            courseId: true,
          },
        },
      },
    });

    if (!submission) {
      return { success: false, error: "Data pengumpulan tidak ditemukan" };
    }

    await requireLecturer(submission.milestone.courseId);

    const updatedSubmission = await db.submission.update({
      where: { id: submissionId },
      data: {
        lecturerNote: parsed.data.note,
      },
    });

    revalidatePath(`/courses/${submission.milestone.courseId}/milestones`);

    return {
      success: true,
      data: updatedSubmission,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal menyimpan catatan";
    return { success: false, error: message };
  }
}
