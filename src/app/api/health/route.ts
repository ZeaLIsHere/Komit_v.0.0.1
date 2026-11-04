import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBoss } from "@/lib/worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "connected";
  let dbLatency = 0;
  let dbError: string | null = null;

  try {
    const dbPingStart = Date.now();
    await db.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - dbPingStart;
  } catch (err) {
    dbStatus = "disconnected";
    dbError = err instanceof Error ? err.message : "Database connection failed";
  }

  const boss = getBoss();
  const workerStatus = boss ? "ready" : "unconfigured";

  const memory = process.memoryUsage();
  const formatMB = (bytes: number) => `${Math.round((bytes / 1024 / 1024) * 100) / 100} MB`;

  const isHealthy = dbStatus === "connected";

  const payload = {
    status: isHealthy ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    durationMs: Date.now() - startTime,
    database: {
      status: dbStatus,
      latencyMs: dbLatency,
      ...(dbError ? { error: dbError } : {}),
    },
    worker: {
      status: workerStatus,
    },
    system: {
      nodeVersion: process.version,
      memory: {
        rss: formatMB(memory.rss),
        heapTotal: formatMB(memory.heapTotal),
        heapUsed: formatMB(memory.heapUsed),
      },
    },
  };

  return NextResponse.json(payload, {
    status: isHealthy ? 200 : 503,
  });
}
