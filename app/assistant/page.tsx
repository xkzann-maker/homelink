"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { parseAction, type PendingAction } from "@/lib/actions";
import { buildContext, deterministicReply, localReply } from "@/lib/assistant";
import {
  memberColor,
  useCheckIns,
  useEvents,
  useShopping,
  useTasks,
  useTransactions,
} from "@/lib/data";
import { formatDateTime, timeAgo } from "@/lib/date";
import { useToday } from "@/lib/useToday";

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

// send: true = langsung dikirim, false = hanya mengisi kolom (perlu dilengkapi)
type Chip = { text: string; send: boolean };

const chipGroups: { title: string; chips: Chip[] }[] = [
  {
    title: "📊 Data keluarga",
    chips: [
      { text: "Buat ringkasan hari ini", send: true },
      { text: "Apa jadwal keluarga hari ini?", send: true },
      { text: "Tugas apa yang belum selesai?", send: true },
      { text: "Berapa pengeluaran bulan ini?", send: true },
      { text: "Bagaimana kabar keluarga hari ini?", send: true },
      { text: "Siapa saja yang login?", send: true },
      { text: "Bagikan tugas dengan adil", send: true },
    ],
  },
  {
    title: "🧰 Bantu sehari-hari",
    chips: [
      { text: "Ide menu makan malam", send: true },
      { text: "Ide kegiatan akhir pekan", send: true },
      { text: "Tips hemat listrik", send: true },
      { text: "Hitung 25000 x 3 + 1500", send: true },
      { text: "Patungan 300rb untuk 4 orang", send: true },
      { text: "Diskon 20% dari 150rb", send: true },
      { text: "Konversi 5 km ke m", send: true },
    ],
  },
  {
    title: "✍️ Perintah cepat",
    chips: [
      { text: "Tambah belanja susu 2 liter", send: false },
      { text: "Tambah tugas cuci mobil untuk Ayah", send: false },
      { text: "Catat pengeluaran 50rb beli bensin", send: false },
      { text: "Tambah jadwal les piano besok jam 16.00 untuk Kakak", send: false },
    ],
  },
  {
    title: "🎈 Santai",
    chips: [
      { text: "Ceritakan jokes", send: true },
      { text: "Berikan pantun", send: true },
      { text: "Beri aku semangat", send: true },
      { text: "Fakta unik hari ini", send: true },
      { text: "Bantuan", send: true },
    ],
  },
];

