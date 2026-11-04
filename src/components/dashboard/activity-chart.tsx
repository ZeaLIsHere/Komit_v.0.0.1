"use client";

import { useState } from "react";
import { GroupWeeklyMetric } from "@/lib/metrics";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface ActivityChartProps {
  data: GroupWeeklyMetric[];
}

export function ActivityChart({ data }: ActivityChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Grafik Aktivitas Mingguan Kelompok</CardTitle>
          <CardDescription>
            Belum ada aktivitas yang terekam pada repositori kelompok ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-44 flex items-center justify-center text-xs text-muted-foreground">
          Hubungkan repositori GitHub dan lakukan commit untuk melihat grafik aktivitas.
        </CardContent>
      </Card>
    );
  }

  // Calculate highest event count for scaling
  const maxEvents = Math.max(...data.map((d) => d.totalEvents), 1);
  const chartHeight = 160; // in px

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold">
              Grafik Aktivitas Mingguan Kelompok
            </CardTitle>
            <CardDescription className="text-xs">
              Distribusi commit, pull request, review, dan issue per minggu (8 minggu terakhir).
            </CardDescription>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
              <span>Commit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
              <span>Pull Request</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
              <span>Review / Komentar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-purple-500 inline-block" />
              <span>Issue</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* Chart Bars Container */}
        <div className="relative pt-6">
          {/* Active tooltip popover */}
          {hoveredIdx !== null && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground border text-xs px-3 py-1.5 rounded-md shadow-md pointer-events-none z-10 flex gap-3">
              <span className="font-semibold">{data[hoveredIdx].weekLabel}:</span>
              <span>{data[hoveredIdx].commits} commit</span>
              <span>{data[hoveredIdx].prs} PR</span>
              <span>{data[hoveredIdx].reviews} review</span>
              <span>{data[hoveredIdx].issues} issue</span>
              <span className="font-medium text-primary">
                ({data[hoveredIdx].activeMembers} anggota aktif)
              </span>
            </div>
          )}

          <div className="grid grid-cols-8 gap-2 items-end h-[160px] border-b pb-1">
            {data.map((item, idx) => {
              const total = item.totalEvents;
              const barHeightPct = total > 0 ? (total / maxEvents) * 100 : 0;
              const isHovered = hoveredIdx === idx;

              // Proportions
              const commitPct = total > 0 ? (item.commits / total) * 100 : 0;
              const prPct = total > 0 ? (item.prs / total) * 100 : 0;
              const revPct = total > 0 ? (item.reviews / total) * 100 : 0;
              const issuePct = total > 0 ? (item.issues / total) * 100 : 0;

              return (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-end h-full group cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <div
                    className={`w-full max-w-[42px] rounded-t flex flex-col-reverse overflow-hidden transition-all duration-200 ${
                      isHovered ? "ring-2 ring-primary ring-offset-1" : "opacity-90"
                    }`}
                    style={{
                      height: `${Math.max(barHeightPct, 6)}%`,
                    }}
                  >
                    {total === 0 ? (
                      <div className="w-full h-full bg-muted/60" />
                    ) : (
                      <>
                        <div
                          style={{ height: `${commitPct}%` }}
                          className="bg-blue-500 w-full"
                          title={`${item.commits} commit`}
                        />
                        <div
                          style={{ height: `${prPct}%` }}
                          className="bg-emerald-500 w-full"
                          title={`${item.prs} PR`}
                        />
                        <div
                          style={{ height: `${revPct}%` }}
                          className="bg-amber-500 w-full"
                          title={`${item.reviews} review`}
                        />
                        <div
                          style={{ height: `${issuePct}%` }}
                          className="bg-purple-500 w-full"
                          title={`${item.issues} issue`}
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* X Axis Labels */}
          <div className="grid grid-cols-8 gap-2 pt-2 text-center text-[10px] text-muted-foreground font-medium">
            {data.map((item, idx) => (
              <div key={idx} className="truncate">
                {item.weekLabel}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
