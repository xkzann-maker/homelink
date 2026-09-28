"use client";

import { useState } from "react";
import { memberColor, members, useTasks } from "@/lib/data";

export default function TasksPage() {
  const { rows: tasks, loading, error, add, update, remove } = useTasks();
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState(members[0]);

  async function handleAdd() {
    if (title.trim() === "") return;
    await add({ title: title.trim(), assignee, done: false });
    setTitle("");
  }

  const doneCount = tasks.filter((t) => t.done).length;
  const percent = tasks.length === 0 ? 0 : Math.round((doneCount / tasks.length) * 100);
  // Tugas yang belum selesai tampil di atas
  const sorted = [...tasks].sort((a, b) => Number(a.done) - Number(b.done));

  return (
    <div>
      <h1 className="text-3xl font-semibold">Tugas Rumah</h1>
      <p className="mt-1 text-stone-500">
        {doneCount} dari {tasks.length} tugas selesai
      </p>

      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-stone-200">
        <div
          className="h-full rounded-full bg-green-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}

      {/* Form tambah tugas */}
      <div className="mt-6 rounded-3xl border border-stone-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Tugas baru..."
            className="flex-1 rounded-xl border border-stone-200 px-4 py-2 outline-none focus:border-green-500"
          />
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="rounded-xl border border-stone-200 px-3 py-2 outline-none focus:border-green-500"
          >
            {members.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            className="rounded-xl bg-green-600 px-5 py-2 font-medium text-white hover:bg-green-700"
          >
            Tambah
          </button>
        </div>
      </div>

      {/* Daftar tugas */}
      <div className="mt-6 space-y-3">
        {loading && (
          <p className="rounded-3xl bg-white p-5 text-center text-stone-400 shadow-sm">
            Memuat tugas...
          </p>
        )}
        {!loading && tasks.length === 0 && (
          <p className="rounded-3xl bg-white p-5 text-center text-stone-400 shadow-sm">
            Belum ada tugas. Tambahkan yang pertama!
          </p>
        )}

        {sorted.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-4 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm"
          >
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => update(task.id, { done: !task.done })}
              className="h-5 w-5 accent-green-600"
            />
            <p
              className={
                "min-w-0 flex-1 " +
                (task.done ? "text-stone-400 line-through" : "text-stone-800")
              }
            >
              {task.title}
            </p>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs ${memberColor(task.assignee)}`}
            >
              {task.assignee}
            </span>
            <button
              onClick={() => remove(task.id)}
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
