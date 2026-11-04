import { db } from "@/lib/db";

export interface UserPreferences {
  emailGroupInactive: boolean;
  emailMilestoneReminder: boolean;
  emailWeeklySummary: boolean;
}

export async function getPreferences(userId: string): Promise<UserPreferences> {
  const prefs = await db.notificationPreference.findUnique({
    where: { userId },
  });

  return {
    emailGroupInactive: prefs?.emailGroupInactive ?? true,
    emailMilestoneReminder: prefs?.emailMilestoneReminder ?? true,
    emailWeeklySummary: prefs?.emailWeeklySummary ?? true,
  };
}

export async function getUserNotifications(userId: string, limit = 20) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
