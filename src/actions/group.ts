"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, requireLecturer } from "@/lib/auth";

export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

const createGroupSchema = z.object({
  name: z.string().min(2, "Nama kelompok minimal 2 karakter"),
});

export interface CsvImportRowResult {
  row: number;
  groupName: string;
  status: "SUCCESS" | "FAILED";
  reason?: string;
  nimsAssigned: string[];
  nimsPending: string[];
}

export interface CsvImportSummary {
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  results: CsvImportRowResult[];
}

function generateInviteCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

/**
 * Creates a single project group inside a course.
 */
export async function createGroup(
  courseId: string,
  input: z.infer<typeof createGroupSchema>
): Promise<ActionResult> {
  try {
    await requireLecturer(courseId);

    const parsed = createGroupSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message || "Input tidak valid" };
    }

    let inviteCode = generateInviteCode();
    // Ensure uniqueness
    let existing = await db.group.findUnique({ where: { inviteCode } });
    while (existing) {
      inviteCode = generateInviteCode();
      existing = await db.group.findUnique({ where: { inviteCode } });
    }

    const group = await db.group.create({
      data: {
        courseId,
        name: parsed.data.name,
        inviteCode,
        status: "ACTIVE",
      },
    });

    revalidatePath(`/courses/${courseId}`);
    return { success: true, data: group };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat kelompok";
    return { success: false, error: message };
  }
}

/**
 * Parses CSV content and batch-creates groups and memberships.
 * Expected CSV format: nama_kelompok,nim_1,nim_2,nim_3,nim_4,nim_5
 */
