import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function DashboardRootPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role === "LECTURER") {
    redirect("/courses");
  }

  // Student redirect
  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    include: {
      group: {
        select: {
          id: true,
          courseId: true,
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  if (membership?.group) {
    redirect(`/courses/${membership.group.courseId}/groups/${membership.group.id}`);
  }

  redirect("/groups/join");
}
