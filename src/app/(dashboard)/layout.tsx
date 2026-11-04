import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Nav } from "@/components/layout/nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const isLecturer = session.user.role === "LECTURER";

  // If student hasn't completed onboarding (missing NIM), redirect to onboarding
  if (!isLecturer && !session.user.nim) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar isLecturer={isLecturer} />
      <div className="flex-1 flex flex-col min-w-0">
        <Nav user={session.user} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
