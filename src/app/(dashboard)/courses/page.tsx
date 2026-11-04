import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Users, ArrowRight, GraduationCap, Settings } from "lucide-react";

export default async function CoursesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isLecturer = session.user.role === "LECTURER";

  if (isLecturer) {
    const courses = await db.course.findMany({
      where: { lecturerId: session.user.id },
      include: {
        _count: {
          select: { groups: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return (
      <div className="space-y-6 max-w-7xl mx-auto py-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-primary mb-1">
              <GraduationCap className="h-4 w-4" />
              <span>FAKULTAS ILMU KOMPUTER & TEKNOLOGI INFORMASI</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
              Daftar Mata Kuliah
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
              Kelola kelas perkuliahan, pantau sprint repositori, dan supervisi kemajuan tugas kelompok mahasiswa.
            </p>
          </div>
          <Button
            asChild
            className="bg-primary-container hover:bg-primary text-white font-semibold text-xs h-9 gap-1.5 shadow-xs"
          >
            <Link href="/courses/new">
              <Plus className="h-4 w-4" />
              <span>Buat Mata Kuliah Baru</span>
            </Link>
          </Button>
        </div>

        {courses.length === 0 ? (
          <Card className="text-center py-16 bg-surface-container-lowest border-outline-variant shadow-xs">
            <CardContent className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="font-display text-base font-bold text-on-surface">
                Belum Ada Mata Kuliah
              </h3>
              <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                Anda belum membuat mata kuliah tugas besar. Mulai dengan membuat kelas baru.
              </p>
              <Button asChild size="sm" className="bg-primary-container hover:bg-primary text-white text-xs font-semibold">
                <Link href="/courses/new">Mulai Buat Mata Kuliah Pertama</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="flex flex-col justify-between hover:border-primary/50 transition-colors bg-surface-container-lowest border-outline-variant shadow-xs group"
              >
                <CardHeader className="space-y-2 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {course.code}
                      </span>
                      <CardTitle className="font-display text-lg font-bold mt-2 text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                        {course.name}
                      </CardTitle>
                    </div>
                    {course.archived && (
                      <Badge variant="outline" className="text-[10px] bg-surface-container text-on-surface-variant">
                        Diarsipkan
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs text-on-surface-variant font-mono">
                    Semester {course.semester}
                  </CardDescription>
                </CardHeader>

                <CardContent className="py-2">
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/60 text-xs text-on-surface-variant">
                    <Users className="h-4 w-4 text-primary" />
                    <span>
                      <strong className="text-on-surface font-semibold">
                        {course._count.groups}
                      </strong>{" "}
                      kelompok terdaftar
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="border-t border-outline-variant/60 pt-3 flex gap-2">
                  <Button asChild className="w-full bg-primary-container hover:bg-primary text-white text-xs font-semibold h-8 gap-1.5 shadow-xs">
                    <Link href={`/courses/${course.id}`}>
                      <span>Buka Kelas</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="h-8 text-xs border-outline-variant hover:bg-surface-container" title="Pengaturan">
                    <Link href={`/courses/${course.id}/settings`}>
                      <Settings className="h-3.5 w-3.5 text-on-surface-variant" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Student view: courses they are enrolled in via group memberships
  const memberships = await db.membership.findMany({
    where: { userId: session.user.id },
    include: {
      group: {
        include: {
          course: true,
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-primary mb-1">
            <GraduationCap className="h-4 w-4" />
            <span>PORTAL MAHASISWA FASILKOM-TI</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
            Mata Kuliah Saya
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Daftar perkuliahan dan repositori kelompok tugas besar yang Anda ikuti.
          </p>
        </div>
        <Button
          asChild
          className="bg-primary-container hover:bg-primary text-white font-semibold text-xs h-9 shadow-xs"
        >
          <Link href="/groups/join">Gabung Kelompok via Kode</Link>
        </Button>
      </div>

      {memberships.length === 0 ? (
        <Card className="text-center py-16 bg-surface-container-lowest border-outline-variant shadow-xs">
          <CardContent className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 mx-auto flex items-center justify-center">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="font-display text-base font-bold text-on-surface">
              Belum Tergabung Kelompok
            </h3>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">
              Anda belum terdaftar dalam kelompok mana pun. Masukkan kode undangan dari ketua tim atau dosen pengampu.
            </p>
            <Button asChild size="sm" className="bg-primary-container hover:bg-primary text-white text-xs font-semibold">
              <Link href="/groups/join">Masukkan Kode Undangan Kelompok</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {memberships.map((m) => (
            <Card
              key={m.id}
              className="flex flex-col justify-between bg-surface-container-lowest border-outline-variant shadow-xs hover:border-primary/50 transition-colors group"
            >
              <CardHeader className="space-y-2 pb-3">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded w-fit">
                  {m.group.course.code}
                </span>
                <CardTitle className="font-display text-lg font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                  {m.group.course.name}
                </CardTitle>
                <CardDescription className="text-xs text-on-surface-variant font-mono">
                  Semester {m.group.course.semester}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2 py-2">
                <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/60 flex items-center justify-between">
                  <div className="text-xs font-semibold text-on-surface">
                    Kelompok: <span className="text-primary font-bold">{m.group.name}</span>
                  </div>
                  {m.isLeader && (
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 font-mono">
                      Ketua Tim
                    </Badge>
                  )}
                </div>
              </CardContent>

              <CardFooter className="border-t border-outline-variant/60 pt-3">
                <Button asChild className="w-full bg-primary-container hover:bg-primary text-white text-xs font-semibold h-8 gap-1.5 shadow-xs">
                  <Link href={`/courses/${m.group.course.id}/groups/${m.group.id}`}>
                    <span>Lihat Progres Kelompok</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