export default function AssistantPage() {
  const today = useToday();
  const { user, logins } = useAuth();
  const events = useEvents();
  const tasks = useTasks();
  const shopping = useShopping();
  const transactions = useTransactions();
  const checkIns = useCheckIns();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      text: `Halo, ${user}! Saya asisten HomeLink. Tanya apa saja: data keluarga, hitungan, resep, tips, atau minta saya mencatat sesuatu. Ketik "bantuan" untuk melihat semua fitur.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Gulir otomatis ke pesan terbaru (hanya di dalam kotak chat)
  useEffect(() => {
    const box = chatRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [messages, isTyping, pending]);

  function say(text: string) {
    setMessages((current) => [
      ...current,
      { id: Date.now() + Math.floor(Math.random() * 1000), role: "assistant", text },
    ]);
  }

  async function confirmPending() {
    if (!pending) return;
    const action = pending;
    setPending(null);
    switch (action.kind) {
      case "shopping":
        await shopping.add(action.values);
        break;
      case "task":
        await tasks.add(action.values);
        break;
      case "transaction":
        await transactions.add(action.values);
        break;
      case "event":
        await events.add(action.values);
        break;
    }
    say(`✅ Tersimpan. ${action.label}`);
  }

  function cancelPending() {
    setPending(null);
    say("Oke, tidak jadi disimpan.");
  }

  async function sendMessage(text: string) {
    const question = text.trim();
    if (question === "" || isTyping || today === "") return;

    const userMessage: Message = { id: Date.now(), role: "user", text: question };
    const history = [...messages, userMessage];
    setMessages(history);
    setInput("");
    setPending(null);

    // Perintah menambah data: minta konfirmasi dulu, jangan langsung simpan
    const action = parseAction(question, user);
    if (action) {
      if ("error" in action) {
        say(action.error);
      } else {
        setPending(action);
        say("Saya siap mencatat ini. Cek dulu, lalu tekan Simpan kalau sudah benar:");
      }
      return;
    }

    const snapshot = {
      today,
      user,
      events: events.rows,
      tasks: tasks.rows,
      items: shopping.rows,
      transactions: transactions.rows,
      checkIns: checkIns.rows,
      logins,
    };

    // Hitungan pasti (kalkulator, konversi, patungan, jam) dijawab lokal
    let reply = deterministicReply(question) ?? "";

    if (!reply) {
      setIsTyping(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, text: m.text })),
            context: buildContext(snapshot),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          reply = data.reply;
        }
      } catch {
        // abaikan, nanti pakai jawaban lokal
      }
    }

    // Kalau OpenAI belum diatur / gagal, pakai jawaban lokal (mode demo)
    if (!reply) reply = localReply(question, snapshot);

    say(reply);
    setIsTyping(false);
  }

  const latest = logins[0];
  const recent = logins.slice(0, 5);

  return (
    <div>
      <h1 className="text-3xl font-semibold">Asisten AI</h1>
      <p className="mt-1 text-stone-500">Tanya apa saja, atau minta saya mencatat sesuatu</p>

      {/* Highlight riwayat login */}
      <section className="mt-5 rounded-3xl border border-green-200 bg-green-50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold text-green-800">🔐 Riwayat login</p>
          <span className="rounded-full bg-white px-3 py-1 text-xs text-green-700">
            Kamu masuk sebagai {user}
          </span>
        </div>
        {latest ? (
          <>
            <p className="mt-2 text-sm text-green-900">
              Login terakhir: <b>{latest.name}</b> · {timeAgo(latest.logged_at)}
            </p>
            <ul className="mt-3 space-y-1.5">
              {recent.map((l, i) => (
                <li
                  key={l.id}
                  className={
                    "flex items-center gap-3 rounded-xl px-3 py-1.5 text-sm " +
                    (i === 0 ? "bg-white shadow-sm ring-1 ring-green-300" : "text-stone-600")
                  }
                >
                  <span className={`rounded-full px-2.5 py-0.5 text-xs ${memberColor(l.name)}`}>
                    {l.name}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{formatDateTime(l.logged_at)}</span>
                  <span className="shrink-0 text-xs text-stone-400">{timeAgo(l.logged_at)}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-2 text-sm text-green-900">Belum ada riwayat login.</p>
        )}
      </section>

      {/* Area percakapan */}
      <div
        ref={chatRef}
        className="mt-5 h-[26rem] space-y-3 overflow-y-auto rounded-3xl border border-stone-100 bg-white p-5 shadow-sm"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <p
              className={
                "max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2 " +
                (message.role === "user"
                  ? "bg-green-600 text-white"
                  : "bg-stone-100 text-stone-800")
              }
            >
              {message.text}
            </p>
          </div>
        ))}

        {/* Konfirmasi sebelum menyimpan */}
        {pending && (
          <div className="rounded-2xl border border-green-300 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-900">{pending.label}</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={confirmPending}
                className="rounded-xl bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700"
              >
                Simpan
              </button>
              <button
                onClick={cancelPending}
                className="rounded-xl border border-stone-300 bg-white px-4 py-1.5 text-sm text-stone-600 hover:bg-stone-50"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {isTyping && (
          <div className="flex justify-start">
            <p className="rounded-2xl bg-stone-100 px-4 py-2 text-stone-400">
              Sedang mengetik...
            </p>
          </div>
        )}
      </div>

      {/* Kolom input */}
      <div className="mt-4 flex gap-3 rounded-3xl border border-stone-100 bg-white p-4 shadow-sm">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          placeholder="Tulis pertanyaan atau perintah..."
          className="min-w-0 flex-1 rounded-xl border border-stone-200 px-4 py-2 outline-none focus:border-green-500"
        />
        <button
          onClick={() => sendMessage(input)}
          className="rounded-xl bg-green-600 px-5 py-2 font-medium text-white hover:bg-green-700"
        >
          Kirim
        </button>
      </div>

      {/* Saran pertanyaan */}
      <div className="mt-5 space-y-3">
        {chipGroups.map((group) => (
          <div key={group.title}>
            <p className="text-xs font-medium text-stone-500">{group.title}</p>
            <div className="mt-1.5 flex gap-2 overflow-x-auto pb-1">
              {group.chips.map((chip) => (
                <button
                  key={chip.text}
                  onClick={() => (chip.send ? sendMessage(chip.text) : setInput(chip.text))}
                  className="shrink-0 whitespace-nowrap rounded-full border border-green-600 bg-white px-4 py-1 text-sm text-green-700 hover:bg-green-50"
                >
                  {chip.text}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-stone-400">
        Tanpa OPENAI_API_KEY, asisten memakai kemampuan bawaan (data keluarga, kalkulator, ide, tips).
        Dengan OPENAI_API_KEY, kamu bisa bertanya apa saja secara bebas.
      </p>
    </div>
  );
}
