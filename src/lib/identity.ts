import { db } from "@/lib/db";

export interface RawAuthorInput {
  username?: string | null;
  email?: string | null;
  name?: string | null;
}

/**
 * Attempts to automatically map a Git commit or event author to an enrolled user.
 * Order:
 * 1. Exact match on GitHub username -> User.username
 * 2. Exact match on commit author email -> User.email
 * 3. Existing IdentityMapping configured for this repository
 * 4. Return null if unmapped (placed in "belum terhubung" list)
 */
export async function autoMapIdentity(
  author: RawAuthorInput,
  repoId: string
): Promise<string | null> {
  const { username, email, name } = author;

  // 1. Match by GitHub username
  if (username) {
    const userByUsername = await db.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (userByUsername) {
      return userByUsername.id;
    }
  }

  // 2. Match by email
  if (email) {
    const userByEmail = await db.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (userByEmail) {
      return userByEmail.id;
    }
  }

  // 3. Match against existing IdentityMapping for this repo
  const rawAuthorsToCheck = [username, email, name].filter(
    (val): val is string => typeof val === "string" && val.trim().length > 0
  );

  if (rawAuthorsToCheck.length > 0) {
    const existingMapping = await db.identityMapping.findFirst({
      where: {
        repoId,
        rawAuthor: {
          in: rawAuthorsToCheck,
        },
      },
      select: { userId: true },
    });

    if (existingMapping) {
      return existingMapping.userId;
    }
  }

  return null;
}

