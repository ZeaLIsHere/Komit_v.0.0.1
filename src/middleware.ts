import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  });

  const isPublicPath =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/github/webhook");

  // Unauthenticated user attempting to access protected route
  if (!token && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user checks
  if (token) {
    const isStudent = (token.role as string) === "STUDENT";
    const isProfileIncomplete = isStudent && (!token.name || !token.nim);

    if (isProfileIncomplete) {
      if (pathname !== "/onboarding" && !pathname.startsWith("/api")) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
    } else {
      // Profile complete or lecturer: redirect away from login/onboarding
      if (pathname === "/login" || pathname === "/onboarding") {
        return NextResponse.redirect(new URL("/courses", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
