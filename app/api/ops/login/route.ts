import { NextResponse, type NextRequest } from "next/server";
import { OPS_COOKIE, makeCookieValue } from "@/lib/ops-auth";

// Build an absolute URL using the Host header the client actually used,
// not req.nextUrl which can default to localhost behind a direct IP.
function buildUrlFromRequest(req: NextRequest, path: string, search?: URLSearchParams): string {
  const host = req.headers.get("host") ?? req.nextUrl.host;
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  const qs = search && [...search].length > 0 ? `?${search.toString()}` : "";
  return `${proto}://${host}${path}${qs}`;
}

export async function POST(req: NextRequest) {
  const password = process.env.OPS_PASSWORD;
  const secret = process.env.OPS_AUTH_SECRET;
  if (!password || !secret) {
    return NextResponse.json(
      { error: "OPS_PASSWORD and OPS_AUTH_SECRET must be set in .env.local." },
      { status: 500 }
    );
  }

  const form = await req.formData();
  const submitted = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/ops/runs");

  if (submitted !== password) {
    const search = new URLSearchParams();
    search.set("error", "1");
    if (next) search.set("next", next);
    return NextResponse.redirect(buildUrlFromRequest(req, "/ops/login", search), { status: 303 });
  }

  const value = await makeCookieValue(secret);
  const target = next.startsWith("/ops") ? next : "/ops/runs";
  const res = NextResponse.redirect(buildUrlFromRequest(req, target), { status: 303 });
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  res.cookies.set(OPS_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: proto === "https",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return res;
}
