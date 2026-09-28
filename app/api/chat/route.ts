import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

type ChatMessage = { role: "user" | "assistant"; text: string };

// Route ini berjalan di server, jadi OPENAI_API_KEY aman dan tidak terlihat di browser.
export async function POST(request: Request) {
  // Hanya anggota keluarga yang sudah login yang boleh memakai AI (melindungi kuota OpenAI)
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY belum diisi" }, { status: 503 });
  }

  let body: { messages?: ChatMessage[]; context?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
  if (messages.length === 0) {
    return NextResponse.json({ error: "Pesan kosong" }, { status: 400 });
  }

  const system =
    "Kamu adalah asisten HomeLink, aplikasi manajemen keluarga. " +
    `Kamu sedang berbicara dengan ${session.name}. ` +
    "Jawab dalam bahasa Indonesia yang ramah, singkat, dan jelas. " +
    "Kamu boleh menjawab pertanyaan apa saja: pengetahuan umum, resep, tips rumah tangga, " +
    "matematika, ide kegiatan, menulis pesan atau pantun, belajar anak, dan lainnya. " +
    "Untuk pertanyaan tentang keluarga ini (jadwal, tugas, belanja, keuangan, check-in, riwayat login), " +
    "gunakan data di bawah dan jangan mengarang data yang tidak ada. " +
    "Untuk topik medis, hukum, atau keuangan yang serius, beri penjelasan umum dan sarankan bertanya ke ahlinya. " +
    "Kamu tidak bisa mengubah data langsung; kalau pengguna ingin menambah data, arahkan memakai perintah seperti " +
    '"tambah belanja susu 2 liter", "tambah tugas cuci mobil untuk Ayah", "catat pengeluaran 50rb beli bensin", ' +
    'atau "tambah jadwal les besok jam 16.00".\n\n' +
    (body.context ?? "");

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          ...messages.map((m) => ({ role: m.role, content: m.text })),
        ],
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "OpenAI menolak permintaan" }, { status: 502 });
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) {
      return NextResponse.json({ error: "Balasan kosong" }, { status: 502 });
    }
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: "Gagal menghubungi OpenAI" }, { status: 502 });
  }
}
