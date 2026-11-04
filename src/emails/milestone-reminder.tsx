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

export interface MilestoneReminderEmailProps {
  recipientName: string;
  milestoneTitle: string;
  courseName: string;
  groupName: string;
  daysRemaining: number;
  dueAt: string;
  submissionUrl: string;
}

export function MilestoneReminderEmail({
  recipientName = "Mahasiswa",
  milestoneTitle = "Milestone 1: Desain Basis Data",
  courseName = "Basis Data",
  groupName = "Kelompok 3",
  daysRemaining = 3,
  dueAt = "25 Oktober 2026, 23:59 WIB",
  submissionUrl = "https://komit.app",
}: MilestoneReminderEmailProps) {
  const urgencyText =
    daysRemaining <= 1 ? "Besok adalah tenggat!" : `${daysRemaining} hari lagi`;

  return (
    <Html lang="id">
      <Head />
      <Preview>
        {`Pengingat: Tenggat ${milestoneTitle} (${urgencyText})`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Pengingat Tenggat Milestone</Heading>
          <Text style={paragraph}>Halo {recipientName},</Text>
          <Text style={paragraph}>
            Kelompok Anda (<strong>{groupName}</strong>) belum mengumpulkan{" "}
            <strong>{milestoneTitle}</strong> pada mata kuliah{" "}
            <strong>{courseName}</strong>.
          </Text>
          <Section style={card}>
            <Text style={cardTitle}>Tenggat Pengumpulan:</Text>
            <Text style={cardText}>
              <strong>{dueAt}</strong> ({urgencyText})
            </Text>
          </Section>
          <Text style={paragraph}>
            Pastikan seluruh tautan hasil pengerjaan (repositori GitHub, dokumen,
            atau video demo) sudah dikumpulkan sebelum batas waktu agar tidak
            ditandai Terlambat oleh sistem.
          </Text>
          <Section style={btnContainer}>
            <Button style={button} href={submissionUrl}>
              Kumpulkan Milestone Sekarang
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
  color: "#1e40af",
  margin: "0 0 16px",
};

const paragraph = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#333333",
  margin: "0 0 12px",
};

const card = {
  backgroundColor: "#eff6ff",
  borderRadius: "6px",
  padding: "12px 16px",
  margin: "16px 0",
  border: "1px solid #bfdbfe",
};

const cardTitle = {
  fontSize: "12px",
  color: "#1e3a8a",
  margin: "0 0 4px",
  textTransform: "uppercase" as const,
  fontWeight: "600",
};

const cardText = {
  fontSize: "14px",
  color: "#1d4ed8",
  margin: 0,
};

const btnContainer = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const button = {
  backgroundColor: "#2563eb",
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
