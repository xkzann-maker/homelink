import { NextResponse } from "next/server";
import { COOKIE, MAX_AGE, checkPassword, cleanName, isHttps, makeSession } from "@/lib/auth";

// Batasi percobaan salah: maks 8 kali per 10 menit per alamat IP (best-effort)
const fails = new Map<string, { count: number; reset: number }>();

export async function POST(request: Request) {
  const ip = (request.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  const now = Date.now();
  const f = fails.get(ip);
  if (f && f.reset > now && f.count >= 8) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi." },
      { status: 429 }
    );
  }

  let body: { name?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }

  const name = cleanName(typeof body.name === "string" ? body.name : "");
  if (!name) {
    return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
  }

  if (!checkPassword(typeof body.password === "string" ? body.password : "")) {
    const current = f && f.reset > now ? f : { count: 0, reset: now + 10 * 60 * 1000 };
    fails.set(ip, { count: current.count + 1, reset: current.reset });
    return NextResponse.json({ error: "Kata sandi salah" }, { status: 401 });
  }

  fails.delete(ip);
  const res = NextResponse.json({ name });
  res.cookies.set(COOKIE, makeSession(name), {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps(request),
    path: "/",
    maxAge: MAX_AGE,
  });
  return res;
}
