import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Daftar Mata Kuliah</h1>
            <p className="text-sm text-muted-foreground">
              Kelola mata kuliah dan pantau progres tugas kelompok mahasiswa Anda.
            </p>
          </div>
          <Button asChild>
            <Link href="/courses/new">Buat Mata Kuliah</Link>
          </Button>
        </div>

        {courses.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm">
                Anda belum membuat mata kuliah apa pun.
              </p>
              <Button asChild variant="outline">
                <Link href="/courses/new">Mulai Buat Mata Kuliah Pertama</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="flex flex-col justify-between hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {course.code}
                      </span>
                      <CardTitle className="text-lg mt-0.5 line-clamp-1">
                        {course.name}
                      </CardTitle>
                    </div>
                    {course.archived && (
                      <Badge variant="secondary">Diarsipkan</Badge>
                    )}
                  </div>
                  <CardDescription>
                    Semester {course.semester}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {course._count.groups}
                    </span>{" "}
                    kelompok terdaftar
                  </div>
                </CardContent>

                <CardFooter className="border-t pt-4 flex gap-2">
                  <Button asChild variant="default" className="w-full">
                    <Link href={`/courses/${course.id}`}>Buka Kelas</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/courses/${course.id}/settings`}>Pengaturan</Link>
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mata Kuliah Saya</h1>
          <p className="text-sm text-muted-foreground">
            Daftar mata kuliah dan kelompok yang Anda ikuti.
          </p>
        </div>
        <Button asChild>
          <Link href="/groups/join">Gabung Kelompok via Kode</Link>
        </Button>
      </div>

      {memberships.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Anda belum tergabung dalam kelompok mana pun.
            </p>
            <Button asChild variant="outline">
              <Link href="/groups/join">Masukkan Kode Undangan Kelompok</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memberships.map((m) => (
            <Card key={m.id} className="flex flex-col justify-between">
              <CardHeader>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {m.group.course.code}
                </span>
                <CardTitle className="text-lg line-clamp-1">
                  {m.group.course.name}
                </CardTitle>
                <CardDescription>
                  Semester {m.group.course.semester}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-1">
                <div className="text-sm font-medium">
                  Kelompok:{" "}
                  <span className="text-primary font-semibold">
                    {m.group.name}
                  </span>
                </div>
                {m.isLeader && (
                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                    Ketua Kelompok
                  </Badge>
                )}
              </CardContent>

              <CardFooter className="border-t pt-4">
                <Button asChild className="w-full">
                  <Link href={`/courses/${m.group.course.id}/groups/${m.group.id}`}>
                    Lihat Progres Kelompok
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

