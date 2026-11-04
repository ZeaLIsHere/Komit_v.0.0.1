"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, requireMember } from "@/lib/auth";

export type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

const mapIdentitySchema = z.object({
  repoId: z.string().min(1, "Repository ID harus diisi"),
  rawAuthor: z.string().min(1, "Nama / email author tidak boleh kosong"),
  targetUserId: z.string().min(1, "Pilih anggota kelompok tujuan"),
});

/**
 * Maps a raw Git author (commit author string/email) to an enrolled student.
 * Idempotently updates or creates an IdentityMapping and batch-updates ActivityEvents.
 */
export async function mapIdentity(
  rawInput: z.infer<typeof mapIdentitySchema>
): Promise<ActionResponse<{ updatedCount: number }>> {
  try {
    const user = await requireAuth();

    const parsed = mapIdentitySchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Input tidak valid",
      };
    }

    const { repoId, rawAuthor, targetUserId } = parsed.data;

    const repo = await db.repository.findUnique({
      where: { id: repoId },
      include: {
        group: {
          select: { id: true, courseId: true },
        },
      },
    });

    if (!repo) {
      return { success: false, error: "Repository tidak ditemukan" };
    }

    // Authorization: User must be a member of this group
    await requireMember(repo.group.id);

    // Verify target user is indeed a member of this group
    const targetMembership = await db.membership.findUnique({
      where: {
        userId_groupId: {
          userId: targetUserId,
          groupId: repo.group.id,
        },
      },
    });

    if (!targetMembership) {
      return {
        success: false,
        error: "Pengguna yang dipilih bukan anggota kelompok ini",
      };
    }

    // Upsert IdentityMapping record (tracks audit via createdById)
    await db.identityMapping.upsert({
      where: {
        repoId_rawAuthor: {
          repoId,
          rawAuthor,
        },
      },
      create: {
        repoId,
        rawAuthor,
        userId: targetUserId,
        createdById: user.id,
      },
      update: {
        userId: targetUserId,
        createdById: user.id,
      },
    });

    // Batch update all ActivityEvents with this raw author in this repo
    const updateResult = await db.activityEvent.updateMany({
      where: {
        repoId,
        githubAuthor: rawAuthor,
      },
      data: {
        userId: targetUserId,
      },
    });

    revalidatePath(`/courses/${repo.group.courseId}/groups/${repo.group.id}`);
    revalidatePath(`/courses/${repo.group.courseId}/groups/${repo.group.id}/mapping`);

    return {
      success: true,
      data: {
        updatedCount: updateResult.count,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memetakan identitas";
    return { success: false, error: message };
  }
}

/**
 * Removes an existing identity mapping and detaches the user attribution from affected events.
 */
export async function unmapIdentity(
  mappingId: string
): Promise<ActionResponse<null>> {
  try {
    await requireAuth();

    const mapping = await db.identityMapping.findUnique({
      where: { id: mappingId },
      include: {
        repo: {
          include: {
            group: {
              select: { id: true, courseId: true },
            },
          },
        },
      },
    });

    if (!mapping) {
      return { success: false, error: "Pemetaan identitas tidak ditemukan" };
    }

    // Authorization: User must be a member of this group
    await requireMember(mapping.repo.group.id);

    // Delete mapping
    await db.identityMapping.delete({
      where: { id: mappingId },
    });

    // Reset userId to null for all events matching this raw author in this repository
    await db.activityEvent.updateMany({
      where: {
        repoId: mapping.repoId,
        githubAuthor: mapping.rawAuthor,
      },
      data: {
        userId: null,
      },
    });

    revalidatePath(`/courses/${mapping.repo.group.courseId}/groups/${mapping.repo.group.id}`);
    revalidatePath(
      `/courses/${mapping.repo.group.courseId}/groups/${mapping.repo.group.id}/mapping`
    );

    return { success: true, data: null };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal menghapus pemetaan identitas";
    return { success: false, error: message };
  }
}
