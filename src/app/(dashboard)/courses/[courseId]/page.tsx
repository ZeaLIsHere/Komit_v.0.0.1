import Link from "next/link";
import { notFound } from "next/navigation";
import { requireLecturer } from "@/lib/auth";
import { getCourseWithGroups } from "@/lib/queries/course-dashboard";
import { GroupTable } from "@/components/dashboard/group-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExportCsvButton } from "./_components/export-csv-button";

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
    <div className="max-w-6xl mx-auto py-6 px-4 md:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{course.name}</h1>
            {course.archived && (
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded font-medium">
                Diarsipkan
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Kode: <span className="font-medium text-foreground">{course.code}</span> ·{" "}
            Semester: <span className="font-medium text-foreground">{course.semester}</span>
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-9 text-xs">
            <Link href={`/courses/${course.id}/milestones`}>
              Kelola Milestone
            </Link>
          </Button>

          <Button asChild variant="outline" size="sm" className="h-9 text-xs">
            <Link href={`/courses/${course.id}/groups/import`}>
              Impor CSV
            </Link>
          </Button>

          <Button asChild variant="outline" size="sm" className="h-9 text-xs">
            <Link href={`/courses/${course.id}/settings`}>
              Pengaturan
            </Link>
          </Button>

          <ExportCsvButton courseId={course.id} />
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="shadow-none">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Total Kelompok</p>
            <p className="text-2xl font-bold tracking-tight">{stats.totalGroups}</p>
          </CardContent>
        </Card>

        <Card className="shadow-none border-emerald-200/60 bg-emerald-50/20">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-emerald-800 font-medium">Aktif</p>
            <p className="text-2xl font-bold tracking-tight text-emerald-700">
              {stats.activeCount}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none border-amber-200/60 bg-amber-50/20">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-amber-800 font-medium">Melambat</p>
            <p className="text-2xl font-bold tracking-tight text-amber-700">
              {stats.slowingCount}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none border-rose-200/60 bg-rose-50/20">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-rose-800 font-medium">Tidak Aktif</p>
            <p className="text-2xl font-bold tracking-tight text-rose-700">
              {stats.inactiveCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Groups List: Filter, Sort & Table/Card View */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Daftar Kelompok Mahasiswa</h2>
          <span className="text-xs text-muted-foreground">
            Menampilkan {groups.length} kelompok
          </span>
        </div>

        <GroupTable courseId={course.id} initialGroups={groups} />
      </div>
    </div>
  );
}
