"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Flag,
  ShieldCheck,
  Settings,
  Plus,
  BookOpen,
  LogOut,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SidebarProps {
  isLecturer: boolean;
}

export function Sidebar({ isLecturer }: SidebarProps) {
  const pathname = usePathname();

  // Extract courseId if inside /courses/[courseId]
  const courseMatch = pathname.match(/^\/courses\/([^/]+)/);
  const currentCourseId =
    courseMatch && courseMatch[1] !== "new" ? courseMatch[1] : null;

  const isCourseContext = Boolean(currentCourseId);

  return (
    <aside className="w-64 border-r border-outline-variant bg-surface-container-low/60 flex flex-col justify-between hidden md:flex shrink-0 min-h-screen sticky top-0 h-screen select-none">
      <div className="p-4 space-y-6">
        {/* Brand / Institutional Emblem */}
        <Link
          href="/courses"
          className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-surface-container transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-primary-container text-white flex items-center justify-center font-bold text-base shadow-sm group-hover:scale-105 transition-transform">
            TI
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-sm tracking-tight text-primary">
                Fasilkom-TI
              </span>
              <span className="text-[9px] font-mono font-semibold uppercase px-1 py-0.2 bg-secondary-fixed text-on-secondary-fixed rounded">
                USU
              </span>
            </div>
            <span className="text-[11px] text-on-surface-variant leading-tight">
              Lab Rekayasa Perangkat Lunak
            </span>
          </div>
        </Link>

        {/* Navigation Section */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70 mb-2 font-mono">
            {isCourseContext ? "Menu Mata Kuliah" : "Menu Utama"}
          </p>

          <nav className="space-y-1 text-sm font-medium">
            {isCourseContext ? (
              <>
                <Link
                  href={`/courses/${currentCourseId}`}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    pathname === `/courses/${currentCourseId}`
                      ? "bg-surface-container-highest text-primary border-l-4 border-primary font-bold shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4 shrink-0 text-primary" />
                  <span>Ringkasan & Kelompok</span>
                </Link>

                <Link
                  href={`/courses/${currentCourseId}/milestones`}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    pathname.startsWith(`/courses/${currentCourseId}/milestones`)
                      ? "bg-surface-container-highest text-primary border-l-4 border-primary font-bold shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  }`}
                >
                  <Flag className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>Manajemen Milestone</span>
                </Link>

                {isLecturer && (
                  <Link
                    href={`/courses/${currentCourseId}/settings`}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      pathname === `/courses/${currentCourseId}/settings`
                        ? "bg-surface-container-highest text-primary border-l-4 border-primary font-bold shadow-xs"
                        : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                    }`}
                  >
                    <Settings className="h-4 w-4 shrink-0 text-on-surface-variant" />
                    <span>Pengaturan Kelas</span>
                  </Link>
                )}

                <div className="pt-3 my-2 border-t border-outline-variant/60">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70 mb-2 font-mono">
                    Navigasi Cepat
                  </p>
                  <Link
                    href="/courses"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                  >
                    <Users className="h-4 w-4 shrink-0" />
                    <span>Semua Mata Kuliah</span>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/courses"
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    pathname === "/courses"
                      ? "bg-surface-container-highest text-primary border-l-4 border-primary font-bold"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4 shrink-0 text-primary" />
                  <span>Daftar Mata Kuliah</span>
                </Link>
              </>
            )}

            <Link
              href="/panduan"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                pathname === "/panduan"
                  ? "bg-surface-container-highest text-primary border-l-4 border-primary font-bold"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Kebijakan Etika & PDP</span>
            </Link>

            <Link
              href="/settings"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                pathname === "/settings"
                  ? "bg-surface-container-highest text-primary border-l-4 border-primary font-bold"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <Settings className="h-4 w-4 shrink-0" />
              <span>Pengaturan Akun</span>
            </Link>
          </nav>
        </div>

        {/* Lecturer Quick Action */}
        {isLecturer && (
          <div className="pt-1">
            <Button
              asChild
              size="sm"
              className="w-full text-xs font-medium justify-center gap-1.5 bg-primary-container hover:bg-primary text-white shadow-xs"
            >
              <Link href="/courses/new">
                <Plus className="h-3.5 w-3.5" />
                <span>Buat Mata Kuliah</span>
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-outline-variant bg-surface-container-lowest/40">
        <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
          <span className="font-mono">USU CS Pulse</span>
          <span className="px-1.5 py-0.5 rounded bg-surface-container font-mono text-[10px]">
            v2.4
          </span>
        </div>
      </div>
    </aside>
  );
}
