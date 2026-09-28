"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";

type Row = { id: number };

// Hook pengelola data satu tabel.
// - Kalau Supabase sudah diatur di .env.local -> data disimpan di Supabase.
// - Kalau belum -> data disimpan di browser (localStorage) dengan data contoh.
export function useTable<T extends Row>(
  table: string,
  makeSeed: () => Omit<T, "id">[]
) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const storageKey = `homelink:v2:${table}`;
  const mode: "supabase" | "local" = supabase ? "supabase" : "local";

  // 1. Muat data saat halaman dibuka
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (supabase) {
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .order("created_at", { ascending: false });
        if (cancelled) return;
        if (error) {
          setError("Gagal memuat data dari Supabase. Cek .env.local dan tabelnya.");
        } else {
          setRows(data as T[]);
        }
      } else {
        let list: T[] = [];
        try {
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            list = JSON.parse(saved) as T[];
          } else {
            list = makeSeed().map(
              (row, i) => ({ ...row, id: Date.now() + i }) as unknown as T
            );
          }
        } catch {
          list = [];
        }
        if (cancelled) return;
        setRows(list);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [table, storageKey, makeSeed]);

  // 2. Mode lokal: simpan ke browser setiap ada perubahan
  useEffect(() => {
    // Jangan menyimpan sebelum data selesai dimuat, kalau tidak
    // data lama akan tertimpa daftar kosong.
    if (supabase || loading) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(rows));
    } catch {
      // abaikan kalau penyimpanan browser penuh / diblokir
    }
  }, [rows, loading, storageKey]);

  const add = useCallback(
    async (values: Omit<T, "id">) => {
      setError("");
      if (supabase) {
        const { data, error } = await supabase
          .from(table)
          .insert(values as never)
          .select()
          .single();
        if (error) {
          setError("Gagal menambah data.");
          return;
        }
        setRows((current) => [data as T, ...current]);
      } else {
        const row = {
          ...values,
          id: Date.now() + Math.floor(Math.random() * 1000),
        } as unknown as T;
        setRows((current) => [row, ...current]);
      }
    },
    [table]
  );

  const update = useCallback(
    async (id: number, patch: Partial<Omit<T, "id">>) => {
      setError("");
      if (supabase) {
        const { error } = await supabase.from(table).update(patch as never).eq("id", id);
        if (error) {
          setError("Gagal mengubah data.");
          return;
        }
      }
      setRows((current) =>
        current.map((row) => (row.id === id ? { ...row, ...patch } : row))
      );
    },
    [table]
  );

  const removeMany = useCallback(
    async (ids: number[]) => {
      if (ids.length === 0) return;
      setError("");
      if (supabase) {
        const { error } = await supabase.from(table).delete().in("id", ids);
        if (error) {
          setError("Gagal menghapus data.");
          return;
        }
      }
      setRows((current) => current.filter((row) => !ids.includes(row.id)));
    },
    [table]
  );

  const remove = useCallback(
    (id: number) => removeMany([id]),
    [removeMany]
  );

  return { rows, loading, error, mode, add, update, remove, removeMany };
}
