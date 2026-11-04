"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportCourseCSV } from "@/actions/export";

interface ExportCsvButtonProps {
  courseId: string;
}

export function ExportCsvButton({ courseId }: ExportCsvButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      const result = await exportCourseCSV(courseId);
      if (!result.success) {
        alert(`Gagal mengekspor: ${result.error}`);
        return;
      }

      const blob = new Blob([result.data.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-9 text-xs"
      onClick={handleExport}
      disabled={isPending}
    >
      <Download className="h-3.5 w-3.5 mr-1.5" />
      {isPending ? "Mengekspor..." : "Ekspor Rekap CSV"}
    </Button>
  );
}

