"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

const links = [
  { href: "/", label: "Beranda", icon: "🏠" },
  { href: "/schedule", label: "Jadwal", icon: "📅" },
  { href: "/tasks", label: "Tugas", icon: "✅" },
  { href: "/shopping", label: "Belanja", icon: "🛒" },
  { href: "/finance", label: "Keuangan", icon: "💰" },
  { href: "/checkin", label: "Check-in", icon: "💬" },
  { href: "/assistant", label: "Asisten", icon: "✨" },
];

export default function Nav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-stone-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center gap-4 px-5 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600 text-lg text-white">
            🏡
          </span>
          <span className="text-lg font-semibold text-stone-800">HomeLink</span>
        </Link>

        <nav className="ml-auto flex gap-1 overflow-x-auto">
          {links.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  active
                    ? "whitespace-nowrap rounded-full bg-green-600 px-4 py-1.5 text-sm font-medium text-white"
                    : "whitespace-nowrap rounded-full px-4 py-1.5 text-sm text-stone-600 hover:bg-green-50 hover:text-green-700"
                }
              >
                <span className="mr-1">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={logout}
          title={`Keluar (${user})`}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-stone-200 px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-50"
        >
          <span className="hidden max-w-[6rem] truncate sm:inline">{user}</span>
          <span>🚪</span>
        </button>
      </div>
    </header>
  );
}
