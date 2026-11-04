"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, requireMember } from "@/lib/auth";
import { truncateToWeek } from "@/lib/week";

export type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

const addNonCodeContributionSchema = z.object({
  description: z
    .string()
    .trim()
    .min(3, "Deskripsi kontribusi minimal 3 karakter")
    .max(500, "Deskripsi maksimal 500 karakter"),
});

/**
 * Adds a non-code contribution note (design, testing, research, documentation)
 * for the authenticated member in their group (F-44).
 */
export async function addNonCodeContribution(
  groupId: string,
  rawInput: z.infer<typeof addNonCodeContributionSchema>
): Promise<ActionResponse> {
  try {
    const user = await requireAuth();

    const parsed = addNonCodeContributionSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Input tidak valid",
      };
    }

    // Verify user is a member of this group
    const { membership } = await requireMember(groupId);

    const group = await db.group.findUnique({
      where: { id: groupId },
      select: { courseId: true },
    });

    if (!group) {
      return { success: false, error: "Kelompok tidak ditemukan" };
    }

    const currentWeek = truncateToWeek(new Date());

    const contribution = await db.nonCodeContribution.create({
      data: {
        membershipId: membership.id,
        description: parsed.data.description,
        week: currentWeek,
      },
    });

    revalidatePath(`/courses/${group.courseId}/groups/${groupId}`);

    return {
      success: true,
      data: contribution,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal menambahkan kontribusi non-kode";
    return { success: false, error: message };
  }
}
