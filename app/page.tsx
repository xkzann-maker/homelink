"use client";

import Link from "next/link";
import {
  formatRupiah,
  memberColor,
  members,
  monthTotals,
  moodOf,
  sortEvents,
  useCheckIns,
  useEvents,
  useShopping,
  useTasks,
  useTransactions,
} from "@/lib/data";
import { formatFullDate, relativeLabel } from "@/lib/date";
import { useToday } from "@/lib/useToday";

export default function DashboardPage() {
  const today = useToday();
  const events = useEvents();
  const tasks = useTasks();
  const shopping = useShopping();
  const transactions = useTransactions();
  const checkIns = useCheckIns();

  const ready =
    today !== "" &&
    !events.loading &&
    !tasks.loading &&
    !shopping.loading &&
    !transactions.loading &&
    !checkIns.loading;

  const totals = monthTotals(transactions.rows, today.slice(0, 7));
  const todayCheckIns = checkIns.rows.filter((c) => c.date === today);

  const upcoming = ready
    ? sortEvents(events.rows.filter((e) => e.date >= today))
    : [];
  const todayCount = upcoming.filter((e) => e.date === today).length;
  const openTasks = tasks.rows.filter((t) => !t.done);
  const toBuy = shopping.rows.filter((i) => !i.bought);

  const stats = [
    { label: "Acara hari ini", value: todayCount, icon: "📅", href: "/schedule" },
    { label: "Tugas belum selesai", value: openTasks.length, icon: "✅", href: "/tasks" },
    { label: "Perlu dibeli", value: toBuy.length, icon: "🛒", href: "/shopping" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-stone-800">
            Selamat datang di HomeLink 👋
          </h1>
          <p className="mt-1 text-stone-500">
            {today ? formatFullDate(today) : "\u00A0"}
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs text-stone-500 shadow-sm">
          Data: {events.mode === "supabase" ? "Supabase" : "Browser (mode demo)"}
        </span>
      </div>

      {/* Kartu ringkasan */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-3xl border border-stone-100 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="text-2xl">{stat.icon}</div>
            <p className="mt-3 text-4xl font-semibold text-green-700">
              {ready ? stat.value : "–"}
            </p>
            <p className="mt-1 text-sm text-stone-500">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {/* Jadwal terdekat */}
        <section className="rounded-3xl border border-stone-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Jadwal terdekat</h2>
            <Link href="/schedule" className="text-sm text-green-700 hover:underline">
              Lihat semua
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {ready && upcoming.length === 0 && (
              <p className="text-sm text-stone-400">Belum ada jadwal.</p>
            )}
            {upcoming.slice(0, 4).map((event) => (
              <div key={event.id} className="flex items-center gap-3">
                <div className="w-16 shrink-0 text-sm font-medium text-green-700">
                  {event.time}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-stone-800">{event.title}</p>
                  <p className="text-xs text-stone-400">
                    {relativeLabel(event.date, today)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs ${memberColor(event.member)}`}
                >
                  {event.member}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Tugas */}
        <section className="rounded-3xl border border-stone-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Tugas rumah</h2>
            <Link href="/tasks" className="text-sm text-green-700 hover:underline">
              Lihat semua
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {ready && openTasks.length === 0 && (
              <p className="text-sm text-stone-400">
                Semua tugas selesai. Kerja bagus! 🎉
              </p>
            )}
            {openTasks.slice(0, 4).map((task) => (
              <div key={task.id} className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-green-500" />
                <p className="min-w-0 flex-1 truncate text-stone-800">{task.title}</p>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs ${memberColor(task.assignee)}`}
                >
                  {task.assignee}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {/* Keuangan bulan ini */}
        <section className="rounded-3xl border border-stone-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Keuangan bulan ini</h2>
            <Link href="/finance" className="text-sm text-green-700 hover:underline">
              Lihat semua
            </Link>
          </div>
          <p className="mt-4 text-3xl font-semibold text-stone-800">
            {ready ? formatRupiah(totals.balance) : "–"}
          </p>
          <p className="text-sm text-stone-400">Saldo (pemasukan − pengeluaran)</p>
          <div className="mt-4 flex justify-between text-sm">
            <span className="text-green-700">
              ⬇️ {ready ? formatRupiah(totals.income) : "–"}
            </span>
            <span className="text-rose-600">
              ⬆️ {ready ? formatRupiah(totals.expense) : "–"}
            </span>
          </div>
        </section>

        {/* Check-in hari ini */}
        <section className="rounded-3xl border border-stone-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Check-in hari ini</h2>
            <Link href="/checkin" className="text-sm text-green-700 hover:underline">
              Check-in
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {members.map((m) => {
              const row = todayCheckIns.find((c) => c.member === m);
              return (
                <div key={m} className="flex items-center gap-3">
                  <span className="w-8 text-center text-xl">
                    {ready && row ? moodOf(row.mood).emoji : "⏳"}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs ${memberColor(m)}`}
                  >
                    {m}
                  </span>
                  <p className="min-w-0 flex-1 truncate text-sm text-stone-500">
                    {ready && row ? row.note || moodOf(row.mood).label : "Belum check-in"}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Ajakan ke asisten */}
      <Link
        href="/assistant"
        className="mt-6 flex items-center gap-4 rounded-3xl bg-green-600 p-6 text-white shadow-sm transition hover:bg-green-700"
      >
        <span className="text-3xl">✨</span>
        <div>
          <p className="text-lg font-semibold">Tanya Asisten HomeLink</p>
          <p className="text-sm text-green-50">
            Minta ringkasan jadwal, tugas, belanja, keuangan, atau kabar keluarga kamu.
          </p>
        </div>
      </Link>
    </div>
  );
}
