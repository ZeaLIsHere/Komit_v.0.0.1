import NextAuth, { type DefaultSession } from "next-auth";
import GitHub from "next-auth/providers/github";
import { db } from "@/lib/db";

// Ensure Auth.js v5 has guaranteed URL and secret fallbacks on localhost
if (!process.env.AUTH_URL) {
  process.env.AUTH_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";
}
if (!process.env.AUTH_SECRET && process.env.NEXTAUTH_SECRET) {
  process.env.AUTH_SECRET = process.env.NEXTAUTH_SECRET;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "LECTURER" | "STUDENT";
      githubId: string;
      name: string | null;
      nim: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: "LECTURER" | "STUDENT";
    githubId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: "LECTURER" | "STUDENT";
    githubId?: string;
    name?: string | null;
    nim?: string | null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID || process.env.AUTH_GITHUB_ID,
      clientSecret:
        process.env.GITHUB_CLIENT_SECRET || process.env.AUTH_GITHUB_SECRET,
      issuer: "https://github.com/login/oauth",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, profile, trigger, session }) {
      if (trigger === "update" && session?.name) {
        token.name = session.name;
      }

      if (profile) {
        const githubId = String(profile.id);
        const username =
          (profile.login as string) ?? (profile.name as string) ?? "user";
        const email = profile.email as string | undefined;

        const existingUser = await db.user.findUnique({
          where: { githubId },
        });

        let role: "LECTURER" | "STUDENT" = existingUser?.role ?? "STUDENT";

        if (role !== "LECTURER") {
          const isAllowed = await db.allowedLecturer.findFirst({
            where: {
              OR: [
                {
                  githubUsername: {
                    equals: username,
                    mode: "insensitive" as const,
                  },
                },
                ...(email
                  ? [
                      {
                        email: {
                          equals: email,
                          mode: "insensitive" as const,
                        },
                      },
                    ]
                  : []),
              ],
            },
          });
          if (isAllowed) {
            role = "LECTURER";
          }
        }

        const dbUser = await db.user.upsert({
          where: { githubId },
          update: {
            username,
            email: email ?? existingUser?.email,
            avatarUrl: (profile.avatar_url as string) ?? null,
            role,
          },
          create: {
            githubId,
            username,
            name:
              role === "LECTURER"
                ? ((profile.name as string) ?? username)
                : null,
            email,
            avatarUrl: (profile.avatar_url as string) ?? null,
            role,
          },
        });

        token.userId = dbUser.id;
        token.role = dbUser.role;
        token.githubId = dbUser.githubId;
        token.name = dbUser.name;
        token.nim = dbUser.nim;
      }

      // Always sync role & profile with DB on token refresh
      if (token.userId) {
        const currentUser = await db.user.findUnique({
          where: { id: token.userId },
          select: { name: true, nim: true, role: true, username: true, email: true },
        });

        if (currentUser) {
          let currentRole = currentUser.role;

          // If token says STUDENT, check if user is in AllowedLecturer (case-insensitive)
          if (currentRole !== "LECTURER") {
            const isAllowed = await db.allowedLecturer.findFirst({
              where: {
                OR: [
                  {
                    githubUsername: {
                      equals: currentUser.username,
                      mode: "insensitive" as const,
                    },
                  },
                  ...(currentUser.email
                    ? [
                        {
                          email: {
                            equals: currentUser.email,
                            mode: "insensitive" as const,
                          },
                        },
                      ]
                    : []),
                ],
              },
            });

            if (isAllowed) {
              currentRole = "LECTURER";
              await db.user.update({
                where: { id: token.userId },
                data: { role: "LECTURER" },
              });
            }
          }

          token.name = currentUser.name;
          token.nim = currentUser.nim;
          token.role = currentRole;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role =
          (token.role as "LECTURER" | "STUDENT") ?? "STUDENT";
        session.user.githubId = token.githubId as string;
        session.user.name = (token.name as string | null) ?? null;
        session.user.nim = (token.nim as string | null) ?? null;
      }
      return session;
    },
  },
});

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function requireLecturer(courseId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  if (session.user.role !== "LECTURER") {
    throw new Error("Forbidden: Hanya dosen yang dapat melakukan tindakan ini");
  }
  const course = await db.course.findUnique({
    where: { id: courseId },
  });
  if (!course) {
    throw new Error("Mata kuliah tidak ditemukan");
  }
  if (course.lecturerId !== session.user.id) {
    throw new Error("Forbidden: Anda bukan pengampu mata kuliah ini");
  }
  return { session, course };
}

export async function requireMember(groupId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  const membership = await db.membership.findUnique({
    where: {
      userId_groupId: {
        userId: session.user.id,
        groupId,
      },
    },
  });
  if (!membership) {
    throw new Error("Forbidden: Anda bukan anggota kelompok ini");
  }
  return { session, membership };
}
