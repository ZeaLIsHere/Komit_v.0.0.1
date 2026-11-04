import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth, requireLecturer, requireMember } from "@/lib/auth";
import { getGroupDetail } from "@/lib/queries/group-detail";
import {
  getMemberMetrics,
  getGroupMetrics,
  getRecentActivity,
  getUnmappedCount,
} from "@/lib/metrics";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { MemberIndicators } from "@/components/dashboard/member-indicators";
import { ConnectRepo } from "./_components/connect-repo";

interface GroupDetailPageProps {
  params: {
    courseId: string;
    groupId: string;
  };
}

export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Authorization check: LECTURER of this course OR MEMBER of this group
  let isLecturer = false;
  let isMember = false;

  try {
    await requireLecturer(params.courseId);
    isLecturer = true;
  } catch {
    try {
      await requireMember(params.groupId);
      isMember = true;
    } catch {
      redirect(`/courses/${params.courseId}`);
    }
  }

  const group = await getGroupDetail(params.groupId);
  if (!group || group.courseId !== params.courseId) {
    notFound();
  }

  // Fetch metrics in parallel
  const [memberMetrics, groupMetrics, recentActivities, unmappedCount] = await Promise.all([
    getMemberMetrics(params.groupId),
    getGroupMetrics(params.groupId),
    getRecentActivity(params.groupId, 10),
    getUnmappedCount(params.groupId),
  ]);

  const primaryRepo = group.repositories[0] || null;

  // Status badge styling
  const statusBadges = {
    ACTIVE: { label: "Aktif", class: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    SLOWING: { label: "Melambat", class: "bg-amber-50 text-amber-700 border-amber-200" },
    INACTIVE: { label: "Tidak Aktif", class: "bg-destructive/15 text-destructive border-destructive/20" },
  };
  const statusInfo = statusBadges[group.status] || statusBadges.ACTIVE;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/courses/${group.course.id}`}>
            ← Kembali ke {group.course.name}
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/courses/${params.courseId}/groups/${params.groupId}/mapping`}>
              Pemetaan Identitas Git ({unmappedCount} belum terhubung)
            </Link>
          </Button>
        </div>
      </div>

      {/* Group Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl border bg-card">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{group.name}</h1>
            <Badge variant="outline" className={statusInfo.class}>
              {statusInfo.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Mata Kuliah: {group.course.name} ({group.course.code}) • Semester {group.course.semester}
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span>Kode Undangan:</span>
            <span className="font-mono font-bold text-foreground bg-muted px-2 py-0.5 rounded text-sm tracking-wider">
              {group.inviteCode}
            </span>
          </div>
          <div>
            Aktivitas Terakhir:{" "}
            <span className="font-medium text-foreground">
              {group.lastActivityAt
                ? new Date(group.lastActivityAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Belum ada aktivitas"}
            </span>
          </div>
        </div>
      </div>

      {/* Unmapped Activities Warning Banner (F-31) */}
      {unmappedCount > 0 && (
        <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <strong className="font-semibold text-sm block sm:inline mr-1">
              ⚠️ Perhatian: {unmappedCount} aktivitas commit belum terhubung!
            </strong>
            <span>
              Ada kontribusi yang author Git-nya belum dicocokkan ke anggota kelompok. Hubungkan sekarang agar kontribusi tercatat.
            </span>
          </div>
          <Button asChild size="sm" variant="default" className="shrink-0 bg-amber-700 hover:bg-amber-800 text-white">
            <Link href={`/courses/${params.courseId}/groups/${params.groupId}/mapping`}>
              Buka Halaman Pemetaan →
            </Link>
          </Button>
        </div>
      )}

      {/* Chart Section */}
      <ActivityChart data={groupMetrics} />

      {/* Member Indicators Table */}
      <MemberIndicators
        groupId={group.id}
        members={memberMetrics}
        isCurrentMember={isMember}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Repository Management */}
        <div className="lg:col-span-1">
          <ConnectRepo
            groupId={group.id}
            courseId={group.courseId}
            existingRepo={
              primaryRepo
                ? {
                    id: primaryRepo.id,
                    fullName: primaryRepo.fullName,
                    connectionStatus: primaryRepo.connectionStatus,
                    backfillDoneAt: primaryRepo.backfillDoneAt,
                  }
                : null
            }
          />
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Aktivitas Terbaru</CardTitle>
                <span className="text-xs text-muted-foreground">10 Event Terakhir</span>
              </div>
              <CardDescription className="text-xs">
                Log riwayat commit, pull request, dan issue dari repositori kelompok.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {recentActivities.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Belum ada aktivitas commit atau pull request yang tercatat.
                </div>
              ) : (
                <div className="divide-y text-xs">
                  {recentActivities.map((act) => (
                    <div key={act.id} className="py-2.5 flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="outline" className="text-[10px] uppercase font-mono px-1 py-0 h-4">
                            {act.type.replace("_", " ")}
                          </Badge>
                          <span className="font-medium text-foreground">
                            {act.userName || act.githubAuthor}
                          </span>
                          {!act.userName && (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-1 rounded">
                              belum dipetakan
                            </span>
                          )}
                          {act.isFiltered && (
                            <span className="text-[10px] text-muted-foreground bg-muted px-1 rounded">
                              noise
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground line-clamp-1 font-mono text-[11px]">
                          {act.title}
                        </p>
                      </div>

                      <span className="text-muted-foreground text-[10px] shrink-0">
                        {new Date(act.occurredAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
