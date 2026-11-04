import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth, requireMember, requireLecturer } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { UnmappedList, UnmappedAuthorItem } from "./_components/unmapped-list";
import { MappingTable, ExistingMappingItem } from "./_components/mapping-table";
import { MemberOption } from "./_components/member-select";

interface IdentityMappingPageProps {
  params: {
    courseId: string;
    groupId: string;
  };
}

export default async function IdentityMappingPage({ params }: IdentityMappingPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Authorization: Must be course lecturer OR member of this group
  let isAuthorized = false;
  try {
    await requireLecturer(params.courseId);
    isAuthorized = true;
  } catch {
    try {
      await requireMember(params.groupId);
      isAuthorized = true;
    } catch {
      isAuthorized = false;
    }
  }

  if (!isAuthorized) {
    redirect(`/courses/${params.courseId}`);
  }

  const group = await db.group.findUnique({
    where: { id: params.groupId },
    include: {
      course: true,
      repositories: true,
      memberships: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!group || group.courseId !== params.courseId) {
    notFound();
  }

  const repoIds = group.repositories.map((r) => r.id);
  const repoMap = new Map(group.repositories.map((r) => [r.id, r.fullName]));

  // 1. Fetch unmapped activity events
  let unmappedItems: UnmappedAuthorItem[] = [];

  if (repoIds.length > 0) {
    // Group events where userId is null by repoId and githubAuthor
    const unmappedAgg = await db.activityEvent.groupBy({
      by: ["repoId", "githubAuthor"],
      where: {
        repoId: { in: repoIds },
        userId: null,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    });

    unmappedItems = unmappedAgg.map((item) => ({
      repoId: item.repoId,
      repoFullName: repoMap.get(item.repoId) || "Repository",
      rawAuthor: item.githubAuthor,
      eventCount: item._count.id,
    }));
  }

  // 2. Fetch existing identity mappings
  let existingMappings: ExistingMappingItem[] = [];

  if (repoIds.length > 0) {
    const rawMappings = await db.identityMapping.findMany({
      where: {
        repoId: { in: repoIds },
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    existingMappings = rawMappings.map((m) => ({
      id: m.id,
      repoFullName: repoMap.get(m.repoId) || "Repository",
      rawAuthor: m.rawAuthor,
      mappedUserName: m.user.name || m.user.username,
      mappedUserNim: m.user.nim,
      mappedUserUsername: m.user.username,
      createdAt: m.createdAt,
    }));
  }

  // 3. Format members for selection dropdown
  const memberOptions: MemberOption[] = group.memberships.map((m) => ({
    userId: m.user.id,
    name: m.user.name || m.user.username,
    nim: m.user.nim,
    username: m.user.username,
  }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/courses/${params.courseId}/groups/${params.groupId}`}>
            ← Kembali ke Detail Kelompok {group.name}
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Pemetaan Identitas Git ({group.name})
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Hubungkan author commit Git atau email lokal yang belum terdeteksi ke profil anggota kelompok agar kontribusi mereka terekam secara adil.
        </p>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-lg border border-primary/20 bg-muted/20 text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground">
          ℹ️ Mengapa commit bisa tidak terhubung otomatis?
        </p>
        <p>
          Hal ini umumnya terjadi jika mahasiswa menggunakan email atau nama akun Git lokal pada terminal laptop mereka yang berbeda dengan email atau username di akun GitHub utama. Setelah dipetakan, seluruh commit lampau dan commit mendatang dengan nama tersebut akan otomatis teratribusi ke mahasiswa yang dipilih.
        </p>
      </div>

      {/* Bagian 1: Commit / Author yang Belum Terhubung */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Aktivitas Belum Terhubung</CardTitle>
              <CardDescription>
                Daftar author Git yang belum teratribusikan ke anggota kelompok mana pun.
              </CardDescription>
            </div>
            <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
              {unmappedItems.length} Author Unmapped
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <UnmappedList items={unmappedItems} members={memberOptions} />
        </CardContent>
      </Card>

      {/* Bagian 2: Pemetaan yang Sedang Aktif */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pemetaan Tersimpan</CardTitle>
          <CardDescription>
            Daftar pemetaan manual yang telah aktif untuk repositori kelompok ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MappingTable mappings={existingMappings} />
        </CardContent>
      </Card>
    </div>
  );
}
