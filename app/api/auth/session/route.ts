import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Dipakai browser untuk mengecek: masih login atau belum?
export async function GET(request: Request) {
  const session = getSession(request);
  return NextResponse.json({ name: session ? session.name : null });
}
