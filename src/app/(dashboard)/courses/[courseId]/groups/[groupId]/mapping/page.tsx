import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth, requireMember, requireLecturer } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
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
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
        <Link
          href={`/courses/${group.course.id}`}
          className="hover:text-primary transition-colors truncate max-w-[200px]"
        >
          {group.course.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-outline shrink-0" />
        <Link
          href={`/courses/${params.courseId}/groups/${params.groupId}`}
          className="hover:text-primary transition-colors truncate max-w-[200px]"
        >
          {group.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-outline shrink-0" />
        <span className="text-on-surface font-semibold font-mono">
          Pemetaan Identitas Git
        </span>
      </nav>

      {/* Header */}
      <div className="pb-4 border-b border-outline-variant">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
          Pemetaan Identitas Git & Kontributor
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant mt-1 leading-relaxed">
          Hubungkan author commit Git atau email lokal laptop yang belum terdeteksi ke profil mahasiswa anggota {group.name} agar kontribusi mereka terekam secara adil dan transparan.
        </p>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-xl border border-outline-variant bg-surface-container-lowest shadow-xs text-xs text-on-surface-variant space-y-1">
        <p className="font-bold text-on-surface flex items-center gap-1.5">
          <span>ℹ️ Mengapa commit bisa tidak terhubung otomatis?</span>
        </p>
        <p className="leading-relaxed">
          Hal ini umumnya terjadi jika mahasiswa menggunakan email atau nama akun Git lokal pada terminal laptop mereka yang berbeda dengan email atau username di akun GitHub utama. Setelah dipetakan, seluruh commit lampau dan commit mendatang dengan nama tersebut akan otomatis teratribusi ke mahasiswa yang dipilih.
        </p>
      </div>

      {/* Bagian 1: Commit / Author yang Belum Terhubung */}
      <Card className="bg-surface-container-lowest border-outline-variant shadow-xs">
        <CardHeader className="border-b border-outline-variant/60 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display text-sm sm:text-base font-bold text-on-surface">
                Aktivitas Belum Terhubung
              </CardTitle>
              <CardDescription className="text-xs text-on-surface-variant">
                Daftar author Git yang belum teratribusikan ke anggota kelompok mana pun.
              </CardDescription>
            </div>
            <span className="text-xs font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
              {unmappedItems.length} Author Belum Dipetakan
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <UnmappedList items={unmappedItems} members={memberOptions} />
        </CardContent>
      </Card>

      {/* Bagian 2: Pemetaan yang Sedang Aktif */}
      <Card className="bg-surface-container-lowest border-outline-variant shadow-xs">
        <CardHeader className="border-b border-outline-variant/60 pb-3">
          <CardTitle className="font-display text-sm sm:text-base font-bold text-on-surface">
            Pemetaan Tersimpan
          </CardTitle>
          <CardDescription className="text-xs text-on-surface-variant">
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
