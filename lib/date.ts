export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(parseISO(iso));
}

export function formatFullDate(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parseISO(iso));
}

// "Hari ini", "Besok", atau nama hari lengkap
export function relativeLabel(iso: string, today: string): string {
  if (iso === today) return "Hari ini";
  if (iso === addDays(1)) return "Besok";
  return formatDate(iso);
}

// "28 September 2026 14.05" (zona waktu WIB)
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

// "baru saja", "5 menit lalu", "2 jam lalu", "3 hari lalu"
export function timeAgo(iso: string, nowMs: number = Date.now()): string {
  const diff = Math.max(0, nowMs - new Date(iso).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}
