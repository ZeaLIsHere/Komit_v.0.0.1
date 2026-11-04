"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const completeProfileSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter"),
  nim: z
    .string()
    .trim()
    .regex(/^\d{7,14}$/, "NIM harus berupa 7-14 digit angka"),
});

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;

export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function completeProfile(
  rawInput: CompleteProfileInput
): Promise<ActionResponse<{ id: string; name: string; nim: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = completeProfileSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
    };
  }

  const { name, nim } = parsed.data;

  // Check NIM uniqueness
  const existingUserWithNim = await db.user.findFirst({
    where: {
      nim,
      id: { not: session.user.id },
    },
  });

  if (existingUserWithNim) {
    return { success: false, error: "NIM sudah terdaftar oleh pengguna lain" };
  }

  const updatedUser = await db.user.update({
    where: { id: session.user.id },
    data: { name, nim },
  });

  return {
    success: true,
    data: {
      id: updatedUser.id,
      name: updatedUser.name ?? name,
      nim: updatedUser.nim ?? nim,
    },
  };
}
