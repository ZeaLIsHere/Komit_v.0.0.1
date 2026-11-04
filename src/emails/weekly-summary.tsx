import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface CourseSummaryItem {
  code: string;
  name: string;
  activeCount: number;
  slowingCount: number;
  inactiveCount: number;
  lateSubmissionsCount: number;
}

export interface WeeklySummaryEmailProps {
  lecturerName: string;
  weekRange: string;
  courses: CourseSummaryItem[];
  dashboardUrl: string;
}

export function WeeklySummaryEmail({
  lecturerName = "Bapak/Ibu Dosen",
  weekRange = "28 Okt - 3 Nov 2026",
  courses = [],
  dashboardUrl = "https://komit.app",
}: WeeklySummaryEmailProps) {
  return (
    <Html lang="id">
      <Head />
      <Preview>{`Ringkasan Mingguan Aktivitas Proyek (${weekRange})`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Ringkasan Mingguan Komit</Heading>
          <Text style={paragraph}>Yth. {lecturerName},</Text>
          <Text style={paragraph}>
            Berikut adalah rekap status keaktifan kelompok dan pengumpulan
            milestone pada seluruh mata kuliah Anda untuk periode{" "}
            <strong>{weekRange}</strong>.
          </Text>

          {courses.map((c, i) => (
            <Section key={i} style={courseSection}>
              <Text style={courseTitle}>
                {c.code} — {c.name}
              </Text>
              <div style={statsGrid}>
                <div style={statBox}>
                  <Text style={statNumber}>{c.activeCount}</Text>
                  <Text style={statLabel}>Aktif</Text>
                </div>
                <div style={statBox}>
                  <Text style={{ ...statNumber, color: "#d97706" }}>
                    {c.slowingCount}
                  </Text>
                  <Text style={statLabel}>Melambat</Text>
                </div>
                <div style={statBox}>
                  <Text style={{ ...statNumber, color: "#dc2626" }}>
                    {c.inactiveCount}
                  </Text>
                  <Text style={statLabel}>Tidak Aktif</Text>
                </div>
                <div style={statBox}>
                  <Text style={{ ...statNumber, color: "#7c3aed" }}>
                    {c.lateSubmissionsCount}
                  </Text>
                  <Text style={statLabel}>Terlambat</Text>
                </div>
              </div>
            </Section>
          ))}

          <Section style={btnContainer}>
            <Button style={button} href={dashboardUrl}>
              Buka Dashboard Dosen
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            Email ini dikirim otomatis setiap hari Senin pukul 08:00 WIB oleh
            Platform Komit. Pengaturan frekuensi email dapat diubah di menu
            Pengaturan.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "24px",
  marginBottom: "64px",
  borderRadius: "8px",
  border: "1px solid #e6ebf1",
  maxWidth: "560px",
};

const heading = {
  fontSize: "20px",
  fontWeight: "600",
  color: "#111827",
  margin: "0 0 16px",
};

const paragraph = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#333333",
  margin: "0 0 12px",
};

const courseSection = {
  border: "1px solid #e5e7eb",
  borderRadius: "6px",
  padding: "12px 16px",
  margin: "12px 0",
};

const courseTitle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#111827",
  margin: "0 0 8px",
};

const statsGrid = {
  display: "flex",
  justifyContent: "space-between",
};

const statBox = {
  textAlign: "center" as const,
  flex: 1,
};

const statNumber = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#16a34a",
  margin: "0",
};

const statLabel = {
  fontSize: "11px",
  color: "#6b7280",
  margin: "2px 0 0",
};

const btnContainer = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const button = {
  backgroundColor: "#111827",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "500",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "10px 20px",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "18px",
};
