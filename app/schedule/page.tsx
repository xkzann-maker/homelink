"use client";

import { useState } from "react";
import { eventMembers, memberColor, sortEvents, useEvents } from "@/lib/data";
import { addDays, relativeLabel } from "@/lib/date";
import { useToday } from "@/lib/useToday";

export default function SchedulePage() {
  const today = useToday();
  const { rows, loading, error, add, remove } = useEvents();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(addDays(0));
  const [time, setTime] = useState("09:00");
  const [member, setMember] = useState(eventMembers[0]);

  async function handleAdd() {
    if (title.trim() === "" || date === "" || time === "") return;
    await add({ title: title.trim(), date, time, member });
    setTitle("");
  }

  const sorted = sortEvents(rows);

  // Kelompokkan jadwal per tanggal
  const groups: { date: string; events: typeof sorted }[] = [];
  sorted.forEach((event) => {
    const last = groups[groups.length - 1];
    if (last && last.date === event.date) last.events.push(event);
    else groups.push({ date: event.date, events: [event] });
  });

  return (
    <div>
      <h1 className="text-3xl font-semibold">Jadwal Keluarga</h1>
      <p className="mt-1 text-stone-500">Semua kegiatan keluarga dalam satu tempat</p>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}

      {/* Form tambah jadwal */}
      <div className="mt-6 rounded-3xl border border-stone-100 bg-white p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Nama kegiatan..."
            className="rounded-xl border border-stone-200 px-4 py-2 outline-none focus:border-green-500 sm:col-span-2"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-stone-200 px-4 py-2 outline-none focus:border-green-500"
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="rounded-xl border border-stone-200 px-4 py-2 outline-none focus:border-green-500"
          />
          <select
            value={member}
            onChange={(e) => setMember(e.target.value)}
            className="rounded-xl border border-stone-200 px-3 py-2 outline-none focus:border-green-500"
          >
            {eventMembers.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            className="rounded-xl bg-green-600 px-5 py-2 font-medium text-white hover:bg-green-700"
          >
            Tambah Jadwal
          </button>
        </div>
      </div>

      {/* Daftar jadwal */}
      <div className="mt-6 space-y-6">
        {loading && (
          <p className="rounded-3xl bg-white p-5 text-center text-stone-400 shadow-sm">
            Memuat jadwal...
          </p>
        )}
        {!loading && groups.length === 0 && (
          <p className="rounded-3xl bg-white p-5 text-center text-stone-400 shadow-sm">
            Belum ada jadwal. Tambahkan yang pertama!
          </p>
        )}

        {groups.map((group) => {
          const past = today !== "" && group.date < today;
          return (
            <section key={group.date} className={past ? "opacity-50" : ""}>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
                {today ? relativeLabel(group.date, today) : group.date}
                {past && " · sudah lewat"}
              </h2>
              <div className="space-y-2">
                {group.events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm"
                  >
                    <div className="w-14 shrink-0 text-sm font-semibold text-green-700">
                      {event.time}
                    </div>
                    <p className="min-w-0 flex-1 text-stone-800">{event.title}</p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs ${memberColor(event.member)}`}
                    >
                      {event.member}
                    </span>
                    <button
                      onClick={() => remove(event.id)}
                      className="text-sm text-stone-400 hover:text-red-500"
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
