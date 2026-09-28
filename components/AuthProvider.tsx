"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { members, useLoginHistory, type LoginRecord } from "@/lib/data";

type AuthContextValue = {
  user: string;
  logins: LoginRecord[]; // riwayat login (terbaru di atas)
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: "",
  logins: [],
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Membungkus seluruh aplikasi: sebelum login, hanya layar masuk yang tampil.
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"loading" | "out" | "in">("loading");
  const [user, setUser] = useState("");
  const history = useLoginHistory();

  // Cek sesi saat halaman dibuka (cookie dari login sebelumnya)
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.name) {
          setUser(data.name);
          setStatus("in");
        } else {
          setStatus("out");
        }
      })
      .catch(() => !cancelled && setStatus("out"));
    return () => {
      cancelled = true;
    };
  }, []);

  // Mengembalikan pesan error, atau "" kalau berhasil
  async function login(name: string, password: string): Promise<string> {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return data.error || "Gagal masuk. Coba lagi.";
      setUser(data.name);
      setStatus("in");
      // Catat riwayat login
      await history.add({ name: data.name, logged_at: new Date().toISOString() });
      return "";
    } catch {
      return "Tidak bisa menghubungi server.";
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser("");
    setStatus("out");
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-4xl">🏡</div>
    );
  }

  if (status === "out") {
    return <LoginScreen onLogin={login} />;
  }

  const logins = [...history.rows].sort((a, b) => b.logged_at.localeCompare(a.logged_at));

  return (
    <AuthContext.Provider value={{ user, logins, logout }}>{children}</AuthContext.Provider>
  );
}

function LoginScreen({
  onLogin,
}: {
  onLogin: (name: string, password: string) => Promise<string>;
}) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (name.trim() === "") return setError("Isi nama kamu dulu ya.");
    if (password === "") return setError("Isi kata sandi keluarga.");
    setBusy(true);
    setError("");
    const message = await onLogin(name.trim(), password);
    if (message) {
      setError(message);
      setPassword("");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl border border-stone-100 bg-white p-7 shadow-sm"
      >
        <div className="flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-600 text-3xl text-white">
            🏡
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-stone-800">HomeLink</h1>
          <p className="mt-1 text-sm text-stone-500">
            Masuk dulu untuk membuka aplikasi keluarga
          </p>
        </div>

        <label className="mt-6 block text-sm font-medium text-stone-700">Nama</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="username"
          maxLength={30}
          placeholder="Nama kamu"
          className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2 outline-none focus:border-green-500"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {members.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setName(m)}
              className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600 hover:bg-green-50 hover:text-green-700"
            >
              {m}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-sm font-medium text-stone-700">Kata sandi</label>
        <div className="mt-1 flex gap-2">
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="Kata sandi keluarga"
            className="min-w-0 flex-1 rounded-xl border border-stone-200 px-4 py-2 outline-none focus:border-green-500"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="rounded-xl border border-stone-200 px-3 text-sm text-stone-500 hover:bg-stone-50"
          >
            {show ? "Sembunyi" : "Lihat"}
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-xl bg-green-600 py-2.5 font-medium text-white hover:bg-green-700 disabled:opacity-60"
        >
          {busy ? "Memeriksa..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}
