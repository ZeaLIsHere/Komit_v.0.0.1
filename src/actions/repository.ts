"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getBoss } from "@/lib/worker";
import { requireMember } from "@/lib/auth";

export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

const connectRepoSchema = z.object({
  installationId: z.string().or(z.number()).transform(String),
  githubRepoId: z.string().or(z.number()).transform(String),
  fullName: z.string().min(3, "Nama repository tidak valid"),
});

/**
 * Connects a GitHub repository to a project group and enqueues a backfill job.
 */
export async function connectRepo(
  groupId: string,
  input: z.infer<typeof connectRepoSchema>
): Promise<ActionResult> {
  try {
    await requireMember(groupId);

    const parsed = connectRepoSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message || "Input tidak valid" };
    }

    const group = await db.group.findUnique({
      where: { id: groupId },
      select: { courseId: true },
    });

    if (!group) {
      return { success: false, error: "Kelompok tidak ditemukan" };
    }

    // Upsert repository record
    const repo = await db.repository.upsert({
      where: {
        githubRepoId: parsed.data.githubRepoId,
      },
      create: {
        groupId,
        githubRepoId: parsed.data.githubRepoId,
        installationId: parsed.data.installationId,
        fullName: parsed.data.fullName,
        connectionStatus: "CONNECTED",
      },
      update: {
        groupId,
        installationId: parsed.data.installationId,
        fullName: parsed.data.fullName,
        connectionStatus: "CONNECTED",
      },
    });

    // Enqueue backfill job to pg-boss
    const boss = getBoss();
    if (boss) {
      await boss.send("backfill", {
        repoId: repo.id,
        installationId: parsed.data.installationId,
      });
    }

    revalidatePath(`/courses/${group.courseId}/groups/${groupId}`);
    return { success: true, data: repo };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menghubungkan repository";
    return { success: false, error: message };
  }
}

/**
 * Disconnects a repository by marking connectionStatus = 'REVOKED'.
 * Retains existing activity data for grading integrity (F-24).
 */
export async function disconnectRepo(repoId: string): Promise<ActionResult> {
  try {
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

    await requireMember(repo.group.id);

    await db.repository.update({
      where: { id: repoId },
      data: {
        connectionStatus: "REVOKED",
      },
    });

    revalidatePath(`/courses/${repo.group.courseId}/groups/${repo.group.id}`);
    return { success: true, data: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memutuskan hubungan repository";
    return { success: false, error: message };
  }
}

