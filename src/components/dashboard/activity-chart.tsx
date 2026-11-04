"use client";

import { useState } from "react";
import { GroupWeeklyMetric } from "@/lib/metrics";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface ActivityChartProps {
  data: GroupWeeklyMetric[];
}

export function ActivityChart({ data }: ActivityChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <Card className="bg-surface-container-lowest border-outline-variant shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <CardTitle className="font-display text-sm font-bold text-on-surface">
              Grafik Aktivitas Mingguan Kelompok
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-on-surface-variant">
            Belum ada aktivitas yang terekam pada repositori kelompok ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-44 flex items-center justify-center text-xs text-on-surface-variant">
          Hubungkan repositori GitHub dan lakukan commit untuk melihat grafik sprint mingguan.
        </CardContent>
      </Card>
    );
  }

  // Calculate highest event count for scaling
  const maxEvents = Math.max(...data.map((d) => d.totalEvents), 1);

  return (
    <Card className="w-full bg-surface-container-lowest border-outline-variant shadow-xs">
      <CardHeader className="pb-2 border-b border-outline-variant/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <CardTitle className="font-display text-sm font-bold text-on-surface">
                Grafik Aktivitas Mingguan Kelompok
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-on-surface-variant mt-0.5">
              Distribusi commit, pull request, review, dan issue per minggu (8 minggu sprint).
            </CardDescription>
          </div>

          {/* Academic Legend */}
          <div className="flex items-center gap-3 text-xs text-on-surface-variant flex-wrap font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#135d38] inline-block shadow-2xs" />
              <span>Commit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#10b981] inline-block shadow-2xs" />
              <span>Pull Request</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#d97706] inline-block shadow-2xs" />
              <span>Review / Diskusi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#3b82f6] inline-block shadow-2xs" />
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
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-surface-container-highest text-on-surface border border-outline-variant text-xs px-3.5 py-1.5 rounded-lg shadow-md pointer-events-none z-10 flex gap-3 font-mono">
              <span className="font-bold text-primary">{data[hoveredIdx].weekLabel}:</span>
              <span>{data[hoveredIdx].commits} commit</span>
              <span>{data[hoveredIdx].prs} PR</span>
              <span>{data[hoveredIdx].reviews} review</span>
              <span>{data[hoveredIdx].issues} issue</span>
              <span className="font-bold text-primary">
                ({data[hoveredIdx].activeMembers} aktif)
              </span>
            </div>
          )}

          <div className="grid grid-cols-8 gap-2 items-end h-[160px] border-b border-outline-variant/60 pb-1">
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
                    className={`w-full max-w-[42px] rounded-t-sm flex flex-col-reverse overflow-hidden transition-all duration-200 ${
                      isHovered ? "ring-2 ring-primary ring-offset-1" : "opacity-95"
                    }`}
                    style={{
                      height: `${Math.max(barHeightPct, 6)}%`,
                    }}
                  >
                    {total === 0 ? (
                      <div className="w-full h-full bg-surface-container" />
                    ) : (
                      <>
                        <div
                          style={{ height: `${commitPct}%` }}
                          className="bg-[#135d38] w-full"
                          title={`${item.commits} commit`}
                        />
                        <div
                          style={{ height: `${prPct}%` }}
                          className="bg-[#10b981] w-full"
                          title={`${item.prs} PR`}
                        />
                        <div
                          style={{ height: `${revPct}%` }}
                          className="bg-[#d97706] w-full"
                          title={`${item.reviews} review`}
                        />
                        <div
                          style={{ height: `${issuePct}%` }}
                          className="bg-[#3b82f6] w-full"
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
          <div className="grid grid-cols-8 gap-2 pt-2 text-center text-[10px] text-on-surface-variant font-mono font-medium">
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
