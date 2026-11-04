import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBoss } from "@/lib/worker";
import { verifyWebhookSignature } from "@/lib/github";

export const runtime = "nodejs";

/**
 * GitHub Webhook receiver endpoint.
 * Validates HMAC-SHA256 signature and immediately delegates processing to pg-boss background worker.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256");
    const eventType = req.headers.get("x-github-event");
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("[Webhook] GITHUB_WEBHOOK_SECRET tidak dikonfigurasi di environment");
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    // 1. Verify HMAC-SHA256 signature
    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.warn("[Webhook] Signature HMAC-SHA256 tidak valid");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    if (!eventType) {
      return NextResponse.json({ error: "Missing x-github-event header" }, { status: 400 });
    }

    const body = JSON.parse(rawBody);

    // 2. Identify repository
    const installationId = body.installation?.id ? String(body.installation.id) : null;
    const githubRepoId = body.repository?.id ? String(body.repository.id) : null;

    let repo = null;

    if (githubRepoId) {
      repo = await db.repository.findUnique({
        where: { githubRepoId },
      });
    }

    if (!repo && installationId) {
      repo = await db.repository.findFirst({
        where: { installationId },
      });
    }

    // If the repository is not connected to any group on Komit, acknowledge and ignore
    if (!repo) {
      return NextResponse.json({ message: "Repository not connected, ignored" }, { status: 200 });
    }

    // 3. Enqueue job to pg-boss
    const boss = getBoss();
    if (boss) {
      await boss.send("process-webhook-event", {
        eventType,
        body,
        repoId: repo.id,
      });
    }

    return NextResponse.json({ message: "Event enqueued successfully" }, { status: 200 });
  } catch (error) {
    console.error("[Webhook Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

