"use client";

import * as React from "react";
import Link from "next/link";
import { type GroupDashboardItem } from "@/lib/queries/course-dashboard";
import { GroupCard, GroupStatusBadge } from "./group-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  LayoutGrid,
  List,
  ArrowRight,
  Users,
  Clock,
  Flag,
} from "lucide-react";

export interface GroupTableProps {
  courseId: string;
  initialGroups: GroupDashboardItem[];
}

type SortOption = "status" | "name" | "lastActivity" | "lateMilestone";
type FilterStatus = "ALL" | "ACTIVE" | "SLOWING" | "INACTIVE";

export function GroupTable({ courseId, initialGroups }: GroupTableProps) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<FilterStatus>("ALL");
  const [sortBy, setSortBy] = React.useState<SortOption>("status");
  const [viewMode, setViewMode] = React.useState<"table" | "card">("table");

  // Filtering
  const filteredGroups = React.useMemo(() => {
    return initialGroups.filter((g) => {
      const matchSearch =
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.inviteCode.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "ALL" || g.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [initialGroups, search, statusFilter]);

  // Sorting
  const sortedGroups = React.useMemo(() => {
    const list = [...filteredGroups];

    switch (sortBy) {
      case "status": {
        // Prioritize INACTIVE, then SLOWING, then ACTIVE
        const priority: Record<string, number> = {
          INACTIVE: 0,
          SLOWING: 1,
          ACTIVE: 2,
        };
        return list.sort((a, b) => priority[a.status] - priority[b.status]);
      }
      case "name": {
        return list.sort((a, b) => a.name.localeCompare(b.name));
      }
      case "lastActivity": {
        return list.sort((a, b) => {
          const timeA = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
          const timeB = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
          return timeB - timeA; // newest activity first
        });
      }
      case "lateMilestone": {
        return list.sort((a, b) => {
          const isLateA = a.activeMilestone?.status === "LATE" ? 1 : 0;
          const isLateB = b.activeMilestone?.status === "LATE" ? 1 : 0;
          return isLateB - isLateA; // late first
        });
      }
      default:
        return list;
    }
  }, [filteredGroups, sortBy]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Controls Ribbon */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-on-surface-variant" />
          <Input
            placeholder="Cari nama kelompok atau token..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-surface-container-low border-outline-variant focus:border-primary-container"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
            aria-label="Filter status kelompok"
            className="h-9 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-1 text-xs font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">🟢 Aktif</option>
            <option value="SLOWING">🟡 Melambat</option>
            <option value="INACTIVE">🔴 Tidak Aktif</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            aria-label="Urutkan daftar kelompok"
            className="h-9 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-1 text-xs font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container cursor-pointer"
          >
            <option value="status">Urutkan: Urgensi Status</option>
            <option value="name">Urutkan: Nama Kelompok (A-Z)</option>
            <option value="lastActivity">Urutkan: Aktivitas Terbaru</option>
            <option value="lateMilestone">Urutkan: Milestone Terlambat</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center border border-outline-variant rounded-lg overflow-hidden bg-surface-container-low p-0.5">
            <Button
              type="button"
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className={`h-7 px-2 text-xs gap-1.5 ${
                viewMode === "table"
                  ? "bg-surface-container-lowest text-primary font-bold shadow-xs"
                  : "text-on-surface-variant"
              }`}
              title="Tampilan Tabel"
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tabel</span>
            </Button>
            <Button
              type="button"
              variant={viewMode === "card" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("card")}
              className={`h-7 px-2 text-xs gap-1.5 ${
                viewMode === "card"
                  ? "bg-surface-container-lowest text-primary font-bold shadow-xs"
                  : "text-on-surface-variant"
              }`}
              title="Tampilan Kartu"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Kartu</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {sortedGroups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-12 text-center text-xs text-on-surface-variant">
          {initialGroups.length === 0
            ? "Belum ada kelompok yang terdaftar pada mata kuliah ini."
            : "Tidak ada kelompok yang sesuai dengan filter pencarian."}
        </div>
      ) : viewMode === "card" ? (
        /* Card Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedGroups.map((g) => (
            <GroupCard key={g.id} courseId={courseId} group={g} />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="border border-outline-variant rounded-xl overflow-hidden bg-surface-container-lowest shadow-xs">
          <Table>
            <TableHeader className="bg-surface-container-low/70 border-b border-outline-variant">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-display font-bold text-xs text-on-surface py-3.5">
                  Kelompok & Repositori
                </TableHead>
                <TableHead className="font-display font-bold text-xs text-on-surface py-3.5">
                  Status Sprint
                </TableHead>
                <TableHead className="font-display font-bold text-xs text-on-surface py-3.5">
                  Anggota
                </TableHead>
                <TableHead className="font-display font-bold text-xs text-on-surface py-3.5">
                  Aktivitas Terakhir
                </TableHead>
                <TableHead className="font-display font-bold text-xs text-on-surface py-3.5">
                  Target Milestone
                </TableHead>
                <TableHead className="text-right font-display font-bold text-xs text-on-surface py-3.5 pr-6">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedGroups.map((group) => {
                const lastActiveText = group.lastActivityAt
                  ? new Date(group.lastActivityAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Belum ada aktivitas";

                return (
                  <TableRow
                    key={group.id}
                    className="hover:bg-surface-container-low/50 border-b border-outline-variant/60 transition-colors"
                  >
                    <TableCell className="py-3.5">
                      <div className="space-y-0.5">
                        <Link
                          href={`/courses/${courseId}/groups/${group.id}`}
                          className="font-bold text-xs sm:text-sm text-on-surface hover:text-primary transition-colors block"
                        >
                          {group.name}
                        </Link>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-on-surface-variant">
                          <span>Token: {group.inviteCode}</span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5">
                      <GroupStatusBadge status={group.status} />
                    </TableCell>

                    <TableCell className="text-xs text-on-surface font-medium py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-on-surface-variant" />
                        <span>{group.memberCount} Mhs</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-on-surface-variant font-mono py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-on-surface-variant" />
                        <span>{lastActiveText}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs py-3.5">
                      {group.activeMilestone ? (
                        <div className="space-y-1">
                          <span className="font-semibold text-on-surface block truncate max-w-[150px]">
                            {group.activeMilestone.title}
                          </span>
                          <span
                            className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                              group.activeMilestone.status === "SUBMITTED"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : group.activeMilestone.status === "LATE"
                                ? "bg-rose-50 text-rose-800 border-rose-200"
                                : "bg-surface-container text-on-surface border-outline-variant"
                            }`}
                          >
                            {group.activeMilestone.status === "SUBMITTED"
                              ? "Selesai"
                              : group.activeMilestone.status === "LATE"
                              ? "Terlambat"
                              : "Menunggu"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-on-surface-variant/60 text-xs italic">
                          -
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right py-3.5 pr-6">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-semibold border-outline-variant bg-surface-container-lowest hover:bg-surface-container hover:text-primary gap-1"
                      >
                        <Link href={`/courses/${courseId}/groups/${group.id}`}>
                          <span>Detail</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
