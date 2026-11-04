import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OnboardingForm } from "./_components/onboarding-form";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Dosen or students who already filled both name and nim skip onboarding
  if (
    session.user.role === "LECTURER" ||
    (session.user.name && session.user.nim)
  ) {
    redirect("/courses");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md shadow-sm border-border">
        <CardHeader className="space-y-1.5 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Lengkapi Profil Mahasiswa
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Langkah awal sebelum bergabung ke kelompok tugas besar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm initialName={session.user.name ?? ""} />
        </CardContent>
      </Card>
    </main>
  );
}
