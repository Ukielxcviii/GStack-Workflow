import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * Optimistic redirect only — reads the refreshed session, does not perform
 * the real authorization check. That's src/lib/dal.ts's requireAdmin(),
 * called by every admin page/action. See the Next.js docs' own warning:
 * Proxy "should not be used as a full session management or authorization
 * solution."
 */
export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const path = request.nextUrl.pathname;
  const isLoginRoute = path === "/admin/login";

  if (path.startsWith("/admin") && !isLoginRoute && !user) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (isLoginRoute && user) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
