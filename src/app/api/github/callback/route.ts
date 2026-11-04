import { NextRequest, NextResponse } from "next/server";
import { generateInstallationToken } from "@/lib/github";

export const runtime = "nodejs";

/**
 * Handles callback from GitHub App installation.
 * GitHub redirects here after a user installs the GitHub App with query params:
 * ?installation_id=...&setup_action=install
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const installationId = searchParams.get("installation_id");
  const setupAction = searchParams.get("setup_action");

  if (!installationId) {
    return NextResponse.json(
      { error: "Parameter installation_id tidak ditemukan" },
      { status: 400 }
    );
  }

  try {
    // Verify installation access token can be acquired
    const token = await generateInstallationToken(installationId);

    // Fetch repositories accessible to this installation
    const res = await fetch("https://api.github.com/installation/repositories", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "Komit-Platform",
      },
    });

    if (!res.ok) {
      console.error(`[GitHub Callback] Gagal fetch repositori: ${res.status}`);
    }

    // Redirect user back to the active dashboard or connect-repo modal
    // Pass installationId in query params so the frontend can display selectable repos
    const redirectUrl = new URL("/courses", req.url);
    redirectUrl.searchParams.set("github_installation_id", installationId);
    if (setupAction) {
      redirectUrl.searchParams.set("setup_action", setupAction);
    }

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("[GitHub Callback Error]", error);
    return NextResponse.json(
      { error: "Gagal memproses instalasi GitHub App" },
      { status: 500 }
    );
  }
}

