import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth, requireLecturer } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { SettingsForm } from "./_components/settings-form";

interface CourseSettingsPageProps {
  params: {
    courseId: string;
  };
}

export default async function CourseSettingsPage({ params }: CourseSettingsPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  try {
    await requireLecturer(params.courseId);
  } catch {
    redirect("/courses");
  }

  const course = await db.course.findUnique({
    where: { id: params.courseId },
  });

  if (!course) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/courses/${course.id}`}>← Kembali ke Kelas</Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Mata Kuliah</h1>
        <p className="text-sm text-muted-foreground">
          Kelola ambang batas status keaktifan kelompok dan filter berkas yang diabaikan untuk {course.name}.
        </p>
      </div>

      <SettingsForm
        courseId={course.id}
        initialSlow={course.slowThreshold ?? 7}
        initialInactive={course.inactiveThreshold ?? 14}
        initialExcludePatterns={
          Array.isArray(course.excludePatterns)
            ? (course.excludePatterns as string[])
            : []
        }
        isArchived={course.archived}
      />
    </div>
  );
}

