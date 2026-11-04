"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { type NotificationPreference } from "@prisma/client";

export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const updatePreferencesSchema = z.object({
  emailGroupInactive: z.boolean(),
  emailMilestoneReminder: z.boolean(),
  emailWeeklySummary: z.boolean(),
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;

export async function updatePreferences(
  rawInput: UpdatePreferencesInput
): Promise<ActionResponse<NotificationPreference>> {
  try {
    const user = await requireAuth();

    const parsed = updatePreferencesSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Input tidak valid",
      };
    }

    const { emailGroupInactive, emailMilestoneReminder, emailWeeklySummary } =
      parsed.data;

    const updated = await db.notificationPreference.upsert({
      where: { userId: user.id },
      update: {
        emailGroupInactive,
        emailMilestoneReminder,
        emailWeeklySummary,
      },
      create: {
        userId: user.id,
        emailGroupInactive,
        emailMilestoneReminder,
        emailWeeklySummary,
      },
    });

    revalidatePath("/settings");

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal memperbarui preferensi";
    return { success: false, error: message };
  }
}
