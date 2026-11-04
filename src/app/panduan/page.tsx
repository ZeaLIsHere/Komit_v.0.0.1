import Link from "next/link";
import { auth } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function PanduanPage() {
  const session = await auth();
  const isAuthenticated = Boolean(session?.user);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Header */}
      <header className="h-14 border-b bg-background/95 backdrop-blur sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={isAuthenticated ? "/courses" : "/"} className="flex items-center gap-2.5 font-bold text-base tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container text-white font-bold text-xs shadow-xs">
              TI
            </div>
            <div className="flex flex-col">
              <span className="font-display text-sm font-bold text-primary leading-tight">
                USU CS Project Pulse
              </span>
              <span className="text-[10px] text-on-surface-variant font-mono">
                Panduan & Etika PDP
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Button asChild size="sm" variant="outline" className="h-8 text-xs">
              <Link href="/courses">← Kembali ke Dashboard</Link>
            </Button>
          ) : (
            <Button asChild size="sm" className="h-8 text-xs">
              <Link href="/login">Masuk dengan GitHub</Link>
            </Button>
          )}
        </div>
      </header>

      {/* Main Guide Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto py-8 px-4 sm:px-6 space-y-6">
        <div className="space-y-1.5">
          <Badge variant="outline" className="text-xs font-medium">
            Dokumentasi Pengguna
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Panduan Penggunaan Platform Komit
          </h1>
          <p className="text-sm text-muted-foreground">
            Petunjuk operasional praktis pemantauan tugas besar bagi dosen pengampu dan mahasiswa Program Studi Ilmu Komputer USU.
          </p>
        </div>

        <Tabs defaultValue="dosen" className="w-full space-y-6">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="dosen">Panduan Dosen</TabsTrigger>
            <TabsTrigger value="mahasiswa">Panduan Mahasiswa</TabsTrigger>
          </TabsList>

          {/* ============================================================ */}
          {/* TAB 1: DOSEN */}
          {/* ============================================================ */}
          <TabsContent value="dosen" className="space-y-6">
            {/* Step 1 */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
                  <span>Langkah 1</span>
                </div>
                <CardTitle className="text-lg">Membuat Mata Kuliah & Membagikan Kode Undangan</CardTitle>
                <CardDescription>
                  Inisialisasi ruang kelas mata kuliah untuk menampung kelompok tugas besar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Buka menu <strong>Mata Kuliah</strong> dan klik tombol <strong>+ Buat Mata Kuliah</strong>.</li>
                  <li>Masukkan nama mata kuliah, kode resmi (contoh: <code>TIF2101</code>), semester, dan tahun ajaran.</li>
                  <li>Buat kelompok secara manual melalui form, atau gunakan fitur <strong>Impor CSV</strong>.</li>
                  <li>Setiap kelompok memiliki <strong>Kode Undangan</strong> acak (contoh: <code>A9B1C3</code>). Bagikan kode tersebut kepada mahasiswa kelompok terkait agar mereka dapat bergabung secara mandiri.</li>
                </ol>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
                  <span>Langkah 2</span>
                </div>
                <CardTitle className="text-lg">Impor Kelompok Massal via Berkas CSV</CardTitle>
                <CardDescription>
                  Membuat puluhan kelompok dan mendaftarkan mahasiswa secara instan dari daftar absensi.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>Format CSV yang didukung:</p>
                <div className="p-3 bg-muted rounded-md font-mono text-xs overflow-x-auto text-foreground">
                  nama_kelompok,nim_1,nim_2,nim_3,nim_4,nim_5<br />
                  Kelompok Alpha,211401001,211401002,211401003,,<br />
                  Kelompok Beta,211401004,211401005,211401006,211401007,
                </div>
                <ul className="list-disc list-inside space-y-1.5 pt-1">
                  <li>Jika mahasiswa dengan NIM tersebut sudah pernah login ke sistem, mereka otomatis terhubung ke kelompok.</li>
                  <li>Jika mahasiswa belum mendaftar, mereka tetap dapat bergabung nanti menggunakan <strong>Kode Undangan</strong> kelompok.</li>
                  <li>Sistem otomatis menolak NIM ganda dalam satu mata kuliah untuk memastikan setiap mahasiswa hanya berada di satu kelompok (Aturan F-13).</li>
                </ul>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
                  <span>Langkah 3</span>
                </div>
                <CardTitle className="text-lg">Menetapkan Milestone & Catatan Evaluasi</CardTitle>
                <CardDescription>
                  Memberi target pengumpulan bertahap agar mahasiswa tidak menumpuk pekerjaan di akhir semester.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Buka mata kuliah Anda, lalu klik menu <strong>Kelola Milestone</strong>.</li>
                  <li>Klik <strong>+ Buat Milestone Baru</strong>. Anda dapat mengetik judul sendiri atau memilih <strong>Template Milestone Bawaan</strong> (RPL, Basis Data, Web, PBO).</li>
                  <li>Tentukan batas waktu pengumpulan (tenggat). Sistem otomatis membuat lembar pengumpulan (status <em>Pending</em>) untuk seluruh kelompok.</li>
                  <li>Saat mahasiswa mengumpulkan, Anda dapat membuka dokumen atau tautan demo yang mereka sertakan dan memberikan <strong>Catatan Evaluasi Dosen</strong> langsung di halaman milestone.</li>
                </ol>
              </CardContent>
            </Card>

            {/* Step 4 */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
                  <span>Langkah 4</span>
                </div>
                <CardTitle className="text-lg">Menginterpretasikan Status & Metrik Aktivitas</CardTitle>
                <CardDescription>
                  Prinsip keadilan dalam membaca data aktivitas GitHub mahasiswa.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50">
                    <span className="font-semibold text-emerald-800 text-xs">Aktif (Hijau)</span>
                    <p className="text-xs text-emerald-700 mt-1">Ada aktivitas commit / PR dalam 7 hari terakhir.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50">
                    <span className="font-semibold text-amber-800 text-xs">Melambat (Kuning)</span>
                    <p className="text-xs text-amber-700 mt-1">Tidak ada aktivitas selama 8–14 hari.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-rose-200 bg-rose-50/50">
                    <span className="font-semibold text-rose-800 text-xs">Tidak Aktif (Merah)</span>
                    <p className="text-xs text-rose-700 mt-1">Lebih dari 14 hari pasif. Dosen mendapat email peringatan.</p>
                  </div>
                </div>
                <div className="p-3 rounded-md bg-muted text-xs text-muted-foreground mt-2">
                  <strong>Penting:</strong> Data aktivitas adalah indikator bahan diskusi asistensi, bukan nilai otomatis. Sistem otomatis menyaring merge commit dan file lockfile agar angka kontribusi tidak dimanipulasi.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB 2: MAHASISWA */}
          {/* ============================================================ */}
          <TabsContent value="mahasiswa" className="space-y-6">
            {/* Step 1 */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
                  <span>Langkah 1</span>
                </div>
                <CardTitle className="text-lg">Login GitHub & Melengkapi Profil</CardTitle>
                <CardDescription>
                  Pendaftaran akun mahasiswa menggunakan akun GitHub yang aktif.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Klik tombol <strong>Masuk dengan GitHub</strong>.</li>
                  <li>Pada saat pertama kali masuk, Anda wajib mengisi <strong>Nama Lengkap</strong> dan <strong>NIM</strong> (7-14 digit angka).</li>
                  <li>Pastikan NIM sudah benar karena NIM ini digunakan untuk verifikasi anggota kelompok oleh dosen pengampu.</li>
                </ol>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
                  <span>Langkah 2</span>
                </div>
                <CardTitle className="text-lg">Bergabung ke Kelompok & Menghubungkan Repositori</CardTitle>
                <CardDescription>
                  Menghubungkan kelompok dengan repositori proyek tugas besar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Minta <strong>Kode Undangan</strong> kelompok kepada dosen atau ketua kelompok Anda, lalu masukkan di menu <strong>Gabung Kelompok</strong>.</li>
                  <li>Setelah masuk ke halaman kelompok, salah satu anggota (disarankan ketua) mengklik tombol <strong>Hubungkan Repositori GitHub</strong>.</li>
                  <li>Pilih organisasi atau akun tempat repository tugas besar berada, dan pasang aplikasi Komit dengan izin <em>read-only</em>.</li>
                  <li>Sistem akan otomatis menarik riwayat commit dan mencatat commit baru secara instan via webhook.</li>
                </ol>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
                  <span>Langkah 3</span>
                </div>
                <CardTitle className="text-lg">Memetakan Identitas Git (Author Belum Terhubung)</CardTitle>
                <CardDescription>
                  Memastikan seluruh commit tercatat atas nama Anda di profil kelompok.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  Jika email atau nama pada konfigurasi <code>git config user.email</code> di komputer Anda berbeda dengan akun GitHub Anda, sistem akan menandainya sebagai <em>Belum Terhubung</em>.
                </p>
                <ol className="list-decimal list-inside space-y-2 pt-1">
                  <li>Buka tombol <strong>Pemetaan Identitas Git</strong> di halaman kelompok.</li>
                  <li>Pilih nama author commit yang muncul, lalu pilih nama rekan Anda dari dropdown anggota.</li>
                  <li>Klik <strong>Simpan Pemetaan</strong>. Seluruh riwayat commit author tersebut akan langsung diatribusikan ke anggota yang bersangkutan.</li>
                </ol>
              </CardContent>
            </Card>

            {/* Step 4 */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
                  <span>Langkah 4</span>
                </div>
                <CardTitle className="text-lg">Mencatat Kontribusi Non-Kode & Mengumpulkan Milestone</CardTitle>
                <CardDescription>
                  Pengakuan untuk pekerjaan desain UI/UX, riset, SRS, dan pengumpulan tautan tugas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    <strong>Kontribusi Non-Kode:</strong> Klik tombol <strong>+ Catat Kontribusi Non-Kode</strong> di halaman kelompok untuk mendokumentasikan pekerjaan non-coding (misal: <em>Membuat desain wireframe Figma</em> atau <em>Menulis dokumen SRS bab 3</em>).
                  </li>
                  <li>
                    <strong>Pengumpulan Milestone:</strong> Buka tab <strong>Milestone</strong>, klik <strong>Kumpulkan Tugas</strong>, lalu tempelkan link hasil pengerjaan (Google Docs, repository, atau link video YouTube).
                  </li>
                  <li>
                    Pengumpulan sebelum tenggat waktu akan berstatus <strong>Tepat Waktu</strong> (hijau), sedangkan pengumpulan setelah tenggat akan otomatis ditandai <strong>Terlambat</strong> (merah).
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Support Footer Card */}
        <div className="p-4 rounded-xl border bg-muted/40 text-center space-y-2">
          <p className="text-sm font-medium">Mengalami kendala teknis atau butuh bantuan lebih lanjut?</p>
          <p className="text-xs text-muted-foreground">
            Hubungi asisten laboratorium atau sampaikan isu melalui repositori resmi di{" "}
            <a
              href="https://github.com/ZeaLIsHere/Komit_v.0.0.1"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80"
            >
              GitHub Komit Platform
            </a>.
          </p>
        </div>
      </main>
    </div>
  );
}
