import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/auth-helpers/server";

export async function middleware(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const protectedRoutes = ["/onboarding", "/profile"];
  const pathname = request.nextUrl.pathname;

  if (!session) {
    if (pathname !== "/sign-in" && pathname == "/sign-up") {
      NextResponse.redirect(new URL("/sign-up", request.url));
    } else {
      NextResponse.redirect(new URL("/sign-in", request.url));
    }
  }

  if (
    protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))
  ) {
    if (!session) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
    const userRole = session.user?.app_metadata?.role;

    if (userRole === "super-admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
