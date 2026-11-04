export function HowItWorks() {
  const steps = [
    {
      number: "1",
      title: "Dosen Siapkan Kelas & Milestone",
      description:
        "Dosen membuat mata kuliah, mengimpor daftar kelompok via CSV, dan menetapkan tenggat target milestone yang jelas.",
    },
    {
      number: "2",
      title: "Kelompok Hubungkan GitHub",
      description:
        "Mahasiswa bergabung dengan kode undangan dan memasang aplikasi GitHub ke repositori kelompok dengan izin read-only.",
    },
    {
      number: "3",
      title: "Aktivitas Terpantau Otomatis",
      description:
        "Setiap commit, PR, dan review tercatat dan difilter otomatis. Dosen dan anggota memantau ritme kerja yang sama.",
    },
  ];

  return (
    <section id="cara-kerja" className="py-16 md:py-24 border-b bg-muted/20">
      <div className="max-w-5xl mx-auto px-4 space-y-12">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Cara Kerja Komit
          </h2>
          <p className="text-sm text-muted-foreground">
            Alur praktis yang dirancang agar setup kelompok selesai dalam kurang
            dari 10 menit tanpa perlu konfigurasi rumit.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className="bg-card border rounded-lg p-6 space-y-3 relative shadow-none"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
                {step.number}
              </div>
              <h3 className="font-semibold text-base tracking-tight text-foreground">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
