import Link from "next/link";
import { notFound } from "next/navigation";
import { requireLecturer } from "@/lib/auth";
import { db } from "@/lib/db";
import { GroupForm } from "./_components/group-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewGroupPage({
  params,
}: {
  params: { courseId: string };
}) {
  await requireLecturer(params.courseId);

  const course = await db.course.findUnique({
    where: { id: params.courseId },
    select: { id: true, name: true, code: true },
  });

  if (!course) {
    notFound();
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4 space-y-4">
      <div>
        <Link
          href={`/courses/${params.courseId}`}
          className="text-xs text-muted-foreground hover:underline"
        >
          ← Kembali ke Dashboard Kelas
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Buat Kelompok Baru</CardTitle>
          <CardDescription>
            Tambahkan kelompok proyek mahasiswa secara manual untuk mata kuliah{" "}
            <span className="font-medium text-foreground">{course.name}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GroupForm courseId={params.courseId} />
        </CardContent>
      </Card>
    </div>
  );
}
