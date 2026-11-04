import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background">
      <div className="space-y-4 max-w-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted font-bold text-2xl text-foreground">
          404
        </div>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-sm text-muted-foreground">
            Halaman yang Anda tuju mungkin telah dipindahkan, dihapus, atau tautan yang Anda masukkan salah.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
          <Button asChild variant="default" size="sm">
            <Link href="/courses">Kembali ke Dashboard</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/">Halaman Utama</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
