export function FAQ() {
  const faqs = [
    {
      question: "Apakah isi kode sumber proyek kami dibaca atau disimpan oleh sistem?",
      answer:
        "Tidak. Komit hanya meminta izin read-only untuk metadata aktivitas (nama author, waktu, judul PR/issue, dan jumlah baris kode yang diubah). Konten kode program Anda tidak pernah dibaca maupun disimpan di server kami.",
    },
    {
      question: "Bagaimana jika ada anggota yang berkontribusi di luar penulisan kode?",
      answer:
        "Tersedia fitur Catatan Kontribusi Non-Kode (desain UI/UX, riset, dokumentasi SRS, pengujian) yang dapat dicatat langsung oleh anggota di profil kelompok untuk diketahui dosen.",
    },
    {
      question: "Apakah Komit memberikan nilai akhir secara otomatis?",
      answer:
        "Tidak. Komit memegang prinsip bahwa data aktivitas hanyalah bahan diskusi dan indikator pendukung bagi dosen dan kelompok, bukan penentu nilai mutlak.",
    },
    {
      question: "Bagaimana jika author commit tidak cocok dengan akun GitHub mahasiswa?",
      answer:
        "Mahasiswa dapat menghubungkan nama atau email git commit yang belum terhubung melalui halaman Pemetaan Identitas kelompok secara mandiri.",
    },
  ];

  return (
    <section className="py-16 md:py-24 border-b bg-muted/20">
      <div className="max-w-4xl mx-auto px-4 space-y-12">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-sm text-muted-foreground">
            Hal-hal penting seputar privasi, etika pemantauan, dan penggunaan sistem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {faqs.map((faq, i) => (
            <div key={i} className="border rounded-lg p-5 space-y-2 bg-card">
              <h3 className="font-semibold text-sm text-foreground">
                {faq.question}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
