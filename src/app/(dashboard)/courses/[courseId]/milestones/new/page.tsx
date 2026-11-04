import Link from "next/link";
import { requireLecturer } from "@/lib/auth";
import { MilestoneForm } from "@/components/forms/milestone-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewMilestonePage({
  params,
}: {
  params: { courseId: string };
}) {
  const { course } = await requireLecturer(params.courseId);

  return (
    <div className="max-w-2xl mx-auto space-y-4 py-6 px-4">
      <div>
        <Link
          href={`/courses/${params.courseId}/milestones`}
          className="text-xs text-muted-foreground hover:underline"
        >
          ← Kembali ke Daftar Milestone
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Buat Milestone Baru</CardTitle>
          <CardDescription>
            Tentukan tenggat dan ketentuan target capaian untuk mata kuliah{" "}
            <span className="font-medium text-foreground">{course.name}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MilestoneForm courseId={params.courseId} />
        </CardContent>
      </Card>
    </div>
  );
}
