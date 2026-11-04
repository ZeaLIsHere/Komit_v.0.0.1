import * as React from "react";
import { Resend } from "resend";
import { type NotifType } from "@prisma/client";
import { db } from "@/lib/db";
import { GroupInactiveEmail } from "@/emails/group-inactive";
import { MilestoneReminderEmail } from "@/emails/milestone-reminder";
import { WeeklySummaryEmail, type CourseSummaryItem } from "@/emails/weekly-summary";

export interface SendNotificationPayload {
  type: NotifType;
  userId: string;
  metadata?: Record<string, unknown>;
}

export interface SendNotificationResult {
  success: boolean;
  notificationId?: string;
  skipped?: boolean;
  error?: string;
}

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM || "Komit <notifikasi@komit.app>";
const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

let resendClient: Resend | null = null;
function getResendClient(): Resend | null {
  if (!resendApiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(resendApiKey);
  }
  return resendClient;
}

export async function sendNotificationEmail(
  payload: SendNotificationPayload
): Promise<SendNotificationResult> {
  const { type, userId, metadata = {} } = payload;

  // 1. Fetch user & preferences
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      notificationPrefs: true,
    },
  });

  if (!user || !user.email) {
    return {
      success: false,
      skipped: true,
      error: "User tidak ditemukan atau tidak memiliki email",
    };
  }

  const prefs = user.notificationPrefs;

  // 2. Check user preference
  if (type === "GROUP_INACTIVE" && prefs?.emailGroupInactive === false) {
    return { success: true, skipped: true };
  }
  if (
    (type === "MILESTONE_REMINDER_3D" || type === "MILESTONE_REMINDER_1D") &&
    prefs?.emailMilestoneReminder === false
  ) {
    return { success: true, skipped: true };
  }
  if (type === "WEEKLY_SUMMARY" && prefs?.emailWeeklySummary === false) {
    return { success: true, skipped: true };
  }

  // 3. Idempotency: Check if similar notification sent in last 24 hours
  const past24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const existingNotification = await db.notification.findFirst({
    where: {
      userId,
      type,
      createdAt: {
        gte: past24Hours,
      },
    },
  });

  // For milestone reminders or inactive alerts, compare reference ID if present
  if (existingNotification && metadata.refId) {
    const existingMeta = existingNotification.metadata as Record<string, unknown> | null;
    if (existingMeta?.refId === metadata.refId) {
      return { success: true, skipped: true, notificationId: existingNotification.id };
    }
  } else if (existingNotification && type === "WEEKLY_SUMMARY") {
    // Only one weekly summary per 24h
    return { success: true, skipped: true, notificationId: existingNotification.id };
  }

  // 4. Create Notification record in PENDING state
  const notification = await db.notification.create({
    data: {
      userId,
      type,
      status: "PENDING",
      metadata: metadata as object,
    },
  });

  // 5. Build email template and subject
  let subject = "Notifikasi Komit";
  let reactElement: React.ReactElement | null = null;

  switch (type) {
    case "GROUP_INACTIVE": {
      const groupName = (metadata.groupName as string) ?? "Kelompok";
      const courseName = (metadata.courseName as string) ?? "Mata Kuliah";
      const daysInactive = (metadata.daysInactive as number) ?? 14;
      const lastActivityDate = metadata.lastActivityDate as string | undefined;
      const courseId = metadata.courseId as string | undefined;
      const groupId = metadata.groupId as string | undefined;

      subject = `[Komit] Peringatan: ${groupName} tidak aktif selama ${daysInactive} hari`;
      reactElement = React.createElement(GroupInactiveEmail, {
        groupName,
        courseName,
        daysInactive,
        lastActivityDate,
        dashboardUrl: `${appUrl}/courses/${courseId}/groups/${groupId}`,
      });
      break;
    }

    case "MILESTONE_REMINDER_3D":
    case "MILESTONE_REMINDER_1D": {
      const daysRemaining = type === "MILESTONE_REMINDER_3D" ? 3 : 1;
      const milestoneTitle = (metadata.milestoneTitle as string) ?? "Milestone";
      const courseName = (metadata.courseName as string) ?? "Mata Kuliah";
      const groupName = (metadata.groupName as string) ?? "Kelompok";
      const dueAt = (metadata.dueAt as string) ?? "-";
      const courseId = metadata.courseId as string | undefined;

      subject = `[Komit] Pengingat Tenggat: ${milestoneTitle} (${daysRemaining} hari lagi)`;
      reactElement = React.createElement(MilestoneReminderEmail, {
        recipientName: user.name || user.username,
        milestoneTitle,
        courseName,
        groupName,
        daysRemaining,
        dueAt,
        submissionUrl: `${appUrl}/courses/${courseId}/milestones`,
      });
      break;
    }

    case "WEEKLY_SUMMARY": {
      const weekRange = (metadata.weekRange as string) ?? "Minggu Ini";
      const courses = (metadata.courses as CourseSummaryItem[]) ?? [];

      subject = `[Komit] Ringkasan Mingguan Aktivitas Proyek (${weekRange})`;
      reactElement = React.createElement(WeeklySummaryEmail, {
        lecturerName: user.name || user.username,
        weekRange,
        courses,
        dashboardUrl: `${appUrl}/courses`,
      });
      break;
    }
  }

  // 6. Send email via Resend
  const resend = getResendClient();
  if (!resend || !reactElement) {
    console.warn(
      `[sendNotificationEmail] RESEND_API_KEY is not configured or template missing. Marking notification ${notification.id} as SENT (mock).`
    );
    await db.notification.update({
      where: { id: notification.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
      },
    });
    return { success: true, notificationId: notification.id };
  }

  try {
    const { error: sendError } = await resend.emails.send({
      from: emailFrom,
      to: user.email,
      subject,
      react: reactElement,
    });

    if (sendError) {
      await db.notification.update({
        where: { id: notification.id },
        data: {
          status: "FAILED",
        },
      });
      return { success: false, error: sendError.message, notificationId: notification.id };
    }

    await db.notification.update({
      where: { id: notification.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
      },
    });

    return { success: true, notificationId: notification.id };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Error sending email";
    await db.notification.update({
      where: { id: notification.id },
      data: {
        status: "FAILED",
      },
    });
    return { success: false, error: errMsg, notificationId: notification.id };
  }
}
