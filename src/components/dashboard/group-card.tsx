import Link from "next/link";
import { type GroupDashboardItem } from "@/lib/queries/course-dashboard";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface GroupCardProps {
  courseId: string;
  group: GroupDashboardItem;
}

export function GroupStatusBadge({
  status,
}: {
  status: GroupDashboardItem["status"];
}) {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge
          variant="default"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
        >
          Aktif
        </Badge>
      );
    case "SLOWING":
      return (
        <Badge
          variant="secondary"
          className="bg-amber-100 text-amber-900 border-amber-300 font-medium"
        >
          Melambat
        </Badge>
      );
    case "INACTIVE":
      return (
        <Badge variant="destructive" className="font-medium">
          Tidak Aktif
        </Badge>
      );
    default:
      return <Badge variant="outline">Tidak Diketahui</Badge>;
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
    <Card className="hover:border-foreground/30 transition-colors flex flex-col justify-between shadow-sm">
      <CardHeader className="pb-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold leading-tight line-clamp-1">
            {group.name}
          </CardTitle>
          <GroupStatusBadge status={group.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-xs text-muted-foreground pb-4">
        <div className="flex items-center justify-between">
          <span>Jumlah Anggota:</span>
          <span className="font-medium text-foreground">
            {group.memberCount} Orang
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span>Aktivitas Terakhir:</span>
          <span className="font-medium text-foreground">{lastActiveText}</span>
        </div>

        {group.activeMilestone ? (
          <div className="pt-2 border-t space-y-1">
            <span className="text-[11px] block text-muted-foreground">
              Target Milestone:
            </span>
            <div className="flex items-center justify-between gap-1">
              <span className="font-medium text-foreground truncate max-w-[150px]">
                {group.activeMilestone.title}
              </span>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  group.activeMilestone.status === "SUBMITTED"
                    ? "bg-emerald-100 text-emerald-800"
                    : group.activeMilestone.status === "LATE"
                    ? "bg-rose-100 text-rose-800"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {group.activeMilestone.status === "SUBMITTED"
                  ? "Selesai"
                  : group.activeMilestone.status === "LATE"
                  ? "Terlambat"
                  : "Belum Kumpul"}
              </span>
            </div>
          </div>
        ) : (
          <div className="pt-2 border-t text-[11px] italic">
            Belum ada target milestone aktif
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <Link
          href={`/courses/${courseId}/groups/${group.id}`}
          className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
        >
          Lihat Detail Kelompok →
        </Link>
      </CardFooter>
    </Card>
  );
}
