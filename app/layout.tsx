import type { Metadata } from "next";
import AuthProvider from "@/components/AuthProvider";
import Nav from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "HomeLink - Manajemen Keluarga",
  description: "Atur jadwal, tugas rumah, belanja, keuangan, dan check-in keluarga dalam satu tempat.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-[#f6f4ef] text-stone-800 antialiased">
        <AuthProvider>
          <Nav />
          <main className="mx-auto max-w-4xl px-5 py-8">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
