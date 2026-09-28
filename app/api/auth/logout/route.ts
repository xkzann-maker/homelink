import { NextResponse } from "next/server";
import { COOKIE, isHttps } from "@/lib/auth";

export async function POST(request: Request) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps(request),
    path: "/",
    maxAge: 0,
  });
  return res;
}
