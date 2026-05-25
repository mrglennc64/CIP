import { NextResponse, type NextRequest } from "next/server";
import { OPS_COOKIE } from "@/lib/ops-auth";

export async function POST(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/ops/login";
  url.search = "";
  const res = NextResponse.redirect(url, { status: 303 });
  res.cookies.set(OPS_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
