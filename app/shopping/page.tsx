"use client";

import { useState } from "react";
import { useShopping } from "@/lib/data";

export default function ShoppingPage() {
  const { rows: items, loading, error, add, update, remove, removeMany } = useShopping();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");

  async function handleAdd() {
    if (name.trim() === "") return;
    await add({ name: name.trim(), quantity: quantity.trim(), bought: false });
    setName("");
    setQuantity("");
  }

  const boughtItems = items.filter((i) => i.bought);
  // Barang yang belum dibeli tampil di atas
  const sorted = [...items].sort((a, b) => Number(a.bought) - Number(b.bought));

  return (
    <div>
      <h1 className="text-3xl font-semibold">Daftar Belanja</h1>
      <p className="mt-1 text-stone-500">
        {boughtItems.length} dari {items.length} barang sudah dibeli
      </p>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}

      {/* Form tambah barang */}
      <div className="mt-6 rounded-3xl border border-stone-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Nama barang..."
            className="flex-1 rounded-xl border border-stone-200 px-4 py-2 outline-none focus:border-green-500"
          />
          <input
            type="text"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Jumlah"
            className="rounded-xl border border-stone-200 px-4 py-2 outline-none focus:border-green-500 sm:w-32"
          />
          <button
            onClick={handleAdd}
            className="rounded-xl bg-green-600 px-5 py-2 font-medium text-white hover:bg-green-700"
          >
            Tambah
          </button>
        </div>
      </div>

      {/* Daftar barang */}
      <div className="mt-6 space-y-3">
        {loading && (
          <p className="rounded-3xl bg-white p-5 text-center text-stone-400 shadow-sm">
            Memuat daftar belanja...
          </p>
        )}
        {!loading && items.length === 0 && (
          <p className="rounded-3xl bg-white p-5 text-center text-stone-400 shadow-sm">
            Daftar belanja kosong. Tambahkan barang pertama!
          </p>
        )}

        {sorted.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm"
          >
            <input
              type="checkbox"
              checked={item.bought}
              onChange={() => update(item.id, { bought: !item.bought })}
              className="h-5 w-5 accent-green-600"
            />
            <div className="min-w-0 flex-1">
              <p className={item.bought ? "text-stone-400 line-through" : "text-stone-800"}>
                {item.name}
              </p>
              {item.quantity && <p className="text-sm text-stone-500">{item.quantity}</p>}
            </div>
            <button
              onClick={() => remove(item.id)}
              className="text-sm text-stone-400 hover:text-red-500"
            >
              Hapus
            </button>
          </div>
        ))}
      </div>

      {boughtItems.length > 0 && (
        <button
          onClick={() => removeMany(boughtItems.map((i) => i.id))}
          className="mt-6 w-full rounded-xl border border-green-600 py-2 font-medium text-green-700 hover:bg-green-50"
        >
          Hapus semua yang sudah dibeli
        </button>
      )}
    </div>
  );
}
