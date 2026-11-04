export interface MilestoneTemplateItem {
  id: string;
  title: string;
  description: string;
  offsetDays: number;
}

export interface CourseMilestoneCategory {
  id: string;
  name: string;
  code: string;
  milestones: MilestoneTemplateItem[];
}

export const MILESTONE_TEMPLATES: CourseMilestoneCategory[] = [
  {
    id: "rpl",
    name: "Rekayasa Perangkat Lunak (RPL)",
    code: "TIF2101",
    milestones: [
      {
        id: "rpl-1",
        title: "Milestone 1: Proposal & Analisis Kebutuhan (SRS)",
        description:
          "Pengumpulan dokumen Spesifikasi Kebutuhan Perangkat Lunak (SRS), backlog user story, dan pembagian peran awal kelompok. Sertakan tautan Google Docs/Drive dokumen SRS.",
        offsetDays: 14,
      },
      {
        id: "rpl-2",
        title: "Milestone 2: Desain Arsitektur & ERD",
        description:
          "Perancangan diagram arsitektur sistem, wireframe/mockup UI/UX Figma, dan Entity Relationship Diagram (ERD). Sertakan tautan desain Figma dan dokumen perancangan.",
        offsetDays: 28,
      },
      {
        id: "rpl-3",
        title: "Milestone 3: Sprint 1 MVP",
        description:
          "Implementasi fitur utama (Minimum Viable Product). Kode terintegrasi pada repositori GitHub kelompok dengan pull request aktif dari setiap anggota. Sertakan tautan repo GitHub.",
        offsetDays: 42,
      },
      {
        id: "rpl-4",
        title: "Milestone 4: Uji Coba & Demo Akhir",
        description:
          "Laporan pengujian sistem (unit test/blackbox test), deployment aplikasi yang dapat diakses publik, dan video rekaman demo produk kelompok.",
        offsetDays: 56,
      },
    ],
  },
  {
    id: "basis-data",
    name: "Basis Data",
    code: "TIF2102",
    milestones: [
      {
        id: "bd-1",
        title: "Milestone 1: Desain Konseptual & ERD",
        description:
          "Perancangan konseptual basis data, identifikasi entitas, relasi, kardinalitas, dan pembuatan Entity Relationship Diagram (ERD) lengkap dengan kamus data.",
        offsetDays: 14,
      },
      {
        id: "bd-2",
        title: "Milestone 2: Normalisasi & DDL PostgreSQL",
        description:
          "Dokumentasi proses normalisasi (1NF sampai 3NF/BCNF) dan skrip DDL SQL (CREATE TABLE, foreign key, not null constraints) yang sudah diuji pada database PostgreSQL.",
        offsetDays: 28,
      },
      {
        id: "bd-3",
        title: "Milestone 3: Query Agregasi & Indexing",
        description:
          "Penyusunan query analitis SQL kompleks (JOIN multipel, GROUP BY, subquery, VIEW) serta optimasi performa melalui index dan analisis EXPLAIN.",
        offsetDays: 42,
      },
      {
        id: "bd-4",
        title: "Milestone 4: Integrasi Aplikasi CRUD",
        description:
          "Aplikasi mini yang terhubung dengan basis data dan mendukung operasi CRUD penuh dengan penanganan transaksi (ACID). Sertakan tautan repositori kode.",
        offsetDays: 56,
      },
    ],
  },
  {
    id: "pemrograman-web",
    name: "Pemrograman Web",
    code: "TIF2103",
    milestones: [
      {
        id: "web-1",
        title: "Milestone 1: Mockup UI & Struktur Halaman",
        description:
          "Desain tata letak antarmuka web responsif (desktop & mobile) beserta struktur folder proyek frontend. Sertakan tautan Figma dan repositori awal.",
        offsetDays: 14,
      },
      {
        id: "web-2",
        title: "Milestone 2: Autentikasi & Routing",
        description:
          "Implementasi halaman navigasi, registrasi, login pengguna, dan proteksi sesi/token pada aplikasi web kelompok.",
        offsetDays: 28,
      },
      {
        id: "web-3",
        title: "Milestone 3: API & Integrasi Database",
        description:
          "Pembuatan REST API / Server Actions untuk pengolahan data dinamis dan koneksi ke database. Seluruh alur data bisnis berfungsi end-to-end.",
        offsetDays: 42,
      },
      {
        id: "web-4",
        title: "Milestone 4: Deployment & Uji Fungsional",
        description:
          "Aplikasi web ter-deploy secara live (misal: Vercel / Railway / VPS) dengan domain publik yang dapat diakses untuk pengujian dosen.",
        offsetDays: 56,
      },
    ],
  },
  {
    id: "pbo",
    name: "Pemrograman Berorientasi Objek (PBO)",
    code: "TIF2104",
    milestones: [
      {
        id: "pbo-1",
        title: "Milestone 1: Use Case & Class Diagram",
        description:
          "Perancangan Use Case diagram dan Class Diagram berstandar UML yang menggambarkan relasi inheritance, association, dan dependency antar kelas.",
        offsetDays: 14,
      },
      {
        id: "pbo-2",
        title: "Milestone 2: Implementasi Enkapsulasi & Polimorfisme",
        description:
          "Implementasi fondasi OOP dalam kode program: abstraksi, enkapsulasi, pewarisan (inheritance), dan method overriding/polimorfisme dengan unit testing.",
        offsetDays: 28,
      },
      {
        id: "pbo-3",
        title: "Milestone 3: GUI & Penanganan Eksepsi",
        description:
          "Pembangunan antarmuka grafis (GUI) aplikasi dan penanganan eksepsi (exception handling) yang andal agar aplikasi tidak crash saat terjadi kesalahan input.",
        offsetDays: 42,
      },
      {
        id: "pbo-4",
        title: "Milestone 4: Demo Akhir & Eksekutabel",
        description:
          "Paket installer / file eksekutabel (misal: .jar / .exe), dokumentasi petunjuk instalasi, dan video demonstrasi interaksi sistem.",
        offsetDays: 56,
      },
    ],
  },
];
