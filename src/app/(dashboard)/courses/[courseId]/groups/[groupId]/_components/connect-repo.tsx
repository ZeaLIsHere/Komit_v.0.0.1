"use client";

import { useState } from "react";
import { connectRepo, disconnectRepo } from "@/actions/repository";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RepositoryData {
  id: string;
  fullName: string;
  connectionStatus: "CONNECTED" | "FAILED" | "REVOKED";
  backfillDoneAt: Date | string | null;
}

interface ConnectRepoProps {
  groupId: string;
  courseId: string;
  existingRepo?: RepositoryData | null;
  gitHubAppSlug?: string;
}

export function ConnectRepo({
  groupId,
  courseId,
  existingRepo,
  gitHubAppSlug = "komit-platform",
}: ConnectRepoProps) {
  const [repo, setRepo] = useState<RepositoryData | null>(existingRepo || null);
  const [showConsent, setShowConsent] = useState(false);
  const [manualFullName, setManualFullName] = useState("");
  const [manualInstallationId, setManualInstallationId] = useState("");
  const [manualRepoId, setManualRepoId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isConnected = repo?.connectionStatus === "CONNECTED";
  const isRevoked = repo?.connectionStatus === "REVOKED";
  const isFailed = repo?.connectionStatus === "FAILED";

  async function handleDisconnect() {
    if (!repo) return;
    const confirm = window.confirm(
      "Apakah Anda yakin ingin memutuskan hubungan repository? Data riwayat aktivitas yang sudah terekam akan tetap dipertahankan."
    );
    if (!confirm) return;

    setIsLoading(true);
    setErrorMessage(null);

    const res = await disconnectRepo(repo.id);
    setIsLoading(false);

    if (res.success) {
      setRepo({ ...repo, connectionStatus: "REVOKED" });
    } else {
      setErrorMessage(res.error || "Gagal memutuskan hubungan repository");
    }
  }

  async function handleManualConnect(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const res = await connectRepo(groupId, {
      fullName: manualFullName.trim(),
      installationId: manualInstallationId.trim(),
      githubRepoId: manualRepoId.trim(),
    });

    setIsLoading(false);

    if (res.success && res.data && typeof res.data === "object" && "id" in res.data) {
      setRepo(res.data as RepositoryData);
      setShowConsent(false);
    } else {
      setErrorMessage(res.error || "Gagal menghubungkan repository");
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <span>Repositori GitHub Kelompok</span>
              {isConnected && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  Terhubung
                </Badge>
              )}
              {isRevoked && <Badge variant="secondary">Izin Dicabut</Badge>}
              {isFailed && <Badge variant="destructive">Gagal Terhubung</Badge>}
              {!repo && <Badge variant="outline">Belum Terhubung</Badge>}
            </CardTitle>
            <CardDescription>
              Hubungkan repositori GitHub tempat kode proyek kelompok dikerjakan.
            </CardDescription>
          </div>

          {isConnected && repo && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={isLoading}
              className="text-destructive border-destructive/20 hover:bg-destructive/10"
            >
              {isLoading ? "Memproses..." : "Putuskan Koneksi"}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {errorMessage && (
          <div className="p-3 text-sm rounded-md bg-destructive/15 text-destructive font-medium">
            {errorMessage}
          </div>
        )}

        {isConnected && repo && (
          <div className="p-4 rounded-lg border bg-muted/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{repo.fullName}</span>
              <a
                href={`https://github.com/${repo.fullName}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Lihat di GitHub ↗
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              {repo.backfillDoneAt
                ? `Sinkronisasi awal selesai pada ${new Date(repo.backfillDoneAt).toLocaleString("id-ID")}`
                : "Sedang melakukan sinkronisasi awal riwayat aktivitas..."}
            </p>
          </div>
        )}

        {(isRevoked || isFailed) && (
          <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/50 space-y-2 text-sm text-amber-900">
            <div className="font-semibold">Perhatian Koneksi:</div>
            <p className="text-xs">
              {isRevoked
                ? "Koneksi repository telah dicabut. Untuk melanjutkan pemantauan aktivitas terbaru, silakan pasang ulang GitHub App atau hubungkan kembali."
                : "Koneksi gagal sinkronisasi. Pastikan GitHub App memiliki izin read-only untuk Contents, Pull Requests, dan Issues."}
            </p>
          </div>
        )}

        {(!isConnected || isRevoked || isFailed) && !showConsent && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Menghubungkan repositori memungkinkan sistem membaca aktivitas commit, pull request, dan issue secara otomatis tanpa penginputan manual.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setShowConsent(true)}>
                Hubungkan Repositori Baru
              </Button>
            </div>
          </div>
        )}

        {showConsent && (
          <div className="p-4 rounded-lg border border-primary/20 bg-muted/20 space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <span>🛡️ Transparansi & Persetujuan Data (UU PDP)</span>
              </h4>
              <ul className="text-xs space-y-1.5 text-muted-foreground list-disc pl-4">
                <li>
                  <strong className="text-foreground">Data yang dikumpulkan:</strong> Hanya metadata aktivitas (nama/email author commit, waktu commit, jumlah baris tambah/kurang, judul PR/Issue).
                </li>
                <li>
                  <strong className="text-foreground">Isi kode sumber:</strong> Kode sumber program kelompok <em>tidak pernah</em> disimpan, dibaca, atau disalin oleh sistem.
                </li>
                <li>
                  <strong className="text-foreground">Hak akses:</strong> Data hanya dapat dilihat oleh dosen pengampu dan seluruh anggota kelompok Anda sendiri.
                </li>
              </ul>
            </div>

            <div className="border-t pt-3 space-y-3">
              <h5 className="text-xs font-semibold">Langkah 1: Pasang GitHub App</h5>
              <p className="text-xs text-muted-foreground">
                Klik tombol di bawah untuk memasang GitHub App ke repository kelompok Anda:
              </p>
              <Button asChild variant="outline" size="sm">
                <a
                  href={`https://github.com/apps/${gitHubAppSlug}/installations/new`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Buka Halaman Instalasi GitHub App ↗
                </a>
              </Button>

              <h5 className="text-xs font-semibold pt-2">Langkah 2: Konfirmasi Data Repositori</h5>
              <form onSubmit={handleManualConnect} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-medium">Nama Repo (owner/repo)</label>
                    <Input
                      placeholder="contoh: kelompok-1/aplikasi-web"
                      className="text-xs mt-1"
                      value={manualFullName}
                      onChange={(e) => setManualFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Installation ID</label>
                    <Input
                      placeholder="Contoh: 12345678"
                      className="text-xs mt-1"
                      value={manualInstallationId}
                      onChange={(e) => setManualInstallationId(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">GitHub Repo ID</label>
                    <Input
                      placeholder="Contoh: 98765432"
                      className="text-xs mt-1"
                      value={manualRepoId}
                      onChange={(e) => setManualRepoId(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConsent(false)}
                    disabled={isLoading}
                  >
                    Batal
                  </Button>
                  <Button type="submit" size="sm" disabled={isLoading}>
                    {isLoading ? "Menghubungkan..." : "Saya Setuju & Hubungkan"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

