"use client";

import { useState } from "react";
import { memberColor, members, moodOf, moods, useCheckIns } from "@/lib/data";
import { addDays, formatDate } from "@/lib/date";
import { useToday } from "@/lib/useToday";

export default function CheckInPage() {
  const today = useToday();
  const { rows, loading, error, add, update } = useCheckIns();

  const [member, setMember] = useState(members[0]);
  const [mood, setMood] = useState(4);
  const [note, setNote] = useState("");

  const todayRows = rows.filter((r) => r.date === today);
  const mine = todayRows.find((r) => r.member === member);
  const checkedCount = members.filter((m) => todayRows.some((r) => r.member === m)).length;
  const needCare = todayRows.filter((r) => r.mood <= 2);

  // Satu check-in per anggota per hari: kalau sudah ada, diperbarui
  async function handleSubmit() {
    if (today === "") return;
    if (mine) {
      await update(mine.id, { mood, note: note.trim() });
    } else {
      await add({ member, mood, note: note.trim(), date: today });
    }
    setNote("");
  }

  // 7 hari terakhir, dari yang terbaru
  const days = Array.from({ length: 7 }, (_, i) => addDays(-i)).filter(
    () => today !== ""
  );

  return (
    <div>
      <h1 className="text-3xl font-semibold">Check-in Keluarga</h1>
      <p className="mt-1 text-stone-500">
        {checkedCount} dari {members.length} anggota sudah check-in hari ini
      </p>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}

      {needCare.length > 0 && (
        <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          💛 {needCare.map((r) => r.member).join(", ")} sedang kurang baik hari ini.
          Coba sapa dan tanyakan kabarnya.
        </p>
      )}

      {/* Form check-in */}
      <div className="mt-6 rounded-3xl border border-stone-100 bg-white p-5 shadow-sm">
        <p className="font-medium">Bagaimana kabarmu hari ini?</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {members.map((m) => (
            <button
              key={m}
              onClick={() => setMember(m)}
              className={
                "rounded-full px-4 py-1.5 text-sm " +
                (member === m
                  ? "bg-green-600 font-medium text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200")
              }
            >
              {m}
            </button>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          {moods.map((m) => (
            <button
              key={m.value}
              onClick={() => setMood(m.value)}
              title={m.label}
              className={
                "flex flex-1 flex-col items-center rounded-2xl border py-2 " +
                (mood === m.value
                  ? "border-green-500 bg-green-50"
                  : "border-stone-200 hover:bg-stone-50")
              }
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="mt-0.5 text-[11px] text-stone-500">{m.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Cerita singkat (opsional)..."
            className="flex-1 rounded-xl border border-stone-200 px-4 py-2 outline-none focus:border-green-500"
          />
          <button
            onClick={handleSubmit}
            className="rounded-xl bg-green-600 px-5 py-2 font-medium text-white hover:bg-green-700"
          >
            {mine ? "Perbarui check-in" : "Check-in"}
          </button>
        </div>
        {mine && (
          <p className="mt-2 text-xs text-stone-400">
            {member} sudah check-in hari ini. Kirim lagi untuk mengubahnya.
          </p>
        )}
      </div>

      {/* Status hari ini */}
      <h2 className="mt-8 text-lg font-semibold">Hari ini</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {loading && (
          <p className="rounded-3xl bg-white p-5 text-center text-stone-400 shadow-sm sm:col-span-2">
            Memuat check-in...
          </p>
        )}
        {!loading &&
          members.map((m) => {
            const row = todayRows.find((r) => r.member === m);
            return (
              <div
                key={m}
                className="flex items-center gap-4 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm"
              >
                <span className="text-3xl">{row ? moodOf(row.mood).emoji : "⏳"}</span>
                <div className="min-w-0 flex-1">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs ${memberColor(m)}`}>
                    {m}
                  </span>
                  <p className="mt-1 truncate text-sm text-stone-700">
                    {row
                      ? row.note || moodOf(row.mood).label
                      : "Belum check-in"}
                  </p>
                </div>
              </div>
            );
          })}
      </div>

      {/* Riwayat 7 hari */}
      <h2 className="mt-8 text-lg font-semibold">7 hari terakhir</h2>
      <div className="mt-3 space-y-2">
        {days.map((day) => (
          <div
            key={day}
            className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-white px-4 py-3 shadow-sm"
          >
            <p className="w-40 shrink-0 text-sm text-stone-500">{formatDate(day)}</p>
            <div className="flex flex-1 flex-wrap gap-3">
              {members.map((m) => {
                const row = rows.find((r) => r.date === day && r.member === m);
                return (
                  <span key={m} className="text-sm text-stone-600">
                    <span className="mr-1 text-xs text-stone-400">{m}</span>
                    {row ? moodOf(row.mood).emoji : "–"}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
