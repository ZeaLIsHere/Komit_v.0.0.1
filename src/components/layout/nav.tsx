import Link from "next/link";
import { signOut } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface NavProps {
  user: {
    id: string;
    name?: string | null;
    username?: string;
    role?: "LECTURER" | "STUDENT";
    email?: string | null;
  };
}

export function Nav({ user }: NavProps) {
  const displayName = user.name || user.username || "Pengguna";
  const isLecturer = user.role === "LECTURER";

  return (
    <header className="h-14 border-b bg-background px-4 md:px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <Link
          href="/courses"
          className="font-bold text-lg tracking-tight flex items-center gap-2 md:hidden"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">
            K
          </span>
          <span>Komit</span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="font-medium text-foreground">{displayName}</span>
          <Badge variant={isLecturer ? "default" : "secondary"} className="text-[10px] h-5 px-1.5">
            {isLecturer ? "Dosen" : "Mahasiswa"}
          </Badge>
        </div>

        <Link href="/panduan">
          <Button variant="ghost" size="sm" className="h-8 text-xs">
            Panduan
          </Button>
        </Link>

        <Link href="/settings">
          <Button variant="ghost" size="sm" className="h-8 text-xs">
            Pengaturan
          </Button>
        </Link>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <Button variant="outline" size="sm" type="submit" className="h-8 text-xs">
            Keluar
          </Button>
        </form>
      </div>
    </header>
  );
}
