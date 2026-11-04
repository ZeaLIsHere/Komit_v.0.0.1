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

export interface GroupInactiveEmailProps {
  groupName: string;
  courseName: string;
  daysInactive: number;
  lastActivityDate?: string | null;
  dashboardUrl: string;
}

export function GroupInactiveEmail({
  groupName = "Kelompok 1",
  courseName = "Rekayasa Perangkat Lunak",
  daysInactive = 15,
  lastActivityDate = "20 Oktober 2026",
  dashboardUrl = "https://komit.app",
}: GroupInactiveEmailProps) {
  return (
    <Html lang="id">
      <Head />
      <Preview>
        {`Peringatan: ${groupName} tidak aktif selama ${daysInactive} hari`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Peringatan Kelompok Tidak Aktif</Heading>
          <Text style={paragraph}>Yth. Dosen Pengampu,</Text>
          <Text style={paragraph}>
            Sistem mendeteksi bahwa <strong>{groupName}</strong> pada mata
            kuliah <strong>{courseName}</strong> tidak memiliki aktivitas commit,
            pull request, maupun review selama <strong>{daysInactive} hari</strong>
            {lastActivityDate ? ` (terakhir aktif: ${lastActivityDate})` : ""}.
          </Text>
          <Section style={card}>
            <Text style={cardText}>
              Ambang batas status tidak aktif untuk mata kuliah ini telah terlampaui.
              Anda disarankan untuk memeriksa progres kelompok atau menghubungi
              anggota kelompok terkait.
            </Text>
          </Section>
          <Section style={btnContainer}>
            <Button style={button} href={dashboardUrl}>
              Lihat Detail Kelompok
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Email ini dikirim otomatis oleh Platform Komit Ilmu Komputer USU.
            Anda dapat mengatur preferensi notifikasi di menu Pengaturan.
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
  color: "#d9383a",
  margin: "0 0 16px",
};

const paragraph = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#333333",
  margin: "0 0 12px",
};

const card = {
  backgroundColor: "#fff5f5",
  borderRadius: "6px",
  padding: "12px 16px",
  margin: "16px 0",
  border: "1px solid #fed7d7",
};

const cardText = {
  fontSize: "13px",
  color: "#9b2c2c",
  margin: 0,
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
