import { NextResponse, type NextRequest } from "next/server";
import { OPS_COOKIE, verifyCookieValue } from "@/lib/ops-auth";

export const config = {
  matcher: ["/ops/:path*", "/api/ops/:path*"],
};

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /ops/login and /api/ops/login are publicly reachable so users can sign in.
  if (
    pathname === "/ops/login" ||
    pathname.startsWith("/api/ops/login") ||
    pathname.startsWith("/api/ops/logout")
  ) {
    return NextResponse.next();
  }

  const secret = process.env.OPS_AUTH_SECRET;
  if (!secret) {
    return new NextResponse(
      "OPS_AUTH_SECRET not configured. Set it in .env.local.",
      { status: 500 }
    );
  }

  const cookie = req.cookies.get(OPS_COOKIE)?.value;
  const ok = await verifyCookieValue(cookie, secret);
  if (ok) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const host = req.headers.get("host") ?? req.nextUrl.host;
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  const search = new URLSearchParams();
  search.set("next", pathname);
  return NextResponse.redirect(`${proto}://${host}/ops/login?${search.toString()}`);
}