export async function importCSV(
  courseId: string,
  csvContent: string
): Promise<ActionResult<CsvImportSummary>> {
  try {
    await requireLecturer(courseId);

    const lines = csvContent
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length < 2) {
      return {
        success: false,
        error: "File CSV kosong atau tidak memiliki baris data",
      };
    }

    const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
    const groupNameIndex = header.indexOf("nama_kelompok");

    if (groupNameIndex === -1) {
      return {
        success: false,
        error: 'Header CSV wajib memiliki kolom "nama_kelompok"',
      };
    }

    const nimColIndices = header
      .map((col, idx) => (col.startsWith("nim") ? idx : -1))
      .filter((idx) => idx !== -1);

    if (nimColIndices.length === 0) {
      return {
        success: false,
        error: 'Header CSV harus memiliki minimal 1 kolom NIM (contoh: nim_1)',
      };
    }

    const results: CsvImportRowResult[] = [];
    let successCount = 0;
    let failedCount = 0;

    // Track NIMs already processed in this batch or in this course
    const seenNimsInCourse = new Set<string>();

    // Fetch existing course memberships to prevent cross-group duplicate NIMs in same course
    const existingMemberships = await db.membership.findMany({
      where: {
        group: { courseId },
      },
      include: {
        user: true,
      },
    });

    for (const m of existingMemberships) {
      if (m.user.nim) {
        seenNimsInCourse.add(m.user.nim);
      }
    }

    for (let i = 1; i < lines.length; i++) {
      const rowNumber = i + 1;
      const cols = lines[i].split(",").map((c) => c.trim());
      const groupName = cols[groupNameIndex] || "";

      if (!groupName) {
        failedCount++;
        results.push({
          row: rowNumber,
          groupName: "-",
          status: "FAILED",
          reason: "Nama kelompok kosong",
          nimsAssigned: [],
          nimsPending: [],
        });
        continue;
      }

      // Collect NIMs for this group
      const rowNims = nimColIndices
        .map((idx) => cols[idx] || "")
        .filter((nim) => nim.length > 0);

      // Validate duplicate NIMs in the same row or course
      let duplicateNimFound: string | null = null;
      for (const nim of rowNims) {
        if (seenNimsInCourse.has(nim)) {
          duplicateNimFound = nim;
          break;
        }
      }

      if (duplicateNimFound) {
        failedCount++;
        results.push({
          row: rowNumber,
          groupName,
          status: "FAILED",
          reason: `NIM ${duplicateNimFound} sudah terdaftar di kelompok lain dalam mata kuliah ini`,
          nimsAssigned: [],
          nimsPending: [],
        });
        continue;
      }

      // Add to seen set
      for (const nim of rowNims) {
        seenNimsInCourse.add(nim);
      }

      // Create group and find users by NIM
      try {
        let inviteCode = generateInviteCode();
        let existing = await db.group.findUnique({ where: { inviteCode } });
        while (existing) {
          inviteCode = generateInviteCode();
          existing = await db.group.findUnique({ where: { inviteCode } });
        }

        const group = await db.group.create({
          data: {
            courseId,
            name: groupName,
            inviteCode,
            status: "ACTIVE",
          },
        });

        const nimsAssigned: string[] = [];
        const nimsPending: string[] = [];

        for (const nim of rowNims) {
          const user = await db.user.findFirst({ where: { nim } });
          if (user) {
            await db.membership.create({
              data: {
                userId: user.id,
                groupId: group.id,
                isLeader: nimsAssigned.length === 0, // First member as leader candidate
              },
            });
            nimsAssigned.push(nim);
          } else {
            nimsPending.push(nim);
          }
        }

        successCount++;
        results.push({
          row: rowNumber,
          groupName,
          status: "SUCCESS",
          nimsAssigned,
          nimsPending,
        });
      } catch (err) {
        failedCount++;
        results.push({
          row: rowNumber,
          groupName,
          status: "FAILED",
          reason: err instanceof Error ? err.message : "Gagal menyimpan ke database",
          nimsAssigned: [],
          nimsPending: [],
        });
      }
    }

    revalidatePath(`/courses/${courseId}`);

    return {
      success: true,
      data: {
        totalProcessed: lines.length - 1,
        successCount,
        failedCount,
        results,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memproses file CSV";
    return { success: false, error: message };
  }
}

/**
 * Allows a student to join a group using an invite code.
 * Enforces rule F-13: Student cannot join multiple groups in the same course.
 */
export async function joinGroup(inviteCode: string): Promise<ActionResult> {
  try {
    const user = await requireAuth();

    if (user.role !== "STUDENT") {
      return { success: false, error: "Hanya mahasiswa yang dapat bergabung ke kelompok" };
    }

    const cleanCode = inviteCode.trim().toUpperCase();
    const group = await db.group.findUnique({
      where: { inviteCode: cleanCode },
      include: {
        course: true,
      },
    });

    if (!group) {
      return { success: false, error: "Kode undangan tidak ditemukan atau tidak valid" };
    }

    if (group.course.archived) {
      return { success: false, error: "Mata kuliah untuk kelompok ini sudah diarsipkan" };
    }

    // Check F-13: Student must not be in another group in the same course
    const existingMembershipInCourse = await db.membership.findFirst({
      where: {
        userId: user.id,
        group: {
          courseId: group.courseId,
        },
      },
      include: {
        group: true,
      },
    });

    if (existingMembershipInCourse) {
      return {
        success: false,
        error: `Anda sudah tergabung dalam kelompok "${existingMembershipInCourse.group.name}" pada mata kuliah ini`,
      };
    }

    // Check whether this group already has members to determine leader
    const existingMembersCount = await db.membership.count({
      where: { groupId: group.id },
    });

    const membership = await db.membership.create({
      data: {
        userId: user.id,
        groupId: group.id,
        isLeader: existingMembersCount === 0,
      },
    });

    revalidatePath(`/courses/${group.courseId}`);
    return {
      success: true,
      data: {
        groupId: group.id,
        courseId: group.courseId,
        membershipId: membership.id,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal bergabung ke kelompok";
    return { success: false, error: message };
  }
}

/**
 * Removes a member from a group (lecturer only).
 */
export async function removeMember(
  groupId: string,
  userId: string
): Promise<ActionResult> {
  try {
    const group = await db.group.findUnique({
      where: { id: groupId },
      select: { courseId: true },
    });

    if (!group) {
      return { success: false, error: "Kelompok tidak ditemukan" };
    }

    await requireLecturer(group.courseId);

    await db.membership.delete({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    revalidatePath(`/courses/${group.courseId}`);
    return { success: true, data: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menghapus anggota";
    return { success: false, error: message };
  }
}

/**
 * Moves a member atomically between groups within the same course (lecturer only).
 */
export async function moveMember(
  fromGroupId: string,
  toGroupId: string,
  userId: string
): Promise<ActionResult> {
  try {
    const [fromGroup, toGroup] = await Promise.all([
      db.group.findUnique({ where: { id: fromGroupId }, select: { courseId: true } }),
      db.group.findUnique({ where: { id: toGroupId }, select: { courseId: true } }),
    ]);

    if (!fromGroup || !toGroup) {
      return { success: false, error: "Kelompok asal atau tujuan tidak ditemukan" };
    }

    if (fromGroup.courseId !== toGroup.courseId) {
      return { success: false, error: "Kedua kelompok harus berada dalam mata kuliah yang sama" };
    }

    await requireLecturer(fromGroup.courseId);

    await db.$transaction([
      db.membership.delete({
        where: {
          userId_groupId: {
            userId,
            groupId: fromGroupId,
          },
        },
      }),
      db.membership.create({
        data: {
          userId,
          groupId: toGroupId,
          isLeader: false,
        },
      }),
    ]);

    revalidatePath(`/courses/${fromGroup.courseId}`);
    return { success: true, data: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memindahkan anggota";
    return { success: false, error: message };
  }
}

