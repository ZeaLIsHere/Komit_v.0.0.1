"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MemberMetricsSummary } from "@/lib/metrics";
import { addNonCodeContribution } from "@/actions/contribution";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MemberIndicatorsProps {
  groupId: string;
  members: MemberMetricsSummary[];
  isCurrentMember: boolean;
}

export function MemberIndicators({
  groupId,
  members,
  isCurrentMember,
}: MemberIndicatorsProps) {
  const router = useRouter();
  const [showAddNonCode, setShowAddNonCode] = useState(false);
  const [nonCodeText, setNonCodeText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleAddNonCode(e: React.FormEvent) {
    e.preventDefault();
    if (!nonCodeText.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await addNonCodeContribution(groupId, {
      description: nonCodeText.trim(),
    });

    setIsSubmitting(false);

    if (res.success) {
      setNonCodeText("");
      setShowAddNonCode(false);
      router.refresh();
    } else {
      setErrorMsg(res.error || "Gagal menambahkan kontribusi non-kode");
    }
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">
                Indikator Aktivitas per Anggota Kelompok
              </CardTitle>
              <CardDescription className="text-xs">
                Aktivitas dihitung transparan dari repositori GitHub dan catatan kontribusi non-kode. Arahkan kursor pada judul kolom untuk melihat penjelasan metrik.
              </CardDescription>
            </div>

            {isCurrentMember && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddNonCode((prev) => !prev)}
                className="text-xs shrink-0"
              >
                {showAddNonCode ? "Tutup Form" : "+ Tambah Kontribusi Non-Kode"}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Modal / Inline Form for Non-Code Contribution */}
          {showAddNonCode && (
            <form
              onSubmit={handleAddNonCode}
              className="p-4 rounded-lg border bg-muted/40 space-y-3"
            >
              <div className="space-y-1">
                <h4 className="text-xs font-semibold">Catat Kontribusi Non-Kode Minggu Ini</h4>
                <p className="text-[11px] text-muted-foreground">
                  Laporkan pekerjaan seperti desain UI/UX di Figma, riset jurnal, dokumentasi API, atau pengujian perangkat lunak agar diakui oleh dosen.
                </p>
              </div>

              {errorMsg && (
                <div className="p-2 text-xs rounded bg-destructive/15 text-destructive font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder="Contoh: Merancang wireframe antarmuka modul checkout di Figma dan menulis skenario pengujian manual"
                  value={nonCodeText}
                  onChange={(e) => setNonCodeText(e.target.value)}
                  className="text-xs"
                  required
                />
                <Button type="submit" size="sm" disabled={isSubmitting || !nonCodeText.trim()}>
                  {isSubmitting ? "Menyimpan..." : "Kirim Catatan"}
                </Button>
              </div>
            </form>
          )}

          {/* Table of Members */}
          <div className="border rounded-md overflow-x-auto text-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted text-xs uppercase text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3">Nama Anggota</th>

                  {/* Commits Tooltip */}
                  <th className="p-3">
                    <Tooltip>
                      <TooltipTrigger className="cursor-help underline decoration-dotted flex items-center gap-1">
                        Commit
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs space-y-1">
                        <p className="font-semibold">Cara Hitung Commit:</p>
                        <p>
                          Jumlah commit yang telah melalui filter noise (lockfile, merge commit, dan perubahan whitespace diabaikan).
                        </p>
                        <p className="text-muted-foreground text-[10px]">
                          Keterbatasan: Tidak mengukur kualitas logika kode, hanya frekuensi commit bermakna.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </th>

                  {/* PR Tooltip */}
                  <th className="p-3">
                    <Tooltip>
                      <TooltipTrigger className="cursor-help underline decoration-dotted flex items-center gap-1">
                        PR Dibuka / Merge
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs space-y-1">
                        <p className="font-semibold">Pull Request (PR):</p>
                        <p>
                          Total pull request yang dibuka dan berhasil di-merge. Pada squash merge, kontribusi diatribusikan ke pembuat PR, bukan hanya penekan tombol merge.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </th>

                  {/* Reviews Tooltip */}
                  <th className="p-3">
                    <Tooltip>
                      <TooltipTrigger className="cursor-help underline decoration-dotted flex items-center gap-1">
                        Review / Komentar
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs space-y-1">
                        <p className="font-semibold">Review & Diskusi:</p>
                        <p>
                          Menghitung code review resmi dan komentar pada pull request. Mencerminkan kolaborasi dan pemeriksaan kode sesama anggota tim.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </th>

                  {/* Issues Tooltip */}
                  <th className="p-3">
                    <Tooltip>
                      <TooltipTrigger className="cursor-help underline decoration-dotted flex items-center gap-1">
                        Issue
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs space-y-1">
                        <p className="font-semibold">Pelacakan Masalah / Issue:</p>
                        <p>
                          Jumlah issue yang dibuat dan ditutup untuk manajemen tugas kelompok.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </th>

                  {/* Active Days Tooltip */}
                  <th className="p-3">
                    <Tooltip>
                      <TooltipTrigger className="cursor-help underline decoration-dotted flex items-center gap-1">
                        Hari Aktif
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs space-y-1">
                        <p className="font-semibold">Hari Aktif Bekerja:</p>
                        <p>
                          Jumlah tanggal kalender unik di mana anggota melakukan minimal 1 aksi Git (commit, PR, atau review).
                        </p>
                        <p className="text-muted-foreground text-[10px]">
                          Mencegah bias kerja maraton menit-menit terakhir sebelum deadline.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </th>

                  <th className="p-3">Status & Catatan Non-Kode</th>
                </tr>
              </thead>

              <tbody className="divide-y text-xs">
                {members.map((member) => (
                  <tr key={member.userId} className="hover:bg-muted/30">
                    <td className="p-3">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <span>{member.name}</span>
                          {member.isLeader && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary/30 text-primary">
                              Ketua
                            </Badge>
                          )}
                        </div>
                        <div className="text-muted-foreground text-[11px]">
                          {member.nim ? `NIM: ${member.nim}` : `@${member.username}`}
                        </div>
                      </div>
                    </td>

                    <td className="p-3 font-mono font-medium">
                      {member.totalCommits}
                    </td>

                    <td className="p-3 font-mono font-medium">
                      {member.totalPrs}
                    </td>

                    <td className="p-3 font-mono font-medium">
                      {member.totalReviews}
                    </td>

                    <td className="p-3 font-mono font-medium">
                      {member.totalIssues}
                    </td>

                    <td className="p-3 font-mono font-medium">
                      <span className="bg-muted px-2 py-0.5 rounded">
                        {member.totalActiveDays} hari
                      </span>
                    </td>

                    <td className="p-3 space-y-1">
                      {member.flags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {member.flags.map((flag, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-[10px] bg-amber-50 text-amber-800 border-amber-200"
                            >
                              ⚠️ {flag.message}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {member.nonCodeContributions.length > 0 ? (
                        <div className="space-y-1">
                          <span className="text-[11px] font-medium text-primary block">
                            {member.nonCodeContributions.length} catatan kontribusi non-kode:
                          </span>
                          <ul className="list-disc pl-4 text-[10px] text-muted-foreground space-y-0.5">
                            {member.nonCodeContributions.slice(0, 2).map((c) => (
                              <li key={c.id} className="line-clamp-1" title={c.description}>
                                {c.description}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        member.flags.length === 0 && (
                          <span className="text-muted-foreground text-[11px]">-</span>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded-md bg-muted/20 text-xs text-muted-foreground flex items-center justify-between">
            <span>
              💡 <strong>Pernyataan Nilai:</strong> Seluruh indikator di atas adalah instrumen transparansi, <u>bukan skor tunggal otomatis</u>.
            </span>
            <span className="text-[10px] font-mono">F-45 / F-63 Compliance</span>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
