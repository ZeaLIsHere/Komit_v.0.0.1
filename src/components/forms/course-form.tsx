"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCourse } from "@/actions/course";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CourseForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [semester, setSemester] = useState("Ganjil");
  const [academicYear, setAcademicYear] = useState("2026/2027");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const res = await createCourse({
      name,
      code,
      semester,
      academicYear,
    });

    setIsLoading(false);

    if (res.success && res.data && typeof res.data === "object" && "id" in res.data) {
      router.push(`/courses/${res.data.id}`);
      router.refresh();
    } else {
      setErrorMessage(res.error || "Gagal membuat mata kuliah");
    }
  }

  return (
    <Card className="w-full max-w-xl mx-auto shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Buat Mata Kuliah Baru</CardTitle>
        <CardDescription>
          Tambahkan mata kuliah baru untuk memantau tugas besar kelompok mahasiswa.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {errorMessage && (
            <div className="p-3 text-sm rounded-md bg-destructive/15 text-destructive font-medium">
              {errorMessage}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium">
              Nama Mata Kuliah
            </label>
            <Input
              id="name"
              placeholder="Contoh: Rekayasa Perangkat Lunak"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="code" className="text-sm font-medium">
              Kode Mata Kuliah
            </label>
            <Input
              id="code"
              placeholder="Contoh: TIF-2101"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="semester" className="text-sm font-medium">
                Semester
              </label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger id="semester">
                  <SelectValue placeholder="Pilih semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ganjil">Ganjil</SelectItem>
                  <SelectItem value="Genap">Genap</SelectItem>
                  <SelectItem value="Pendek">Pendek</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="academicYear" className="text-sm font-medium">
                Tahun Ajaran
              </label>
              <Input
                id="academicYear"
                placeholder="Contoh: 2026/2027"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Menyimpan..." : "Simpan Mata Kuliah"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

