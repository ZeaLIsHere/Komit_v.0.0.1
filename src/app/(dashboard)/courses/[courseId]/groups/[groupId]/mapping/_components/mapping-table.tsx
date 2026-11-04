"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { unmapIdentity } from "@/actions/identity";
import { Button } from "@/components/ui/button";

export interface ExistingMappingItem {
  id: string;
  repoFullName: string;
  rawAuthor: string;
  mappedUserName: string;
  mappedUserNim?: string | null;
  mappedUserUsername: string;
  createdAt: Date | string;
}

interface MappingTableProps {
  mappings: ExistingMappingItem[];
}

export function MappingTable({ mappings }: MappingTableProps) {
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleUnmap(mappingId: string, rawAuthor: string) {
    const confirm = window.confirm(
      `Apakah Anda yakin ingin membatalkan pemetaan untuk "${rawAuthor}"? Aktivitas terkait akan kembali berstatus belum terhubung.`
    );
    if (!confirm) return;

    setProcessingId(mappingId);
    setErrorMessage(null);

    const res = await unmapIdentity(mappingId);
    setProcessingId(null);

    if (res.success) {
      router.refresh();
    } else {
      setErrorMessage(res.error || "Gagal membatalkan pemetaan");
    }
  }

  if (mappings.length === 0) {
    return (
      <div className="p-6 text-center border rounded-md text-xs text-muted-foreground">
        Belum ada pemetaan identitas manual yang tersimpan untuk repositori kelompok ini.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {errorMessage && (
        <div className="p-3 text-xs rounded-md bg-destructive/15 text-destructive font-medium">
          {errorMessage}
        </div>
      )}

      <div className="border rounded-md overflow-x-auto text-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-muted text-xs uppercase text-muted-foreground font-semibold">
            <tr>
              <th className="p-3">Nama / Email di Git</th>
              <th className="p-3">Terhubung ke Mahasiswa</th>
              <th className="p-3">Repositori</th>
              <th className="p-3">Waktu Pemetaan</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y text-xs">
            {mappings.map((m) => {
              const isProcessing = processingId === m.id;

              return (
                <tr key={m.id} className="hover:bg-muted/30">
                  <td className="p-3 font-mono font-medium">
                    <span className="bg-muted/60 px-1.5 py-0.5 rounded">
                      {m.rawAuthor}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="font-semibold text-foreground">
                      {m.mappedUserName}
                    </span>
                    {m.mappedUserNim ? (
                      <span className="text-muted-foreground ml-1.5">
                        ({m.mappedUserNim})
                      </span>
                    ) : (
                      <span className="text-muted-foreground ml-1.5">
                        (@{m.mappedUserUsername})
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {m.repoFullName}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(m.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 px-2 text-xs"
                      onClick={() => handleUnmap(m.id, m.rawAuthor)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Menghapus..." : "Hapus Pemetaan"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
