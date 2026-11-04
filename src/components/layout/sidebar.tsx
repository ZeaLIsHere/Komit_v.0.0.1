import Link from "next/link";
import { Button } from "@/components/ui/button";

export interface SidebarProps {
  isLecturer: boolean;
}

export function Sidebar({ isLecturer }: SidebarProps) {
  return (
    <aside className="w-64 border-r bg-card flex flex-col justify-between hidden md:flex shrink-0 min-h-screen">
      <div className="p-5 space-y-6">
        {/* Brand */}
        <Link href="/courses" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            K
          </div>
          <div className="flex flex-col">
            <span className="leading-none">Komit</span>
            <span className="text-[10px] text-muted-foreground font-normal tracking-normal pt-0.5">
              Ilmu Komputer USU
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="space-y-1 text-sm font-medium">
          <Link
            href="/courses"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-muted text-foreground transition-colors"
          >
            <span>Mata Kuliah</span>
          </Link>
          <Link
            href="/panduan"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>Panduan & Bantuan</span>
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>Pengaturan Akun</span>
          </Link>
        </nav>

        {/* Lecturer Quick Action */}
        {isLecturer && (
          <div className="pt-2">
            <Button asChild size="sm" variant="outline" className="w-full text-xs justify-start gap-2">
              <Link href="/courses/new">
                <span>+ Buat Mata Kuliah</span>
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t text-[11px] text-muted-foreground">
        Platform Pemantauan Proyek v0.2
      </div>
    </aside>
  );
}
