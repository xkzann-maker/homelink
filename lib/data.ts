"use client";

import { useTable } from "./useTable";
import { addDays, todayISO } from "./date";

export type Task = {
  id: number;
  title: string;
  assignee: string;
  done: boolean;
};

export type ShoppingItem = {
  id: number;
  name: string;
  quantity: string;
  bought: boolean;
};

export type FamilyEvent = {
  id: number;
  title: string;
  date: string; // format YYYY-MM-DD
  time: string; // format HH:MM
  member: string;
};

export const members = ["Ayah", "Ibu", "Kakak", "Adik"];
export const eventMembers = ["Semua", ...members];

// Warna label per anggota keluarga
export function memberColor(member: string): string {
  switch (member) {
    case "Ayah":
      return "bg-sky-100 text-sky-700";
    case "Ibu":
      return "bg-rose-100 text-rose-700";
    case "Kakak":
      return "bg-amber-100 text-amber-700";
    case "Adik":
      return "bg-violet-100 text-violet-700";
    default:
      return "bg-green-100 text-green-700";
  }
}

export function sortEvents(list: FamilyEvent[]): FamilyEvent[] {
  return [...list].sort((a, b) =>
    (a.date + a.time).localeCompare(b.date + b.time)
  );
}

// ----- Data contoh (dipakai di mode demo) -----

const taskSeed = (): Omit<Task, "id">[] => [
  { title: "Menyapu ruang tamu", assignee: "Kakak", done: false },
  { title: "Buang sampah", assignee: "Ayah", done: true },
  { title: "Menyiram tanaman", assignee: "Adik", done: false },
  { title: "Memasak makan malam", assignee: "Ibu", done: false },
];

const shoppingSeed = (): Omit<ShoppingItem, "id">[] => [
  { name: "Beras", quantity: "5 kg", bought: false },
  { name: "Telur", quantity: "1 kg", bought: false },
  { name: "Susu", quantity: "2 liter", bought: false },
  { name: "Sabun cuci piring", quantity: "2 botol", bought: true },
];

const eventSeed = (): Omit<FamilyEvent, "id">[] => [
  { title: "Antar Adik ke sekolah", date: todayISO(), time: "07:00", member: "Ayah" },
  { title: "Makan malam keluarga", date: todayISO(), time: "19:00", member: "Semua" },
  { title: "Les piano Kakak", date: addDays(1), time: "16:00", member: "Kakak" },
  { title: "Belanja bulanan", date: addDays(3), time: "09:00", member: "Ibu" },
  { title: "Arisan keluarga besar", date: addDays(5), time: "13:00", member: "Semua" },
];

export const useTasks = () => useTable<Task>("tasks", taskSeed);
export const useShopping = () =>
  useTable<ShoppingItem>("shopping_items", shoppingSeed);
export const useEvents = () => useTable<FamilyEvent>("events", eventSeed);

// ================= Catatan Keuangan =================

export type TransactionType = "income" | "expense";

export type Transaction = {
  id: number;
  title: string;
  amount: number; // dalam Rupiah, bilangan bulat
  type: TransactionType;
  category: string;
  date: string; // format YYYY-MM-DD
  member: string;
};

export const expenseCategories = [
  "Makanan",
  "Belanja rumah",
  "Tagihan",
  "Transport",
  "Pendidikan",
  "Kesehatan",
  "Hiburan",
  "Lainnya",
];
export const incomeCategories = ["Gaji", "Usaha", "Uang saku", "Lainnya"];

// 1500000 -> "Rp 1.500.000"
export function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

// Total pemasukan, pengeluaran, dan saldo untuk satu bulan (month = "YYYY-MM")
export function monthTotals(list: Transaction[], month: string) {
  let income = 0;
  let expense = 0;
  for (const t of list) {
    if (!t.date.startsWith(month)) continue;
    if (t.type === "income") income += t.amount;
    else expense += t.amount;
  }
  return { income, expense, balance: income - expense };
}

// Pengeluaran per kategori untuk satu bulan, dari yang terbesar
export function expenseByCategory(list: Transaction[], month: string) {
  const map = new Map<string, number>();
  for (const t of list) {
    if (t.type !== "expense" || !t.date.startsWith(month)) continue;
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  }
  return [...map.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export function sortTransactions(list: Transaction[]): Transaction[] {
  return [...list].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
}

const transactionSeed = (): Omit<Transaction, "id">[] => [
  { title: "Gaji bulanan", amount: 8000000, type: "income", category: "Gaji", date: addDays(-2), member: "Ayah" },
  { title: "Belanja sayur & lauk", amount: 250000, type: "expense", category: "Makanan", date: addDays(-1), member: "Ibu" },
  { title: "Listrik", amount: 450000, type: "expense", category: "Tagihan", date: addDays(-1), member: "Ayah" },
  { title: "Bensin", amount: 100000, type: "expense", category: "Transport", date: todayISO(), member: "Ayah" },
  { title: "Buku pelajaran Adik", amount: 180000, type: "expense", category: "Pendidikan", date: todayISO(), member: "Ibu" },
];

export const useTransactions = () =>
  useTable<Transaction>("transactions", transactionSeed);

// ================= Check-in Keluarga =================

export type CheckIn = {
  id: number;
  member: string;
  mood: number; // 1 (sangat buruk) sampai 5 (sangat baik)
  note: string;
  date: string; // format YYYY-MM-DD
};

export const moods = [
  { value: 1, emoji: "😢", label: "Sedih" },
  { value: 2, emoji: "😕", label: "Kurang baik" },
  { value: 3, emoji: "😐", label: "Biasa saja" },
  { value: 4, emoji: "🙂", label: "Baik" },
  { value: 5, emoji: "😄", label: "Senang" },
];

export function moodOf(value: number) {
  return moods.find((m) => m.value === value) ?? moods[2];
}

const checkInSeed = (): Omit<CheckIn, "id">[] => [
  { member: "Ibu", mood: 4, note: "Semangat masak untuk makan malam nanti", date: todayISO() },
  { member: "Kakak", mood: 3, note: "Agak capek, banyak tugas sekolah", date: todayISO() },
  { member: "Ayah", mood: 5, note: "Kerjaan lancar hari ini", date: addDays(-1) },
  { member: "Adik", mood: 4, note: "Senang main di sekolah", date: addDays(-1) },
  { member: "Ibu", mood: 4, note: "", date: addDays(-1) },
  { member: "Kakak", mood: 2, note: "Ada ulangan susah", date: addDays(-2) },
];

export const useCheckIns = () => useTable<CheckIn>("check_ins", checkInSeed);

// ================= Riwayat Login =================

export type LoginRecord = {
  id: number;
  name: string;
  logged_at: string; // waktu login, format ISO
};

const loginSeed = (): Omit<LoginRecord, "id">[] => [];

export const useLoginHistory = () =>
  useTable<LoginRecord>("login_history", loginSeed);
