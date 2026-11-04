import PgBoss from "pg-boss";

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

let bossInstance: PgBoss | null = null;

export function getBoss(): PgBoss | null {
  if (!databaseUrl) {
    return null;
  }
  if (!bossInstance) {
    bossInstance = new PgBoss(databaseUrl);
  }
  return bossInstance;
}

export async function startWorker(): Promise<void> {
  const boss = getBoss();
  if (!boss) {
    console.warn("DATABASE_URL is not set. Background worker not started.");
    return;
  }

  await boss.start();

  // Scheduled cron jobs
  await boss.schedule("compute-group-status", "0 * * * *"); // Hourly status compute
  await boss.schedule("check-late-submissions", "0 * * * *"); // Hourly late submission check
  await boss.schedule("send-milestone-reminder", "0 1 * * *"); // 08:00 WIB (01:00 UTC) daily
  await boss.schedule("send-weekly-summary", "0 1 * * 1"); // 08:00 WIB (01:00 UTC) Monday
}
