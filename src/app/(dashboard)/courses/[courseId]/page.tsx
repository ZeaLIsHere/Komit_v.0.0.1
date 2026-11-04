import Link from "next/link";
import { notFound } from "next/navigation";
import { requireLecturer } from "@/lib/auth";
import { getCourseWithGroups } from "@/lib/queries/course-dashboard";
import { GroupTable } from "@/components/dashboard/group-table";
import { Button } from "@/components/ui/button";
import { ExportCsvButton } from "./_components/export-csv-button";
import {
  Users,
  ShieldCheck,
  Plus,
  Flag,
  FileSpreadsheet,
  Settings,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";

export default async function CourseDashboardPage({
  params,
}: {
  params: { courseId: string };
}) {
  await requireLecturer(params.courseId);

  const data = await getCourseWithGroups(params.courseId);
  if (!data) {
    notFound();
  }

  const { course, groups, stats } = data;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 md:px-6 space-y-6">
      {/* Top Header Area with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-[11px] font-bold tracking-wide">
              {course.code} • AUDIT SUITE
            </span>
            <span className="text-on-surface-variant text-xs font-mono">
              • Semester {course.semester}
            </span>
            {course.archived && (
              <span className="text-[10px] font-semibold bg-surface-container text-on-surface-variant px-2 py-0.5 rounded">
                Diarsipkan
              </span>
            )}
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            {course.name}
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Pemantauan progres sprint mahasiswa berbasis komitmen repositori, kepatuhan etika, dan integritas kerja kelompok.
          </p>
        </div>

        {/* Action Buttons Cluster */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 text-xs border-outline-variant bg-surface-container-lowest hover:bg-surface-container"
          >
            <Link href={`/courses/${course.id}/groups/import`}>
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5 text-on-surface-variant" />
              <span>Impor CSV</span>
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 text-xs border-outline-variant bg-surface-container-lowest hover:bg-surface-container"
          >
            <Link href={`/courses/${course.id}/milestones/new`}>
              <Flag className="h-3.5 w-3.5 mr-1.5 text-amber-600" />
              <span>+ Milestone</span>
            </Link>
          </Button>

          <Button
            asChild
            size="sm"
            className="h-9 text-xs bg-primary-container hover:bg-primary text-white shadow-xs"
          >
            <Link href={`/courses/${course.id}/groups/new`}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              <span>+ Tambah Kelompok</span>
            </Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-9 text-xs text-on-surface-variant hover:text-on-surface"
            title="Pengaturan Threshold & Pola Noise"
          >
            <Link href={`/courses/${course.id}/settings`}>
              <Settings className="h-4 w-4" />
              <span className="sr-only">Pengaturan</span>
            </Link>
          </Button>

          <ExportCsvButton courseId={course.id} />
        </div>
      </div>

      {/* Academic Ethics Disclaimer Banner (Mandatory F-70) */}
      <div className="bg-surface-container-lowest border-l-4 border-l-primary-container border-y border-r border-outline-variant rounded-r-xl p-4 flex items-start sm:items-center gap-3.5 shadow-xs">
        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-on-surface block">
              Panduan Kebijakan Pembinaan & Etika PDP USU:
            </span>
            <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
              Indikator aktivitas GitHub berfungsi sebagai bahan diskusi dan pembinaan, bukan penentu nilai otomatis. 
              Evaluasi akhir wajib mengedepankan telaah kualitatif, pemahaman konseptual, dan verifikasi wawancara tatap muka.
            </p>
          </div>
          <Link
            href="/panduan"
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline shrink-0"
          >
            <span>Baca Panduan PDP</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Bento Metrics: 4 Class Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Groups */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col justify-between hover:border-outline/50 transition-colors shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant font-bold">
              Total Kelompok
            </span>
            <div className="p-1.5 rounded-lg bg-surface-container text-on-surface-variant">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-on-surface">
                {stats.totalGroups}
              </span>
              <span className="text-xs text-on-surface-variant">Kelompok</span>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1">
              Terdaftar dalam semester aktif {course.semester}
            </p>
          </div>
        </div>

        {/* Metric 2: Active */}
        <div className="bg-surface-container-lowest border border-emerald-200/80 rounded-xl p-5 flex flex-col justify-between hover:border-emerald-300 transition-colors shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-800 font-bold">
              Progres Aktif
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-emerald-700">
                {stats.activeCount}
              </span>
              <span className="text-xs text-emerald-800">Kelompok</span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-1">
              Komit stabil & sprint berjalan lancar
            </p>
          </div>
        </div>

        {/* Metric 3: Slowing */}
        <div className="bg-surface-container-lowest border border-amber-200/80 rounded-xl p-5 flex flex-col justify-between hover:border-amber-300 transition-colors shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-800 font-bold">
              Perlu Perhatian
            </span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-amber-700">
                {stats.slowingCount}
              </span>
              <span className="text-xs text-amber-800">Kelompok</span>
            </div>
            <p className="text-[11px] text-amber-700 mt-1">
              Aktivitas melambat (stagnan &gt; 5 hari)
            </p>
          </div>
        </div>

        {/* Metric 4: Inactive */}
        <div className="bg-surface-container-lowest border border-rose-200/80 rounded-xl p-5 flex flex-col justify-between hover:border-rose-300 transition-colors shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-rose-800 font-bold">
              Tidak Aktif
            </span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-700">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-rose-700">
                {stats.inactiveCount}
              </span>
              <span className="text-xs text-rose-800">Kelompok</span>
            </div>
            <p className="text-[11px] text-rose-700 mt-1">
              Kritis (&gt; 10 hari tanpa aktivitas komit)
            </p>
          </div>
        </div>
      </div>

      {/* Groups List: Filter, Sort & Table/Card View */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-on-surface tracking-tight">
              Daftar Kelompok Mahasiswa
            </h2>
            <p className="text-xs text-on-surface-variant">
              Tinjau status aktivitas repositori, progres milestone, dan detail anggota tim.
            </p>
          </div>
          <span className="text-xs font-mono text-on-surface-variant">
            {groups.length} Kelompok Terdaftar
          </span>
        </div>

        <GroupTable courseId={course.id} initialGroups={groups} />
      </div>
    </div>
  );
}
