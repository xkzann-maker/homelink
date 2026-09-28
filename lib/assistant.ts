import type { CheckIn, FamilyEvent, LoginRecord, ShoppingItem, Task, Transaction } from "./data";
import {
  expenseByCategory,
  formatRupiah,
  members,
  monthTotals,
  moodOf,
  sortEvents,
} from "./data";
import { addDays, formatDate, formatDateTime, formatFullDate, parseISO, timeAgo } from "./date";
import { helpText, ideaReply, quickTools } from "./skills";

export type Snapshot = {
  today: string;
  user: string; // nama yang sedang login
  events: FamilyEvent[];
  tasks: Task[];
  items: ShoppingItem[];
  transactions: Transaction[];
  checkIns: CheckIn[];
  logins: LoginRecord[]; // terbaru di atas
};

// Ringkasan data keluarga dalam bentuk teks, dikirim ke OpenAI sebagai konteks
export function buildContext(s: Snapshot): string {
  const events = sortEvents(s.events.filter((e) => e.date >= s.today));
  const lines: string[] = [];

  lines.push(`Tanggal hari ini: ${formatFullDate(s.today)}`);
  lines.push(`Pengguna yang sedang bicara denganmu: ${s.user}`);

  lines.push("Jadwal keluarga (yang akan datang):");
  if (events.length === 0) lines.push("- (kosong)");
  events.forEach((e) =>
    lines.push(`- ${formatDate(e.date)} ${e.time}: ${e.title} (${e.member})`)
  );

  lines.push("Tugas rumah:");
  if (s.tasks.length === 0) lines.push("- (kosong)");
  s.tasks.forEach((t) =>
    lines.push(`- ${t.title} untuk ${t.assignee} [${t.done ? "selesai" : "belum"}]`)
  );

  lines.push("Daftar belanja:");
  if (s.items.length === 0) lines.push("- (kosong)");
  s.items.forEach((i) =>
    lines.push(
      `- ${i.name}${i.quantity ? ` (${i.quantity})` : ""} [${i.bought ? "sudah dibeli" : "belum dibeli"}]`
    )
  );

  const month = s.today.slice(0, 7);
  const totals = monthTotals(s.transactions, month);
  lines.push("Keuangan bulan ini:");
  lines.push(
    `- Pemasukan ${formatRupiah(totals.income)}, pengeluaran ${formatRupiah(totals.expense)}, saldo ${formatRupiah(totals.balance)}`
  );
  expenseByCategory(s.transactions, month).forEach((c) =>
    lines.push(`- Pengeluaran ${c.category}: ${formatRupiah(c.total)}`)
  );

  lines.push("Check-in keluarga hari ini:");
  members.forEach((m) => {
    const c = s.checkIns.find((x) => x.date === s.today && x.member === m);
    lines.push(
      c
        ? `- ${m}: ${moodOf(c.mood).label}${c.note ? ` ("${c.note}")` : ""}`
        : `- ${m}: belum check-in`
    );
  });

  lines.push("Riwayat login terakhir (terbaru di atas):");
  if (s.logins.length === 0) lines.push("- (kosong)");
  s.logins.slice(0, 8).forEach((l) => lines.push(`- ${l.name}, ${formatDateTime(l.logged_at)}`));

  return lines.join("\n");
}

function eventLine(e: FamilyEvent, withDate: boolean): string {
  return `• ${withDate ? formatDate(e.date) + ", " : ""}${e.time} - ${e.title} (${e.member})`;
}

// Jawaban pasti (kalkulator, konversi, patungan, jam): selalu dijawab lokal,
// karena hasilnya harus tepat dan tidak perlu OpenAI.
export function deterministicReply(question: string): string | null {
  return quickTools(question.toLowerCase().trim());
}

