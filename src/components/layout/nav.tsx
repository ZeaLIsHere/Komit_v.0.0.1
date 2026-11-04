import Link from "next/link";
import { signOut } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Terminal, Shield, LogOut, BookOpen, User } from "lucide-react";

export interface NavProps {
  user: {
    id: string;
    name?: string | null;
    username?: string;
    role?: "LECTURER" | "STUDENT";
    email?: string | null;
    nim?: string | null;
  };
}

export function Nav({ user }: NavProps) {
  const displayName = user.name || user.username || "Pengguna";
  const isLecturer = user.role === "LECTURER";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

  return (
    <header className="h-16 border-b border-outline-variant bg-surface sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between">
      {/* Left: Brand (visible on mobile) & Subtitle */}
      <div className="flex items-center gap-3">
        <Link
          href="/courses"
          className="flex items-center gap-2.5 font-bold text-base tracking-tight"
        >
          <div className="w-8 h-8 rounded-lg bg-primary-container text-white flex items-center justify-center font-bold shadow-xs">
            <Terminal className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm text-primary tracking-tight">
                USU CS Project Pulse
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant border border-outline-variant">
                v2.4 Fasilkom
              </span>
            </div>
            <span className="text-[10px] text-on-surface-variant hidden md:inline">
              Fakultas Ilmu Komputer & Teknologi Informasi
            </span>
          </div>
        </Link>
      </div>

      {/* Right Trailing Cluster */}
      <div className="flex items-center gap-3">
        <Link
          href="/panduan"
          className="hidden lg:flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors px-2 py-1 rounded"
        >
          <Shield className="h-3.5 w-3.5 text-emerald-600" />
          <span>Etika & PDP</span>
        </Link>

        <div className="h-5 w-px bg-outline-variant hidden sm:block" />

        {/* User Card & Role */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary font-bold text-xs">
            {initials || <User className="h-4 w-4" />}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-on-surface leading-tight max-w-[140px] truncate">
                {displayName}
              </span>
              <Badge
                variant="outline"
                className={`text-[9px] h-4 px-1 font-mono uppercase ${
                  isLecturer
                    ? "bg-primary-container/10 text-primary border-primary/20"
                    : "bg-surface-container text-on-surface border-outline-variant"
                }`}
              >
                {isLecturer ? "Dosen" : "Mhs"}
              </Badge>
            </div>
            <span className="text-[10px] font-mono text-on-surface-variant">
              {isLecturer ? "NIP Terverifikasi" : `NIM: ${user.nim || "-"}`}
            </span>
          </div>
        </div>

        {/* Sign Out Button */}
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            type="submit"
            className="h-8 px-2 text-xs text-on-surface-variant hover:text-destructive hover:bg-destructive/10"
            title="Keluar"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Keluar</span>
          </Button>
        </form>
      </div>
    </header>
  );
}
