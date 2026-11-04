import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth, requireLecturer } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { CsvUpload } from "@/components/forms/csv-upload";

interface ImportGroupsPageProps {
  params: {
    courseId: string;
  };
}

export default async function ImportGroupsPage({ params }: ImportGroupsPageProps) {
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
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/courses/${course.id}`}>← Kembali ke {course.name}</Link>
        </Button>
      </div>

      <CsvUpload courseId={course.id} />
    </div>
  );
}

