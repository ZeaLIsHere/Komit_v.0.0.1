"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { importCSV, CsvImportSummary } from "@/actions/group";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CsvUploadProps {
  courseId: string;
}

export function CsvUpload({ courseId }: CsvUploadProps) {
  const router = useRouter();
  const [csvContent, setCsvContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<CsvImportSummary | null>(null);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text || "");
      setErrorMessage(null);
      setSummary(null);
    };
    reader.onerror = () => {
      setErrorMessage("Gagal membaca file CSV");
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!csvContent.trim()) {
      setErrorMessage("Konten CSV tidak boleh kosong");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const res = await importCSV(courseId, csvContent);
    setIsLoading(false);

    if (res.success) {
      if (res.data) {
        setSummary(res.data);
      }
    } else {
      setErrorMessage(res.error || "Gagal mengimpor kelompok");
    }
  }

  // Generate preview of rows
  const previewLines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .slice(0, 6);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Impor Kelompok dari File CSV</CardTitle>
          <CardDescription>
            Unggah file CSV dengan format kolom:{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-xs">
              nama_kelompok,nim_1,nim_2,nim_3,nim_4,nim_5
            </code>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {errorMessage && (
            <div className="p-3 text-sm rounded-md bg-destructive/15 text-destructive font-medium">
              {errorMessage}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Pilih File CSV</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Atau Tempel (Paste) Konten CSV</label>
            <textarea
              className="w-full h-36 p-3 text-xs font-mono border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              placeholder={`nama_kelompok,nim_1,nim_2,nim_3,nim_4,nim_5\nKelompok Alpha,211401001,211401002,211401003,,\nKelompok Beta,211401004,211401005,211401006,211401007,`}
              value={csvContent}
              onChange={(e) => {
                setCsvContent(e.target.value);
                setSummary(null);
                setErrorMessage(null);
              }}
            />
          </div>

          {previewLines.length > 1 && !summary && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Pratinjau Data (Maks. 5 baris pertama):</h4>
              <div className="border rounded-md overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <tbody>
                    {previewLines.map((line, idx) => (
                      <tr
                        key={idx}
                        className={idx === 0 ? "bg-muted font-semibold" : "border-t"}
                      >
                        {line.split(",").map((col, cIdx) => (
                          <td key={cIdx} className="p-2 border-r last:border-r-0">
                            {col}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/courses/${courseId}`)}
            disabled={isLoading}
          >
            Kembali ke Kelas
          </Button>
          <Button onClick={handleImport} disabled={isLoading || !csvContent.trim()}>
            {isLoading ? "Mengimpor Data..." : "Mulai Impor CSV"}
          </Button>
        </CardFooter>
      </Card>

      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Hasil Impor CSV</span>
              <div className="space-x-2 text-sm font-normal">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  {summary.successCount} Berhasil
                </Badge>
                {summary.failedCount > 0 && (
                  <Badge variant="destructive">{summary.failedCount} Gagal</Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="border rounded-md overflow-x-auto text-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted text-xs uppercase text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-2.5">Baris</th>
                    <th className="p-2.5">Nama Kelompok</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">NIM Terhubung</th>
                    <th className="p-2.5">NIM Belum Terdaftar</th>
                    <th className="p-2.5">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs">
                  {summary.results.map((res) => (
                    <tr key={res.row} className="hover:bg-muted/50">
                      <td className="p-2.5 font-mono">{res.row}</td>
                      <td className="p-2.5 font-medium">{res.groupName}</td>
                      <td className="p-2.5">
                        {res.status === "SUCCESS" ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            Sukses
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Gagal</Badge>
                        )}
                      </td>
                      <td className="p-2.5">
                        {res.nimsAssigned.length > 0
                          ? res.nimsAssigned.join(", ")
                          : "-"}
                      </td>
                      <td className="p-2.5 text-amber-700">
                        {res.nimsPending.length > 0
                          ? res.nimsPending.join(", ")
                          : "-"}
                      </td>
                      <td className="p-2.5 text-muted-foreground">
                        {res.reason || "Kelompok dan membership berhasil dibuat"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => router.push(`/courses/${courseId}`)}>
                Selesai & Ke Dashboard Kelas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

