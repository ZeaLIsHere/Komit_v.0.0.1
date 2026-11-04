"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background">
      <div className="space-y-4 max-w-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/15 text-destructive font-bold text-2xl">
          !
        </div>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Terjadi Kesalahan Sistem
          </h1>
          <p className="text-sm text-muted-foreground">
            {error.message ||
              "Terjadi kendala saat memproses permintaan Anda. Silakan coba kembali."}
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
          <Button onClick={() => reset()} variant="default" size="sm">
            Coba Lagi
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/courses">Kembali ke Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
