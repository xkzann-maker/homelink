"use client";

import { useState } from "react";
import {
  expenseByCategory,
  expenseCategories,
  formatRupiah,
  incomeCategories,
  memberColor,
  members,
  monthTotals,
  sortTransactions,
  useTransactions,
  type TransactionType,
} from "@/lib/data";
import { formatDate, parseISO } from "@/lib/date";
import { useToday } from "@/lib/useToday";

export default function FinancePage() {
  const today = useToday();
  const { rows, loading, error, add, remove } = useTransactions();

  const [type, setType] = useState<TransactionType>("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(expenseCategories[0]);
  const [member, setMember] = useState(members[0]);
  const [date, setDate] = useState("");

  const categories = type === "expense" ? expenseCategories : incomeCategories;
  const month = today.slice(0, 7); // "YYYY-MM"
  const monthLabel = today
    ? new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(
        parseISO(today)
      )
    : "";

  function switchType(next: TransactionType) {
    setType(next);
    setCategory(next === "expense" ? expenseCategories[0] : incomeCategories[0]);
  }

  async function handleAdd() {
    const value = Math.round(Number(amount));
    if (title.trim() === "" || !value || value <= 0) return;
    await add({
      title: title.trim(),
      amount: value,
      type,
      category,
      member,
      date: date || today,
    });
    setTitle("");
    setAmount("");
  }

  const totals = monthTotals(rows, month);
  const byCategory = expenseByCategory(rows, month);
  const sorted = sortTransactions(rows);

  return (
    <div>
      <h1 className="text-3xl font-semibold">Catatan Keuangan</h1>
      <p className="mt-1 text-stone-500">
        Pemasukan dan pengeluaran keluarga{monthLabel ? ` · ${monthLabel}` : ""}
      </p>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}

      {/* Ringkasan bulan ini */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-stone-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">Pemasukan</p>
          <p className="mt-2 text-2xl font-semibold text-green-700">
            {formatRupiah(totals.income)}
          </p>
        </div>
        <div className="rounded-3xl border border-stone-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">Pengeluaran</p>
          <p className="mt-2 text-2xl font-semibold text-rose-600">
            {formatRupiah(totals.expense)}
          </p>
        </div>
        <div className="rounded-3xl border border-stone-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">Saldo bulan ini</p>
          <p
            className={
              "mt-2 text-2xl font-semibold " +
              (totals.balance >= 0 ? "text-stone-800" : "text-rose-600")
            }
          >
            {formatRupiah(totals.balance)}
          </p>
        </div>
      </div>

      {/* Form tambah catatan */}
      <div className="mt-6 rounded-3xl border border-stone-100 bg-white p-5 shadow-sm">
        <div className="flex gap-2">
          <button
            onClick={() => switchType("expense")}
            className={
              "rounded-full px-4 py-1.5 text-sm font-medium " +
              (type === "expense"
                ? "bg-rose-500 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200")
            }
          >
            Pengeluaran
          </button>
          <button
            onClick={() => switchType("income")}
            className={
              "rounded-full px-4 py-1.5 text-sm font-medium " +
              (type === "income"
                ? "bg-green-600 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200")
            }
          >
            Pemasukan
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Keterangan (mis. Beli beras)"
            className="rounded-xl border border-stone-200 px-4 py-2 outline-none focus:border-green-500"
          />
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Jumlah (Rp)"
            className="rounded-xl border border-stone-200 px-4 py-2 outline-none focus:border-green-500"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-stone-200 px-3 py-2 outline-none focus:border-green-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={member}
            onChange={(e) => setMember(e.target.value)}
            className="rounded-xl border border-stone-200 px-3 py-2 outline-none focus:border-green-500"
          >
            {members.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={date || today}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-stone-200 px-4 py-2 outline-none focus:border-green-500"
          />
          <button
            onClick={handleAdd}
            className="rounded-xl bg-green-600 px-5 py-2 font-medium text-white hover:bg-green-700"
          >
            Simpan catatan
          </button>
        </div>
      </div>

      {/* Pengeluaran per kategori */}
      {byCategory.length > 0 && (
        <section className="mt-6 rounded-3xl border border-stone-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Pengeluaran per kategori</h2>
          <div className="mt-4 space-y-3">
            {byCategory.map((row) => {
              const percent = totals.expense
                ? Math.round((row.total / totals.expense) * 100)
                : 0;
              return (
                <div key={row.category}>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-700">{row.category}</span>
                    <span className="text-stone-500">
                      {formatRupiah(row.total)} · {percent}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full bg-rose-400"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Riwayat */}
      <div className="mt-6 space-y-3">
        {loading && (
          <p className="rounded-3xl bg-white p-5 text-center text-stone-400 shadow-sm">
            Memuat catatan keuangan...
          </p>
        )}
        {!loading && rows.length === 0 && (
          <p className="rounded-3xl bg-white p-5 text-center text-stone-400 shadow-sm">
            Belum ada catatan. Tambahkan pemasukan atau pengeluaran pertama!
          </p>
        )}
        {sorted.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-4 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm"
          >
            <div
              className={
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg " +
                (t.type === "income" ? "bg-green-100" : "bg-rose-100")
              }
            >
              {t.type === "income" ? "⬇️" : "⬆️"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-stone-800">{t.title}</p>
              <p className="text-xs text-stone-400">
                {formatDate(t.date)} · {t.category}
              </p>
            </div>
            <span className={`hidden rounded-full px-2.5 py-0.5 text-xs sm:inline ${memberColor(t.member)}`}>
              {t.member}
            </span>
            <p
              className={
                "shrink-0 font-medium " +
                (t.type === "income" ? "text-green-700" : "text-rose-600")
              }
            >
              {t.type === "income" ? "+" : "−"}
              {formatRupiah(t.amount)}
            </p>
            <button
              onClick={() => remove(t.id)}
              className="text-sm text-stone-400 hover:text-red-500"
            >
              Hapus
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
