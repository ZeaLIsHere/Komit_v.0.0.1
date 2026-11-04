"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { joinGroup } from "@/actions/group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function JoinGroupPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    const res = await joinGroup(inviteCode.trim());
    setIsLoading(false);

    if (res.success) {
      if (res.data && typeof res.data === "object" && "courseId" in res.data) {
        const { courseId, groupId } = res.data as { courseId: string; groupId: string };
        router.push(`/courses/${courseId}/groups/${groupId}`);
        router.refresh();
      }
    } else {
      setErrorMessage(res.error || "Gagal bergabung ke kelompok");
    }
  }

  return (
    <div className="max-w-md mx-auto pt-8">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Gabung ke Kelompok Proyek</CardTitle>
          <CardDescription>
            Masukkan kode undangan 8 karakter yang dibagikan oleh dosen atau ketua kelompok Anda.
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
              <label htmlFor="inviteCode" className="text-sm font-medium">
                Kode Undangan
              </label>
              <Input
                id="inviteCode"
                placeholder="Contoh: A1B2C3D4"
                className="font-mono text-center text-lg tracking-widest uppercase"
                maxLength={12}
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground text-center">
                Satu mahasiswa hanya dapat tergabung dalam satu kelompok per mata kuliah.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 border-t pt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !inviteCode.trim()}
            >
              {isLoading ? "Memproses..." : "Bergabung Sekarang"}
            </Button>
            <Button asChild variant="ghost" className="w-full" size="sm">
              <Link href="/courses">Kembali ke Daftar Mata Kuliah</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

