"use client";

import { useTransition } from "react";
import { type HolidayPeriod } from "@prisma/client";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addHolidayPeriod, deleteHolidayPeriod } from "@/actions/course";

interface HolidayFormProps {
  courseId: string;
  holidayPeriods: HolidayPeriod[];
}

export function HolidayForm({ courseId, holidayPeriods }: HolidayFormProps) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = data.get("name") as string;
    const startDate = new Date(data.get("startDate") as string);
    const endDate = new Date(data.get("endDate") as string);

    if (!name || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      alert("Semua kolom wajib diisi dengan tanggal yang valid.");
      return;
    }
    if (startDate > endDate) {
      alert("Tanggal mulai harus lebih awal dari tanggal selesai.");
      return;
    }

    startTransition(async () => {
      const result = await addHolidayPeriod(courseId, { name, startDate, endDate });
      if (!result.success) {
        alert(`Gagal menambah periode: ${result.error}`);
        return;
      }
      form.reset();
    });
  }

  function handleDelete(periodId: string) {
    startTransition(async () => {
      const result = await deleteHolidayPeriod(periodId);
      if (!result.success) {
        alert(`Gagal menghapus periode: ${result.error}`);
      }
    });
  }

  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold">Periode Libur / Jeda Akademik</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Selama periode libur, status kelompok tidak akan dieskalasi menjadi Tidak Aktif secara
          otomatis.
        </p>
      </div>

      {/* Add form */}
      <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4 bg-muted/30">
        <p className="text-sm font-medium">Tambah Periode Libur</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1 space-y-1">
            <label className="text-xs text-muted-foreground font-medium" htmlFor="holiday-name">
              Nama Periode
            </label>
            <input
              id="holiday-name"
              name="name"
              type="text"
              placeholder="mis. Libur Lebaran 2027"
              required
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium" htmlFor="holiday-start">
              Tanggal Mulai
            </label>
            <input
              id="holiday-start"
              name="startDate"
              type="date"
              required
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium" htmlFor="holiday-end">
              Tanggal Selesai
            </label>
            <input
              id="holiday-end"
              name="endDate"
              type="date"
              required
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Menyimpan..." : "Tambah Periode"}
          </Button>
        </div>
      </form>

      {/* Existing periods */}
      {holidayPeriods.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada periode libur yang ditambahkan.</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground">
                  Nama Periode
                </th>
                <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground">
                  Tanggal Mulai
                </th>
                <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground">
                  Tanggal Selesai
                </th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {holidayPeriods.map((period) => (
                <tr key={period.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{period.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmt(period.startDate)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmt(period.endDate)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      disabled={isPending}
                      onClick={() => handleDelete(period.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sr-only">Hapus</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