// Jawaban lokal (mode demo) yang dibuat dari data keluarga dan kemampuan bawaan.
// Dipakai kalau OPENAI_API_KEY belum diisi.
export function localReply(question: string, s: Snapshot): string {
  const q = question.toLowerCase().trim();
  const upcoming = sortEvents(s.events.filter((e) => e.date >= s.today));
  const todayEvents = upcoming.filter((e) => e.date === s.today);
  const tomorrow = addDays(1);
  const tomorrowEvents = upcoming.filter((e) => e.date === tomorrow);
  const openTasks = s.tasks.filter((t) => !t.done);
  const toBuy = s.items.filter((i) => !i.bought);

  const askSchedule = /jadwal|acara|agenda|kegiatan/.test(q);
  const askTasks = /tugas|piket|pekerjaan/.test(q);
  const askShopping = /belanja|beli|shopping/.test(q);
  const askFinance = /uang|keuangan|pengeluaran|pemasukan|saldo|biaya|duit/.test(q);
  const askCheckIn = /check.?in|suasana|perasaan|mood|kabar|senang|sedih/.test(q);
  const askLogin = /login|log in|siapa (saja |aja )?(yang )?(masuk|buka)|riwayat masuk/.test(q);

  // 1. Sapaan & bantuan
  if (
    /^(halo|hai|hi|hello|selamat)/.test(q) &&
    !askSchedule && !askTasks && !askShopping && !askFinance && !askCheckIn && !askLogin
  ) {
    return `Halo, ${s.user}! Saya asisten HomeLink. Ketik "bantuan" untuk melihat semua yang bisa saya lakukan.`;
  }
  if (/bantuan|bisa apa|fitur|^help/.test(q)) return helpText;

  // 2. Riwayat login
  if (askLogin) {
    if (s.logins.length === 0) return "Belum ada riwayat login.";
    const rows = s.logins
      .slice(0, 6)
      .map((l) => `• ${l.name} - ${formatDateTime(l.logged_at)} (${timeAgo(l.logged_at)})`);
    return `Login terakhir: ${s.logins[0].name}, ${timeAgo(s.logins[0].logged_at)}.\n\nRiwayat login:\n${rows.join("\n")}`;
  }

  // 3. Alat bantu pasti, ide, tips, hiburan
  const tool = quickTools(q);
  if (tool) return tool;
  const idea = ideaReply(q);
  if (idea) return idea;

  // 4. Pembagian tugas & hitung mundur acara
  if (/bagi(kan)?\s+tugas|adil|paling (banyak|sedikit) tugas|siapa.*(sibuk|banyak tugas)/.test(q)) {
    const counts = members.map((m) => ({
      m,
      n: openTasks.filter((t) => t.assignee === m).length,
    }));
    const least = [...counts].sort((a, b) => a.n - b.n)[0];
    return `Tugas yang belum selesai per orang:\n${counts.map((c) => `• ${c.m}: ${c.n}`).join("\n")}\n\nTugas baru sebaiknya diberikan ke ${least.m} (paling sedikit).`;
  }
  if (/berapa hari lagi|hitung mundur|acara (berikutnya|selanjutnya)|kapan acara/.test(q)) {
    const next = upcoming[0];
    if (!next) return "Belum ada jadwal yang akan datang.";
    const days = Math.round((parseISO(next.date).getTime() - parseISO(s.today).getTime()) / 86400000);
    return `Acara berikutnya: ${next.title} (${next.member}), ${days === 0 ? "hari ini" : days === 1 ? "besok" : `${days} hari lagi`} pukul ${next.time}.`;
  }

  // 5. Data keluarga
  if (askFinance) {
    const month = s.today.slice(0, 7);
    const totals = monthTotals(s.transactions, month);
    const cats = expenseByCategory(s.transactions, month);
    const parts = [
      "Keuangan bulan ini:",
      `• Pemasukan: ${formatRupiah(totals.income)}`,
      `• Pengeluaran: ${formatRupiah(totals.expense)}`,
      `• Saldo: ${formatRupiah(totals.balance)}`,
    ];
    if (cats.length) {
      parts.push("", "Pengeluaran terbesar:");
      cats.slice(0, 3).forEach((c) => parts.push(`• ${c.category}: ${formatRupiah(c.total)}`));
    }
    return parts.join("\n");
  }

  if (askCheckIn) {
    const today = s.checkIns.filter((c) => c.date === s.today);
    const waiting = members.filter((m) => !today.some((c) => c.member === m));
    const parts = [`Check-in hari ini (${today.length} dari ${members.length} anggota):`];
    today.forEach((c) =>
      parts.push(`• ${c.member}: ${moodOf(c.mood).emoji} ${moodOf(c.mood).label}${c.note ? ` - ${c.note}` : ""}`)
    );
    if (waiting.length) parts.push("", `Belum check-in: ${waiting.join(", ")}`);
    const low = today.filter((c) => c.mood <= 2).map((c) => c.member);
    if (low.length) parts.push("", `💛 ${low.join(", ")} sedang kurang baik. Coba sapa ya.`);
    return parts.join("\n");
  }

  if (askSchedule) {
    if (/besok/.test(q)) {
      return tomorrowEvents.length
        ? `Jadwal besok:\n${tomorrowEvents.map((e) => eventLine(e, false)).join("\n")}`
        : "Besok belum ada jadwal keluarga.";
    }
    if (/hari ini/.test(q)) {
      return todayEvents.length
        ? `Jadwal hari ini:\n${todayEvents.map((e) => eventLine(e, false)).join("\n")}`
        : "Hari ini belum ada jadwal keluarga.";
    }
    return upcoming.length
      ? `Jadwal terdekat:\n${upcoming.slice(0, 5).map((e) => eventLine(e, true)).join("\n")}`
      : "Belum ada jadwal yang akan datang.";
  }

  if (askTasks) {
    return openTasks.length
      ? `Ada ${openTasks.length} tugas yang belum selesai:\n${openTasks
          .map((t) => `• ${t.title} (${t.assignee})`)
          .join("\n")}`
      : "Semua tugas rumah sudah selesai. Kerja bagus, keluarga!";
  }

  if (askShopping) {
    return toBuy.length
      ? `Yang masih perlu dibeli (${toBuy.length} barang):\n${toBuy
          .map((i) => `• ${i.name}${i.quantity ? ` - ${i.quantity}` : ""}`)
          .join("\n")}`
      : "Daftar belanja sudah lengkap, tidak ada yang perlu dibeli.";
  }

  if (/ringkas|rangkum|rangkuman|hari ini/.test(q)) {
    const totals = monthTotals(s.transactions, s.today.slice(0, 7));
    const checked = members.filter((m) =>
      s.checkIns.some((c) => c.date === s.today && c.member === m)
    ).length;
    const parts = [
      `Ringkasan ${formatFullDate(s.today)}:`,
      `• ${todayEvents.length} acara hari ini`,
      `• ${openTasks.length} tugas belum selesai`,
      `• ${toBuy.length} barang perlu dibeli`,
      `• Saldo bulan ini ${formatRupiah(totals.balance)}`,
      `• ${checked} dari ${members.length} anggota sudah check-in`,
    ];
    if (s.logins[0]) parts.push(`• Login terakhir: ${s.logins[0].name}, ${timeAgo(s.logins[0].logged_at)}`);
    if (todayEvents.length) {
      parts.push("", "Acara hari ini:", ...todayEvents.map((e) => eventLine(e, false)));
    }
    return parts.join("\n");
  }

  return `Hmm, untuk pertanyaan itu saya butuh OpenAI (isi OPENAI_API_KEY) supaya bisa menjawab bebas. Sementara ini:\n\n${helpText}`;
}
