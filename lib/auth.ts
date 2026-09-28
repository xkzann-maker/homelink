// Khusus SERVER (dipakai di app/api/*). Jangan di-import dari komponen "use client".
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE = "homelink_session";
export const MAX_AGE = 60 * 60 * 24 * 7; // sesi login berlaku 7 hari

// Kata sandi keluarga. Sebaiknya di-set lewat HOMELINK_PASSWORD (di .env.local / Vercel)
// supaya tidak tertulis di kode. Kalau kosong, dipakai kata sandi bawaan ini.
const password = () => process.env.HOMELINK_PASSWORD || "KeluargaCeria";
// Kunci rahasia untuk menandatangani cookie. Isi HOMELINK_SECRET dengan teks acak panjang.
const secret = () => process.env.HOMELINK_SECRET || `homelink::${password()}`;

const sha = (s: string) => createHash("sha256").update(s).digest();

export function checkPassword(input: string): boolean {
  return timingSafeEqual(sha(input), sha(password()));
}

// Rapikan nama: buang karakter aneh, maks 30 huruf, awal kata huruf besar
export function cleanName(raw: string): string {
  const name = raw
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N} .'-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 30);
  return name
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function makeSession(name: string): string {
  const payload = Buffer.from(JSON.stringify({ n: name, t: Date.now() })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readSession(token: string | undefined): { name: string } | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data.n !== "string" || typeof data.t !== "number") return null;
    if (Date.now() - data.t > MAX_AGE * 1000) return null;
    return { name: data.n };
  } catch {
    return null;
  }
}

// Baca sesi dari cookie permintaan
export function getSession(request: Request): { name: string } | null {
  const header = request.headers.get("cookie") ?? "";
  const part = header.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE}=`));
  return readSession(part ? part.slice(COOKIE.length + 1) : undefined);
}

export function isHttps(request: Request): boolean {
  return (
    new URL(request.url).protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https"
  );
}
