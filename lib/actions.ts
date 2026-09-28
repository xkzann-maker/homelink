// Perintah cepat lewat chat ("tambah belanja susu 2 liter", "catat pengeluaran 50rb bensin").
// Perintah TIDAK langsung disimpan: asisten menampilkan konfirmasi dulu.
import { expenseCategories, incomeCategories, members } from "./data";
import type { FamilyEvent, ShoppingItem, Task, Transaction } from "./data";
import { addDays, todayISO } from "./date";
import { parseAmount } from "./skills";

export type PendingAction =
  | { kind: "shopping"; label: string; values: Omit<ShoppingItem, "id"> }
  | { kind: "task"; label: string; values: Omit<Task, "id"> }
  | { kind: "transaction"; label: string; values: Omit<Transaction, "id"> }
  | { kind: "event"; label: string; values: Omit<FamilyEvent, "id"> };

export type ActionResult = PendingAction | { error: string } | null;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const matchMember = (text: string) =>
  members.find((m) => m.toLowerCase() === text.trim().toLowerCase()) ?? null;

function guessCategory(text: string, type: "income" | "expense"): string {
  const t = text.toLowerCase();
  if (type === "income") {
    if (/gaji/.test(t)) return "Gaji";
    if (/usaha|jual|dagang/.test(t)) return "Usaha";
    if (/saku/.test(t)) return "Uang saku";
    return "Lainnya";
  }
  if (/makan|beras|sayur|lauk|jajan|minum|kopi|telur|daging|ikan/.test(t)) return "Makanan";
  if (/listrik|air|wifi|internet|pulsa|token|cicilan|pajak|sewa|kontrak/.test(t)) return "Tagihan";
  if (/bensin|ojek|parkir|tol|angkot|bus|kereta|grab|gojek/.test(t)) return "Transport";
  if (/sekolah|buku|les|spp|kursus|alat tulis/.test(t)) return "Pendidikan";
  if (/obat|dokter|klinik|vitamin|rumah sakit/.test(t)) return "Kesehatan";
  if (/nonton|bioskop|game|main|wisata|liburan/.test(t)) return "Hiburan";
  if (/sabun|deterjen|belanja|sembako|perabot|galon/.test(t)) return "Belanja rumah";
  return "Lainnya";
}

export function parseAction(text: string, user: string): ActionResult {
  const q = text.trim().replace(/\s+/g, " ").replace(/^(tolong|bisa|coba)\s+/i, "");
  const me = matchMember(user) ?? members[0];
  let m: RegExpMatchArray | null;

  // Belanja: "tambah belanja susu 2 liter"
  m = q.match(/^(?:tambah(?:kan)?|masukkan|catat)\s+(?:ke\s+)?(?:daftar\s+)?belanja(?:an)?\s+(.+)$/i);
  if (m) {
    const rest = m[1];
    const mm = rest.match(/^(.+?)\s+(\d.*)$/);
    const name = cap((mm ? mm[1] : rest).trim());
    const quantity = mm ? mm[2].trim() : "";
    return {
      kind: "shopping",
      label: `Tambah ke daftar belanja: ${name}${quantity ? ` (${quantity})` : ""}`,
      values: { name, quantity, bought: false },
    };
  }

  // Tugas: "tambah tugas cuci mobil untuk Ayah"
  m = q.match(/^(?:tambah(?:kan)?|buat|catat)\s+tugas\s+(.+)$/i);
  if (m) {
    let title = m[1];
    let assignee = me;
    const who = title.match(/^(.*?)\s+untuk\s+(\S+)$/i);
    if (who && matchMember(who[2])) {
      title = who[1];
      assignee = matchMember(who[2])!;
    }
    title = cap(title.trim());
    return {
      kind: "task",
      label: `Tambah tugas: ${title} (untuk ${assignee})`,
      values: { title, assignee, done: false },
    };
  }

  // Keuangan: "catat pengeluaran 50rb beli bensin" / "catat pemasukan gaji 8jt"
  m = q.match(/^(?:catat|tambah(?:kan)?)\s+(pengeluaran|pemasukan)\s+(.+)$/i);
  if (m) {
    const type = m[1].toLowerCase() === "pemasukan" ? "income" : "expense";
    let rest = m[2];
    const amountMatch = rest.match(/(\d[\d.,]*\s*(?:rb|ribu|jt|juta|k)?)(?![a-z])/i);
    const amount = amountMatch ? parseAmount(amountMatch[1]) : null;
    if (!amountMatch || !amount || amount <= 0) {
      return { error: `Berapa jumlahnya? Contoh: "catat ${m[1].toLowerCase()} 50rb ${type === "income" ? "uang saku" : "beli bensin"}".` };
    }
    rest = rest.replace(amountMatch[0], " ");
    let date = todayISO();
    if (/\bkemarin\b/i.test(rest)) {
      date = addDays(-1);
      rest = rest.replace(/\bkemarin\b/i, " ");
    }
    const title = cap(rest.replace(/\s+/g, " ").trim() || (type === "income" ? "Pemasukan" : "Pengeluaran"));
    const category = guessCategory(title, type);
    const list = type === "income" ? incomeCategories : expenseCategories;
    return {
      kind: "transaction",
      label: `Catat ${type === "income" ? "pemasukan" : "pengeluaran"}: ${title}, Rp ${amount.toLocaleString("id-ID")} (${list.includes(category) ? category : "Lainnya"})`,
      values: { title, amount, type, category: list.includes(category) ? category : "Lainnya", date, member: me },
    };
  }

  // Jadwal: "tambah jadwal les piano besok jam 16.00 untuk Kakak"
  m = q.match(/^(?:tambah(?:kan)?|buat)\s+(?:jadwal|acara)\s+(.+)$/i);
  if (m) {
    let rest = m[1];
    let date = todayISO();
    if (/\blusa\b/i.test(rest)) { date = addDays(2); rest = rest.replace(/\blusa\b/i, " "); }
    else if (/\bbesok\b/i.test(rest)) { date = addDays(1); rest = rest.replace(/\bbesok\b/i, " "); }
    else if (/\bhari ini\b/i.test(rest)) { rest = rest.replace(/\bhari ini\b/i, " "); }

    let time = "09:00";
    const t = rest.match(/(?:jam|pukul)\s*(\d{1,2})(?:[.:](\d{2}))?/i);
    if (t) {
      const h = Math.min(23, Number(t[1]));
      time = `${String(h).padStart(2, "0")}:${t[2] ?? "00"}`;
      rest = rest.replace(t[0], " ");
    }

    let member = "Semua";
    const who = rest.match(/\buntuk\s+(\S+)\s*$/i);
    if (who) {
      const found = matchMember(who[1]) ?? (/^semua$/i.test(who[1]) ? "Semua" : null);
      if (found) {
        member = found;
        rest = rest.replace(who[0], " ");
      }
    }
    const title = cap(rest.replace(/\s+/g, " ").trim());
    if (!title) return { error: 'Jadwal apa? Contoh: "tambah jadwal les piano besok jam 16.00 untuk Kakak".' };
    return {
      kind: "event",
      label: `Tambah jadwal: ${title}, ${date} pukul ${time} (${member})`,
      values: { title, date, time, member },
    };
  }

  return null;
}
