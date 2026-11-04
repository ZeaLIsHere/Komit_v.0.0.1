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
import { GroupStatusBadge } from "@/components/dashboard/group-card";
import { ConnectRepo } from "./_components/connect-repo";
import {
  ChevronRight,
  GitBranch,
  Terminal,
  ExternalLink,
  Users,
  Copy,
  AlertTriangle,
  History,
  GitCommit,
  GitPullRequest,
  CheckCircle2,
} from "lucide-react";

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

  // Calculate days inactive
  const daysInactive = group.lastActivityAt
    ? Math.floor(
        (Date.now() - new Date(group.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24)
      )
    : undefined;

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
        <Link
          href={`/courses/${group.course.id}`}
          className="hover:text-primary transition-colors truncate max-w-[200px]"
        >
          {group.course.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-outline shrink-0" />
        <span className="text-on-surface font-semibold truncate max-w-[250px]">
          {group.name}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-outline shrink-0" />
        <span className="text-on-surface-variant/80 font-mono">Detail Pemantauan</span>
      </nav>

      {/* Group Header Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                {group.name}
              </h1>
              <GroupStatusBadge status={group.status} daysInactive={daysInactive} />
            </div>

            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              Mata Kuliah: <strong className="text-on-surface">{group.course.name}</strong> ({group.course.code}) • Semester {group.course.semester}
            </p>

            {/* Metadata Repo, Invite Code & Sync */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
              {primaryRepo ? (
                <a
                  href={`https://github.com/${primaryRepo.fullName}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-primary hover:underline bg-surface-container-low px-2.5 py-1 rounded-lg border border-outline-variant font-medium"
                >
                  <Terminal className="h-3.5 w-3.5" />
                  <span>{primaryRepo.fullName}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-lg border border-outline-variant">
                  <Terminal className="h-3.5 w-3.5" />
                  <span>Belum Terhubung Repositori</span>
                </span>
              )}

              <div className="inline-flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1 rounded-lg border border-outline-variant font-mono text-xs text-on-surface">
                <span className="text-on-surface-variant">Token:</span>
                <span className="font-bold tracking-wider text-primary">{group.inviteCode}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons Cluster */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 text-xs font-semibold border-outline-variant bg-surface-container-lowest hover:bg-surface-container"
            >
              <Link href={`/courses/${params.courseId}/groups/${params.groupId}/mapping`}>
                <GitBranch className="h-3.5 w-3.5 mr-1.5 text-primary" />
                <span>Pemetaan Git {unmappedCount > 0 ? `(${unmappedCount})` : ""}</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Unmapped Activities Warning Banner (F-31) */}
      {unmappedCount > 0 && (
        <div className="p-4 rounded-xl border border-amber-200/90 bg-amber-50/70 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block sm:inline mr-1 text-amber-900">
                Perhatian: Ditemukan {unmappedCount} aktivitas commit belum terhubung!
              </strong>
              <span className="text-amber-800">
                Ada kontribusi GitHub yang author-nya belum dipetakan ke mahasiswa. Hubungkan sekarang agar metrik tercatat akurat.
              </span>
            </div>
          </div>
          <Button
            asChild
            size="sm"
            className="shrink-0 bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs h-8"
          >
            <Link href={`/courses/${params.courseId}/groups/${params.groupId}/mapping`}>
              Buka Pemetaan Git →
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
        isLecturer={isLecturer}
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
          <Card className="h-full flex flex-col justify-between bg-surface-container-lowest border-outline-variant shadow-xs">
            <CardHeader className="pb-3 border-b border-outline-variant/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  <CardTitle className="font-display text-sm font-bold text-on-surface">
                    Aktivitas Terbaru Repositori
                  </CardTitle>
                </div>
                <span className="text-[11px] font-mono text-on-surface-variant">
                  10 Event Terakhir
                </span>
              </div>
              <CardDescription className="text-xs text-on-surface-variant">
                Log telemetri commit, pull request, dan issue yang terekam dari GitHub.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-3 flex-1">
              {recentActivities.length === 0 ? (
                <div className="py-12 text-center text-xs text-on-surface-variant">
                  Belum ada aktivitas commit atau pull request yang tercatat pada repositori ini.
                </div>
              ) : (
                <div className="divide-y divide-outline-variant/60 text-xs">
                  {recentActivities.map((act) => (
                    <div key={act.id} className="py-3 flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-semibold border border-outline-variant">
                            {act.type.includes("PR") ? (
                              <GitPullRequest className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <GitCommit className="h-3 w-3 text-blue-600" />
                            )}
                            <span>{act.type.replace("_", " ")}</span>
                          </span>

                          <span className="font-semibold text-on-surface text-xs truncate max-w-[150px]">
                            {act.userName || act.githubAuthor}
                          </span>

                          {!act.userName && (
                            <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              belum dipetakan
                            </span>
                          )}

                          {act.isFiltered && (
                            <span className="text-[10px] text-on-surface-variant bg-surface-container px-1 rounded">
                              noise
                            </span>
                          )}
                        </div>

                        <p className="text-on-surface font-mono text-xs leading-normal truncate">
                          {act.title}
                        </p>
                      </div>

                      <div className="text-right shrink-0 text-[11px] font-mono text-on-surface-variant">
                        {new Date(act.occurredAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
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
