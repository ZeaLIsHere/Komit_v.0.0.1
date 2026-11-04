"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mapIdentity } from "@/actions/identity";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MemberSelect, MemberOption } from "./member-select";

export interface UnmappedAuthorItem {
  repoId: string;
  repoFullName: string;
  rawAuthor: string;
  eventCount: number;
}

interface UnmappedListProps {
  items: UnmappedAuthorItem[];
  members: MemberOption[];
}

export function UnmappedList({ items, members }: UnmappedListProps) {
  const router = useRouter();
  const [selectedUserByAuthor, setSelectedUserByAuthor] = useState<Record<string, string>>({});
  const [loadingAuthor, setLoadingAuthor] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ author: string; type: "success" | "error"; text: string } | null>(null);

  async function handleMap(item: UnmappedAuthorItem) {
    const targetUserId = selectedUserByAuthor[item.rawAuthor];
    if (!targetUserId) {
      setFeedback({
        author: item.rawAuthor,
        type: "error",
        text: "Pilih anggota kelompok terlebih dahulu",
      });
      return;
    }

    setLoadingAuthor(item.rawAuthor);
    setFeedback(null);

    const res = await mapIdentity({
      repoId: item.repoId,
      rawAuthor: item.rawAuthor,
      targetUserId,
    });

    setLoadingAuthor(null);

    if (res.success) {
      setFeedback({
        author: item.rawAuthor,
        type: "success",
        text: `Berhasil menghubungkan ${res.data?.updatedCount ?? 0} aktivitas ke anggota kelompok`,
      });
      router.refresh();
    } else {
      setFeedback({
        author: item.rawAuthor,
        type: "error",
        text: res.error || "Gagal memetakan identitas",
      });
    }
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center border rounded-lg bg-muted/20">
        <p className="text-sm font-medium text-emerald-700">
          Semua commit dan aktivitas telah terhubung dengan anggota kelompok! 🎉
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Tidak ada commit atau event yang berstatus belum terpetakan saat ini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="border rounded-md overflow-x-auto text-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-muted text-xs uppercase text-muted-foreground font-semibold">
            <tr>
              <th className="p-3">Nama / Email di Git Commit</th>
              <th className="p-3">Repositori</th>
              <th className="p-3">Jumlah Aktivitas</th>
              <th className="p-3 min-w-[220px]">Petakan ke Anggota</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y text-xs">
            {items.map((item) => {
              const key = `${item.repoId}-${item.rawAuthor}`;
              const isProcessing = loadingAuthor === item.rawAuthor;

              return (
                <tr key={key} className="hover:bg-muted/30">
                  <td className="p-3">
                    <span className="font-mono font-medium text-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                      {item.rawAuthor}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {item.repoFullName}
                  </td>
                  <td className="p-3">
                    <Badge variant="secondary" className="font-mono">
                      {item.eventCount} commit / event
                    </Badge>
                  </td>
                  <td className="p-3">
                    <MemberSelect
                      members={members}
                      value={selectedUserByAuthor[item.rawAuthor] || ""}
                      onChange={(userId) => {
                        setSelectedUserByAuthor((prev) => ({
                          ...prev,
                          [item.rawAuthor]: userId,
                        }));
                        setFeedback(null);
                      }}
                      disabled={isProcessing}
                    />
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      size="sm"
                      onClick={() => handleMap(item)}
                      disabled={isProcessing || !selectedUserByAuthor[item.rawAuthor]}
                    >
                      {isProcessing ? "Menyimpan..." : "Hubungkan"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {feedback && (
        <div
          className={`p-3 text-xs rounded-md font-medium ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-destructive/15 text-destructive"
          }`}
        >
          {feedback.text}
        </div>
      )}
    </div>
  );
}
