"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateThresholds, updateExcludePatterns, archiveCourse } from "@/actions/course";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SettingsFormProps {
  courseId: string;
  initialSlow: number;
  initialInactive: number;
  initialExcludePatterns: string[];
  isArchived: boolean;
}

export function SettingsForm({
  courseId,
  initialSlow,
  initialInactive,
  initialExcludePatterns,
  isArchived,
}: SettingsFormProps) {
  const router = useRouter();

  // Thresholds state
  const [slow, setSlow] = useState(initialSlow);
  const [inactive, setInactive] = useState(initialInactive);
  const [isSavingThresholds, setIsSavingThresholds] = useState(false);
  const [thresholdMsg, setThresholdMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Exclude patterns state
  const [patternsText, setPatternsText] = useState(initialExcludePatterns.join("\n"));
  const [isSavingPatterns, setIsSavingPatterns] = useState(false);
  const [patternMsg, setPatternMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Archive state
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveMsg, setArchiveMsg] = useState<string | null>(null);

  async function handleSaveThresholds(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingThresholds(true);
    setThresholdMsg(null);

    const res = await updateThresholds(courseId, {
      slow: Number(slow),
      inactive: Number(inactive),
    });

    setIsSavingThresholds(false);

    if (res.success) {
      setThresholdMsg({ type: "success", text: "Ambang batas berhasil diperbarui" });
    } else {
      setThresholdMsg({ type: "error", text: res.error || "Gagal memperbarui ambang batas" });
    }
  }

  async function handleSavePatterns(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingPatterns(true);
    setPatternMsg(null);

    const patterns = patternsText
      .split("\n")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const res = await updateExcludePatterns(courseId, patterns);
    setIsSavingPatterns(false);

    if (res.success) {
      setPatternMsg({ type: "success", text: "Pola berkas berhasil disimpan" });
    } else {
      setPatternMsg({ type: "error", text: res.error || "Gagal memperbarui pola berkas" });
    }
  }

  async function handleArchive() {
    const confirm = window.confirm(
      "Apakah Anda yakin ingin mengarsipkan mata kuliah ini? Mata kuliah yang diarsipkan tidak dapat diisi aktivitas baru oleh mahasiswa."
    );
    if (!confirm) return;

    setIsArchiving(true);
    setArchiveMsg(null);

    const res = await archiveCourse(courseId);
    setIsArchiving(false);

    if (res.success) {
      router.refresh();
    } else {
      setArchiveMsg(res.error || "Gagal mengarsipkan mata kuliah");
    }
  }

  return (
    <div className="space-y-6">
      {/* Ambang Batas Aktivitas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ambang Batas Status Aktivitas</CardTitle>
          <CardDescription>
            Tentukan jumlah hari tanpa aktivitas GitHub sebelum kelompok ditandai Melambat atau Tidak Aktif.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSaveThresholds}>
          <CardContent className="space-y-4">
            {thresholdMsg && (
              <div
                className={`p-3 text-sm rounded-md font-medium ${
                  thresholdMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-destructive/15 text-destructive"
                }`}
              >
                {thresholdMsg.text}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Batas Status Melambat (Hari)
                </label>
                <Input
                  type="number"
                  min={1}
                  value={slow}
                  onChange={(e) => setSlow(Number(e.target.value))}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Default: 7 hari (jika tidak ada aktivitas selama 8–14 hari).
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Batas Status Tidak Aktif (Hari)
                </label>
                <Input
                  type="number"
                  min={slow + 1}
                  value={inactive}
                  onChange={(e) => setInactive(Number(e.target.value))}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Default: 14 hari (otomatis memicu notifikasi peringatan ke dosen).
                </p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t pt-4 flex justify-end">
            <Button type="submit" disabled={isSavingThresholds}>
              {isSavingThresholds ? "Menyimpan..." : "Simpan Ambang Batas"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Pengecualian Berkas (Noise Exclude Patterns) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pola Berkas Dikecualikan (Noise Filter)</CardTitle>
          <CardDescription>
            Masukkan pola glob berkas (satu per baris) yang tidak boleh dihitung sebagai aktivitas proyek (contoh: berkas dump database, script seed).
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSavePatterns}>
          <CardContent className="space-y-4">
            {patternMsg && (
              <div
                className={`p-3 text-sm rounded-md font-medium ${
                  patternMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-destructive/15 text-destructive"
                }`}
              >
                {patternMsg.text}
              </div>
            )}

            <div className="space-y-1.5">
              <textarea
                className="w-full h-32 p-3 text-xs font-mono border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                placeholder={`**/*.sql\ndatabase/seeds/**\npublic/mock-data.json`}
                value={patternsText}
                onChange={(e) => setPatternsText(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Filter bawaan sistem (lockfiles, node_modules, build/dist, generated files) sudah otomatis aktif.
              </p>
            </div>
          </CardContent>

          <CardFooter className="border-t pt-4 flex justify-end">
            <Button type="submit" disabled={isSavingPatterns}>
              {isSavingPatterns ? "Menyimpan..." : "Simpan Pola Berkas"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Zona Bahaya / Arsipkan Mata Kuliah */}
      <Card className="border-destructive/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-destructive">Arsipkan Mata Kuliah</CardTitle>
            {isArchived && <Badge variant="secondary">Sudah Diarsipkan</Badge>}
          </div>
          <CardDescription>
            Setelah semester berakhir, arsipkan kelas ini. Data aktivitas tetap tersimpan dan dapat dibaca, tetapi tidak ada pembaruan aktivitas baru.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {archiveMsg && (
            <div className="p-3 text-sm rounded-md bg-destructive/15 text-destructive font-medium mb-3">
              {archiveMsg}
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {isArchived
              ? "Mata kuliah ini sedang dalam status diarsipkan."
              : "Tindakan ini menandai mata kuliah sebagai selesai."}
          </p>
        </CardContent>

        <CardFooter className="border-t pt-4 flex justify-end">
          <Button
            type="button"
            variant="destructive"
            onClick={handleArchive}
            disabled={isArchived || isArchiving}
          >
            {isArchiving
              ? "Mengarsipkan..."
              : isArchived
              ? "Telah Diarsipkan"
              : "Arsipkan Mata Kuliah Ini"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

