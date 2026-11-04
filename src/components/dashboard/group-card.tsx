import Link from "next/link";
import { type GroupDashboardItem } from "@/lib/queries/course-dashboard";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Clock, GitCommit, ArrowRight, GitFork } from "lucide-react";

export interface GroupCardProps {
  courseId: string;
  group: GroupDashboardItem;
}

export function GroupStatusBadge({
  status,
  daysInactive,
}: {
  status: GroupDashboardItem["status"];
  daysInactive?: number;
}) {
  switch (status) {
    case "ACTIVE":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Aktif</span>
        </span>
      );
    case "SLOWING":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>
            Melambat {daysInactive !== undefined ? `(${daysInactive} hari)` : ""}
          </span>
        </span>
      );
    case "INACTIVE":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span>Tidak Aktif</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-surface-container text-on-surface-variant border border-outline-variant">
          <span>Tidak Diketahui</span>
        </span>
      );
  }
}

export function GroupCard({ courseId, group }: GroupCardProps) {
  const lastActiveText = group.lastActivityAt
    ? new Date(group.lastActivityAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Belum ada aktivitas";

  return (
    <Card className="hover:border-primary/40 transition-colors flex flex-col justify-between shadow-xs bg-surface-container-lowest border-outline-variant">
      <CardHeader className="pb-3 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold text-on-surface leading-tight line-clamp-1 font-display">
              {group.name}
            </CardTitle>
            <div className="flex items-center gap-2 text-[11px] font-mono text-on-surface-variant">
              <span>Token: {group.inviteCode}</span>
            </div>
          </div>
          <GroupStatusBadge status={group.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-xs text-on-surface-variant pb-4">
        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/60">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-mono text-on-surface-variant/70 block">
              Anggota
            </span>
            <div className="flex items-center gap-1 text-on-surface font-semibold">
              <Users className="h-3.5 w-3.5 text-primary" />
              <span>{group.memberCount} Mhs</span>
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-mono text-on-surface-variant/70 block">
              Aktivitas
            </span>
            <div className="flex items-center gap-1 text-on-surface font-semibold">
              <Clock className="h-3.5 w-3.5 text-on-surface-variant" />
              <span className="truncate">{lastActiveText}</span>
            </div>
          </div>
        </div>

        {group.activeMilestone ? (
          <div className="pt-2 border-t border-outline-variant/60 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-on-surface-variant font-mono">
                Target Milestone:
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  group.activeMilestone.status === "SUBMITTED"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : group.activeMilestone.status === "LATE"
                    ? "bg-rose-50 text-rose-800 border-rose-200"
                    : "bg-surface-container text-on-surface border-outline-variant"
                }`}
              >
                {group.activeMilestone.status === "SUBMITTED"
                  ? "Selesai Dikumpul"
                  : group.activeMilestone.status === "LATE"
                  ? "Terlambat"
                  : "Menunggu Pengumpulan"}
              </span>
            </div>
            <p className="text-xs font-semibold text-on-surface truncate">
              {group.activeMilestone.title}
            </p>
          </div>
        ) : (
          <div className="pt-2 border-t border-outline-variant/60 text-[11px] text-on-surface-variant/70 italic">
            Belum ada target milestone aktif
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 border-t border-outline-variant/40 pt-3">
        <Link
          href={`/courses/${courseId}/groups/${group.id}`}
          className="text-xs font-semibold text-primary hover:text-primary-dark inline-flex items-center gap-1.5 group w-full justify-between"
        >
          <span>Buka Detail Pemantauan</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </CardFooter>
    </Card>
  );
}
