"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MemberMetricsSummary } from "@/lib/metrics";
import { addNonCodeContribution } from "@/actions/contribution";
import { removeMember } from "@/actions/group";
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
  isLecturer?: boolean;
}

export function MemberIndicators({
  groupId,
  members,
  isCurrentMember,
  isLecturer = false,
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
      <Card className="w-full bg-surface-container-lowest border-outline-variant shadow-xs">
        <CardHeader className="border-b border-outline-variant/60 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="font-display text-sm font-bold text-on-surface">
                Indikator Aktivitas per Anggota Kelompok
              </CardTitle>
              <CardDescription className="text-xs text-on-surface-variant mt-0.5">
                Aktivitas dihitung transparan dari repositori GitHub dan catatan kontribusi non-kode. Arahkan kursor pada judul kolom untuk melihat penjelasan metrik.
              </CardDescription>
            </div>

            {isCurrentMember && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddNonCode((prev) => !prev)}
                className="text-xs font-semibold shrink-0 border-outline-variant bg-surface-container-lowest hover:bg-surface-container"
              >
                {showAddNonCode ? "Tutup Form" : "+ Tambah Kontribusi Non-Kode"}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {/* Modal / Inline Form for Non-Code Contribution */}
          {showAddNonCode && (
            <form
              onSubmit={handleAddNonCode}
              className="p-4 rounded-xl border border-outline-variant bg-surface-container-low space-y-3"
            >
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-on-surface">Catat Kontribusi Non-Kode Minggu Ini</h4>
                <p className="text-[11px] text-on-surface-variant">
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
                  className="text-xs bg-surface-container-lowest border-outline-variant"
                  required
                />
                <Button
                  type="submit"
                  size="sm"
                  className="bg-primary-container hover:bg-primary text-white text-xs shrink-0"
                  disabled={isSubmitting || !nonCodeText.trim()}
                >
                  {isSubmitting ? "Menyimpan..." : "Kirim Catatan"}
                </Button>
              </div>
            </form>
          )}

          {/* Table of Members */}
          <div className="border border-outline-variant rounded-xl overflow-x-auto text-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low/70 border-b border-outline-variant text-xs text-on-surface font-display font-bold">
                <tr>
                  <th className="p-3">Nama Anggota</th>

                  {/* Commits Tooltip */}
                  <th className="p-3">
                    <Tooltip>
                      <TooltipTrigger className="cursor-help underline decoration-dotted flex items-center gap-1">
                        Commit
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs space-y-1 bg-surface-container-highest text-on-surface border-outline-variant">
                        <p className="font-semibold">Cara Hitung Commit:</p>
                        <p>
                          Jumlah commit yang telah melalui filter noise (lockfile, merge commit, dan perubahan whitespace diabaikan).
                        </p>
                        <p className="text-on-surface-variant text-[10px]">
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
                      <TooltipContent className="max-w-xs text-xs space-y-1 bg-surface-container-highest text-on-surface border-outline-variant">
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
                      <TooltipContent className="max-w-xs text-xs space-y-1 bg-surface-container-highest text-on-surface border-outline-variant">
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
                      <TooltipContent className="max-w-xs text-xs space-y-1 bg-surface-container-highest text-on-surface border-outline-variant">
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
                      <TooltipContent className="max-w-xs text-xs space-y-1 bg-surface-container-highest text-on-surface border-outline-variant">
                        <p className="font-semibold">Hari Aktif Bekerja:</p>
                        <p>
                          Jumlah tanggal kalender unik di mana anggota melakukan minimal 1 aksi Git (commit, PR, atau review).
                        </p>
                        <p className="text-on-surface-variant text-[10px]">
                          Mencegah bias kerja maraton menit-menit terakhir sebelum deadline.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </th>

                  <th className="p-3">Status & Catatan Non-Kode</th>
                  {isLecturer && <th className="p-3 text-right">Aksi</th>}
                </tr>
              </thead>

              <tbody className="divide-y divide-outline-variant/60 text-xs">
                {members.map((member) => {
                  const memberInitials = member.name
                    .split(" ")
                    .slice(0, 2)
                    .map((s) => s[0])
                    .join("")
                    .toUpperCase();

                  return (
                    <tr key={member.userId} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center font-bold text-xs text-primary shrink-0">
                            {memberInitials}
                          </div>
                          <div className="space-y-0.5">
                            <div className="font-bold text-on-surface flex items-center gap-1.5">
                              <span>{member.name}</span>
                              {member.isLeader && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary/30 text-primary bg-primary/5">
                                  Ketua
                                </Badge>
                              )}
                            </div>
                            <div className="text-on-surface-variant text-[11px] font-mono">
                              {member.nim ? `NIM: ${member.nim}` : `@${member.username}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 font-mono font-bold text-on-surface tabular-nums">
                        {member.totalCommits}
                      </td>

                      <td className="p-3 font-mono font-bold text-on-surface tabular-nums">
                        {member.totalPrs}
                      </td>

                      <td className="p-3 font-mono font-bold text-on-surface tabular-nums">
                        {member.totalReviews}
                      </td>

                      <td className="p-3 font-mono font-bold text-on-surface tabular-nums">
                        {member.totalIssues}
                      </td>

                      <td className="p-3 font-mono">
                        <span className="bg-surface-container px-2 py-0.5 rounded text-on-surface font-semibold text-[11px]">
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

                        {member.nonCodeContributions && member.nonCodeContributions.length > 0 && (
                          <div className="text-[11px] text-on-surface-variant space-y-0.5 pt-0.5">
                            <span className="font-semibold text-primary block">
                              Kontribusi Non-Kode:
                            </span>
                            {member.nonCodeContributions.map((nc, idx) => (
                              <div key={idx} className="italic text-on-surface-variant/90">
                                • {nc.description}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {isLecturer && (
                        <td className="p-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:bg-destructive/10"
                            onClick={async () => {
                              if (confirm(`Keluarkan ${member.name} dari kelompok?`)) {
                                await removeMember(groupId, member.userId);
                                router.refresh();
                              }
                            }}
                          >
                            Keluarkan
                          </Button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/60 text-xs text-on-surface-variant flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>
              💡 <strong>Pernyataan Nilai Formatif:</strong> Seluruh indikator di atas adalah instrumen pembinaan dan transparansi, <u>bukan skor tunggal otomatis</u>.
            </span>
            <span className="text-[10px] font-mono text-primary font-semibold">
              Kepatuhan PDP Fasilkom-TI
            </span>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
