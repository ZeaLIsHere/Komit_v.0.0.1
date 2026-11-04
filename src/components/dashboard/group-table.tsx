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
      const matchSearch = g.name.toLowerCase().includes(search.toLowerCase());
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
      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Input
            placeholder="Cari nama kelompok..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
            aria-label="Filter status kelompok"
            className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="SLOWING">Melambat</option>
            <option value="INACTIVE">Tidak Aktif</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            aria-label="Urutkan daftar kelompok"
            className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="status">Urutkan: Status (Perlu Perhatian)</option>
            <option value="name">Urutkan: Nama (A-Z)</option>
            <option value="lastActivity">Urutkan: Aktivitas Terbaru</option>
            <option value="lateMilestone">Urutkan: Milestone Terlambat</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center border rounded-md overflow-hidden bg-muted p-0.5">
            <Button
              type="button"
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-7 text-xs px-2.5"
            >
              Tabel
            </Button>
            <Button
              type="button"
              variant={viewMode === "card" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("card")}
              className="h-7 text-xs px-2.5"
            >
              Kartu
            </Button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {sortedGroups.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
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
        <div className="border rounded-md overflow-hidden bg-card shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-semibold text-xs">Nama Kelompok</TableHead>
                <TableHead className="font-semibold text-xs">Status</TableHead>
                <TableHead className="font-semibold text-xs">Anggota</TableHead>
                <TableHead className="font-semibold text-xs">Aktivitas Terakhir</TableHead>
                <TableHead className="font-semibold text-xs">Target Milestone</TableHead>
                <TableHead className="text-right font-semibold text-xs">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedGroups.map((group) => {
                const lastActiveText = group.lastActivityAt
                  ? new Date(group.lastActivityAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })
                  : "-";

                return (
                  <TableRow key={group.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      <Link
                        href={`/courses/${courseId}/groups/${group.id}`}
                        className="hover:underline text-foreground"
                      >
                        {group.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <GroupStatusBadge status={group.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {group.memberCount} Orang
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {lastActiveText}
                    </TableCell>
                    <TableCell className="text-xs">
                      {group.activeMilestone ? (
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-[130px]">
                            {group.activeMilestone.title}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-1 py-0.5 rounded ${
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
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/courses/${courseId}/groups/${group.id}`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Lihat Detail →
                      </Link>
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
