import { db } from "@/lib/db";

/**
 * Fetches group details including course, members, repositories, and milestone submissions.
 */
export async function getGroupDetail(groupId: string) {
  const group = await db.group.findUnique({
    where: { id: groupId },
    include: {
      course: {
        select: {
          id: true,
          name: true,
          code: true,
          semester: true,
          lecturerId: true,
          archived: true,
        },
      },
      repositories: {
        orderBy: { createdAt: "desc" },
      },
      memberships: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              nim: true,
              username: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: [{ isLeader: "desc" }, { joinedAt: "asc" }],
      },
      submissions: {
        include: {
          milestone: true,
        },
        orderBy: {
          milestone: {
            dueAt: "asc",
          },
        },
      },
    },
  });

  return group;
}
