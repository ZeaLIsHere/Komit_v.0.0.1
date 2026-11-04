import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CourseForm } from "@/components/forms/course-form";
import { Button } from "@/components/ui/button";

export default async function NewCoursePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "LECTURER") {
    redirect("/courses");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/courses">← Kembali ke Daftar Mata Kuliah</Link>
        </Button>
      </div>

      <CourseForm />
    </div>
  );
}

