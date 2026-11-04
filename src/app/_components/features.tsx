export function Features() {
  const features = [
    {
      title: "Filter Noise Bawaan",
      description:
        "Commit perubahan lockfile, node_modules, folder build/dist, generated files, dan merge commit otomatis disaring agar data kontribusi tetap murni.",
    },
    {
      title: "Penanda Dini Kelompok Pasif",
      description:
        "Status kelompok dihitung otomatis: Aktif (≤7 hari), Melambat (8–14 hari), dan Tidak Aktif (>14 hari). Dosen mendapat peringatan sebelum waktu demo.",
    },
    {
      title: "Transparansi Indikator Anggota",
      description:
        "Tidak ada skor atau nilai otomatis tunggal yang menyesatkan. Komit menyajikan indikator objektif: hari aktif, jumlah commit, PR, review, dan catatan non-kode.",
    },
    {
      title: "Pengingat Tenggat Otomatis",
      description:
        "Email pengingat dikirim ke seluruh anggota kelompok pada H-3 dan H-1 sebelum batas waktu pengumpulan milestone berakhir.",
    },
  ];

  return (
    <section className="py-16 md:py-24 border-b">
      <div className="max-w-5xl mx-auto px-4 space-y-12">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Fitur Utama untuk Keadilan Penilaian
          </h2>
          <p className="text-sm text-muted-foreground">
            Didesain khusus untuk kebutuhan tugas besar berbasis perangkat lunak
            di lingkungan akademik.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((item, idx) => (
            <div
              key={idx}
              className="border rounded-lg p-6 space-y-2 bg-card/60 shadow-none hover:border-foreground/20 transition-colors"
            >
              <h3 className="font-semibold text-base text-foreground">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
