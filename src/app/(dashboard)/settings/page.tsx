import { requireAuth } from "@/lib/auth";
import { getPreferences } from "@/lib/queries/notification";
import { SettingsForm } from "./_components/settings-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SettingsPage() {
  const user = await requireAuth();
  const preferences = await getPreferences(user.id);
  const isLecturer = user.role === "LECTURER";

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">
          Kelola preferensi akun dan pemberitahuan email Anda.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preferensi Notifikasi Email</CardTitle>
          <CardDescription>
            Pilih jenis email pemberitahuan yang ingin Anda terima melalui email terdaftar (
            <span className="font-medium text-foreground">{user.email || "email GitHub"}</span>).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm
            isLecturer={isLecturer}
            initialPreferences={preferences}
          />
        </CardContent>
      </Card>
    </div>
  );
}
