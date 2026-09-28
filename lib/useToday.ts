"use client";

import { useEffect, useState } from "react";
import { todayISO } from "./date";

// Tanggal hari ini (baru terisi setelah halaman tampil di browser,
// supaya tidak bentrok dengan tampilan dari server).
export function useToday(): string {
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(todayISO());
  }, []);

  return today;
}
