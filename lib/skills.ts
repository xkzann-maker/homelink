// Kemampuan lokal Asisten (jalan tanpa OpenAI): kalkulator, konversi, patungan,
// ide menu/kegiatan, tips, hiburan. Semua jawaban dibuat dari aturan sederhana.
import { formatRupiah } from "./data";

// ---------- Angka ----------

// "1.500" -> 1500, "1,5" -> 1.5, "25000" -> 25000
function normNum(s: string): number {
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) return Number(s.replace(/\./g, "").replace(",", "."));
  if (/^\d{1,3}(,\d{3})+$/.test(s)) return Number(s.replace(/,/g, ""));
  return parseFloat(s.replace(",", "."));
}

// "50rb" -> 50000, "1,5jt" -> 1500000, "25.000" -> 25000
export function parseAmount(text: string): number | null {
  const m = text.toLowerCase().match(/(\d+(?:[.,]\d+)*)\s*(rb|ribu|k|jt|juta)?(?![a-z])/);
  if (!m) return null;
  const unit = m[2];
  const n = unit ? parseFloat(m[1].replace(",", ".")) : normNum(m[1]);
  if (!isFinite(n)) return null;
  const mult = unit === "jt" || unit === "juta" ? 1e6 : unit ? 1e3 : 1;
  return Math.round(n * mult);
}

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 6 }).format(n);

// Kalkulator aman (tanpa eval): + - * / ( ) dan angka
export function calculate(expr: string): number | null {
  const tokens = expr
    .replace(/[x×]/gi, "*")
    .replace(/÷/g, "/")
    .match(/\d+(?:[.,]\d+)*|[-+*/()]/g);
  if (!tokens) return null;
  let i = 0;
  const peek = () => tokens[i];

  function parseExpr(): number {
    let v = parseTerm();
    while (peek() === "+" || peek() === "-") {
      const op = tokens![i++];
      const r = parseTerm();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  }
  function parseTerm(): number {
    let v = parseFactor();
    while (peek() === "*" || peek() === "/") {
      const op = tokens![i++];
      const r = parseFactor();
      if (op === "/" && r === 0) throw new Error("bagi nol");
      v = op === "*" ? v * r : v / r;
    }
    return v;
  }
  function parseFactor(): number {
    const t = tokens![i++];
    if (t === undefined) throw new Error("kurang");
    if (t === "-") return -parseFactor();
    if (t === "+") return parseFactor();
    if (t === "(") {
      const v = parseExpr();
      if (tokens![i++] !== ")") throw new Error("kurung");
      return v;
    }
    if (/^\d/.test(t)) return normNum(t);
    throw new Error("salah");
  }

  try {
    const v = parseExpr();
    if (i !== tokens.length || !isFinite(v)) return null;
    return v;
  } catch {
    return null;
  }
}

// ---------- Konversi satuan ----------

const unitAlias: Record<string, string> = {
  kilometer: "km", meter: "m", kilogram: "kg", gram: "g", liter: "l",
  celsius: "c", fahrenheit: "f", "°c": "c", "°f": "f",
};
const unitTable: Record<string, { cat: string; f: number }> = {
  km: { cat: "panjang", f: 1000 }, m: { cat: "panjang", f: 1 },
  cm: { cat: "panjang", f: 0.01 }, mm: { cat: "panjang", f: 0.001 },
  kg: { cat: "massa", f: 1000 }, g: { cat: "massa", f: 1 },
  ons: { cat: "massa", f: 100 }, mg: { cat: "massa", f: 0.001 },
  l: { cat: "volume", f: 1000 }, ml: { cat: "volume", f: 1 },
  jam: { cat: "waktu", f: 3600 }, menit: { cat: "waktu", f: 60 }, detik: { cat: "waktu", f: 1 },
  c: { cat: "suhu", f: 1 }, f: { cat: "suhu", f: 1 },
};
const unitNames = "kilometer|kilogram|kilo|celsius|fahrenheit|°c|°f|meter|gram|liter|menit|detik|jam|km|kg|cm|mm|mg|ons|ml|m|g|l|c|f";

function convertReply(q: string): string | null {
  const re = new RegExp(
    `(-?\\d+(?:[.,]\\d+)?)\\s*(${unitNames})\\s*(?:ke|to|jadi|menjadi|dalam)\\s*(${unitNames})\\b`
  );
  const m = q.match(re);
  if (!m) return null;
  const value = normNum(m[1]);
  const from = unitAlias[m[2]] ?? (m[2] === "kilo" ? "kg" : m[2]);
  const to = unitAlias[m[3]] ?? (m[3] === "kilo" ? "kg" : m[3]);
  const a = unitTable[from];
  const b = unitTable[to];
  if (!a || !b) return null;
  if (a.cat !== b.cat) return `${m[2]} (${a.cat}) tidak bisa dikonversi ke ${m[3]} (${b.cat}). Pakai satuan yang sejenis, ya.`;

  let result: number;
  if (a.cat === "suhu") {
    if (from === to) result = value;
    else result = from === "c" ? (value * 9) / 5 + 32 : ((value - 32) * 5) / 9;
  } else {
    result = (value * a.f) / b.f;
  }
  return `${fmt(value)} ${m[2]} = ${fmt(Math.round(result * 1e6) / 1e6)} ${m[3]}`;
}

// ---------- Kalkulator, diskon, patungan, waktu ----------

export function quickTools(q: string): string | null {
  // Persen / diskon: "diskon 20% dari 150rb", "15% dari 200000"
  const pct = q.match(/(\d+(?:[.,]\d+)?)\s*%\s*(?:dari|of|harga)?\s*(\d[\d.,]*\s*(?:rb|ribu|jt|juta|k)?(?![a-z]))/);
  if (pct && /%\s*(dari|of|harga)/.test(q)) {
    const p = normNum(pct[1]);
    const base = parseAmount(pct[2]);
    if (base !== null) {
      const part = (base * p) / 100;
      return /diskon|potongan/.test(q)
        ? `Diskon ${fmt(p)}% dari ${formatRupiah(base)} = ${formatRupiah(part)}.\nHarga akhir: ${formatRupiah(base - part)}.`
        : `${fmt(p)}% dari ${formatRupiah(base)} = ${formatRupiah(part)}.`;
    }
  }

  // Patungan: "patungan 300rb untuk 4 orang"
  const split = q.match(
    /(?:patungan|urunan|bagi rata|bagi|split)\D*?(\d[\d.,]*\s*(?:rb|ribu|jt|juta|k)?(?![a-z]))\D+?(\d+)\s*(?:orang|anggota|pihak)/
  );
  if (split) {
    const total = parseAmount(split[1]);
    const n = Number(split[2]);
    if (total !== null && n > 0) {
      const each = Math.ceil(total / n);
      const round = each * n !== total ? " (dibulatkan ke atas)" : "";
      return `Patungan ${formatRupiah(total)} untuk ${n} orang: ${formatRupiah(each)} per orang${round}.`;
    }
  }

  const conv = convertReply(q);
  if (conv) return conv;

  // Kalkulator: "hitung 25000 x 3 + 1500", "berapa 10/4", atau langsung "12*5"
  const calc = q.match(/^(?:hitung(?:kan)?|berapa(?:kah)?(?:\s+hasil)?|hasil)?\s*([\d\s.,+\-*/x×÷()]+)\s*\??$/);
  if (calc && /\d/.test(calc[1]) && /[+\-*/x×÷]/.test(calc[1])) {
    const v = calculate(calc[1]);
    if (v !== null) return `${calc[1].trim()} = ${fmt(v)}`;
    return "Maaf, rumus itu belum bisa saya hitung. Coba tulis lebih sederhana, misalnya 25000 x 3 + 1500.";
  }

  // Tanggal & jam
  if (/tanggal berapa|hari apa|jam berapa|pukul berapa|sekarang jam|waktu sekarang/.test(q)) {
    const now = new Date();
    const date = new Intl.DateTimeFormat("id-ID", {
      weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta",
    }).format(now);
    const time = new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta",
    }).format(now);
    return `Sekarang ${date}, pukul ${time} WIB.`;
  }

  return null;
}

// ---------- Ide, tips, hiburan ----------

function pick<T>(list: T[], n: number): T[] {
  const copy = [...list];
  const out: T[] = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}
const bullets = (list: string[]) => list.map((x) => `• ${x}`).join("\n");

const menus = {
  sarapan: ["Nasi goreng telur", "Bubur ayam", "Roti bakar cokelat keju", "Lontong sayur", "Omelet sayur + nasi hangat", "Oatmeal pisang madu", "Nasi uduk dan tempe orek"],
  siang: ["Ayam goreng, tumis kangkung, sambal", "Soto ayam bening", "Capcay + tahu goreng", "Nasi campur ikan bakar", "Gado-gado lengkap", "Sop iga hangat", "Pepes tahu dan lalapan"],
  malam: ["Sup ayam jamur", "Ikan kembung bakar + lalapan", "Tumis brokoli udang", "Orek tempe + telur balado", "Sayur asem + ikan asin", "Ayam kecap + tumis buncis", "Tahu tempe bacem + sayur bening"],
};

const activities = [
  "Piknik kecil di taman dekat rumah",
  "Malam film keluarga + popcorn buatan sendiri",
  "Masak bareng: tiap anggota pilih satu menu",
  "Bersepeda santai pagi hari",
  "Kerja bakti mini: merapikan satu ruangan bersama",
  "Main papan/kartu (ular tangga, monopoli, UNO)",
  "Berkebun: tanam cabai atau tomat di pot",
  "Kunjungi museum atau perpustakaan daerah",
];

const gifts = [
  "Buku cerita atau novel favoritnya",
  "Kue ulang tahun buatan sendiri",
  "Album foto kenangan keluarga",
  "Peralatan hobi (alat gambar, benang rajut, dll.)",
  "Voucher \"bebas satu tugas rumah\" 😄",
  "Tanaman hias mungil",
];

const tips: { match: RegExp; title: string; items: string[] }[] = [
  { match: /listrik|energi|watt/, title: "Tips hemat listrik", items: ["Cabut charger dan alat yang tidak dipakai", "Ganti lampu dengan LED", "Atur AC di 24–26°C dan bersihkan filternya rutin", "Setrika sekaligus, jangan sedikit-sedikit", "Matikan lampu dan TV saat tidak ditonton"] },
  { match: /belanja|hemat|murah|diskon/, title: "Tips belanja hemat", items: ["Buat daftar dulu, patuhi saat di toko", "Jangan belanja saat lapar", "Bandingkan harga per satuan (per 100 g / per liter)", "Beli banyak untuk barang tahan lama", "Cek stok di rumah sebelum membeli"] },
  { match: /bersih|beres|rapi|cuci|piket/, title: "Tips rumah rapi", items: ["Bagi per area dan per hari, jangan sekaligus", "Sisihkan 15 menit sehari untuk merapikan", "Bersihkan dari atas ke bawah", "Cuci piring langsung setelah makan", "Beri tiap barang \"rumah\" tetap"] },
  { match: /tidur|istirahat/, title: "Tips tidur nyenyak", items: ["Tidur dan bangun di jam yang konsisten", "Matikan gawai 1 jam sebelum tidur", "Kamar gelap, sejuk, dan tenang", "Kurangi kafein di sore hari"] },
  { match: /belajar|sekolah|pr\b|anak/, title: "Tips belajar anak", items: ["Sesi belajar pendek (25 menit) lalu istirahat 5 menit", "Siapkan tempat yang tenang", "Puji usahanya, bukan hanya nilainya", "Jadwalkan waktu belajar di jam yang sama"] },
  { match: /sehat|olahraga|diet|bugar/, title: "Tips hidup sehat", items: ["Jalan kaki 30 menit hampir tiap hari", "Minum air putih yang cukup", "Ada sayur di tiap kali makan", "Olahraga bareng keluarga biar seru"] },
  { match: /darurat|tabung|nabung|keuangan|uang/, title: "Tips keuangan keluarga", items: ["Catat pengeluaran (pakai halaman Keuangan)", "Sisihkan tabungan di awal bulan, bukan sisa akhir bulan", "Dana darurat ideal sekitar 3–6 bulan pengeluaran", "Bedakan kebutuhan dan keinginan"] },
];

const jokes = [
  "Ibu: \"Nak, kok nilaimu turun?\"\nAnak: \"Bukan turun, Bu. Lagi ikut gaya gravitasi.\" 😄",
  "Kenapa jam dinding selalu tenang?\nKarena dia sudah biasa digantung, tapi tetap tepat waktu. ⏰",
  "Kenapa kalkulator tidak pernah stres?\nSemua masalahnya ada solusinya, tinggal tekan \"sama dengan\"! 🧮",
  "Apa bedanya nasi goreng dan cinta?\nNasi goreng kalau dingin masih bisa dipanaskan. 🍳",
];
const pantun = [
  "Pergi ke pasar beli semangka,\nJangan lupa beli tomat.\nRumah ramai penuh tawa,\nKarena keluarga saling dekat. 💚",
  "Makan soto di pagi hari,\nDitambah teh manis segelas.\nTugas rumah dikerjakan sendiri,\nIbu tersenyum hati pun puas. 🌿",
];
const motivation = [
  "Langkah kecil yang konsisten lebih kuat daripada semangat besar yang sebentar. Kamu pasti bisa! 💪",
  "Rumah yang hangat dibangun dari hal-hal kecil: sapaan pagi, makan bersama, dan saling bantu. 💚",
  "Capek itu wajar. Istirahat sebentar, lalu lanjut pelan-pelan. Kamu sudah melakukan yang terbaik hari ini. 🌟",
  "Tidak apa-apa belum sempurna. Yang penting hari ini lebih baik dari kemarin, walau sedikit.",
];
const facts = [
  "Gurita punya tiga jantung. 🐙",
  "Madu yang disimpan dengan benar bisa awet sangat lama tanpa basi. 🍯",
  "Secara botani, pisang termasuk buah beri (berry), sedangkan stroberi bukan. 🍌",
  "Satu hari di Venus lebih lama daripada satu tahunnya. 🪐",
  "Indonesia punya lebih dari 17 ribu pulau. 🏝️",
  "Jantung udang terletak di bagian kepalanya. 🦐",
];

export function ideaReply(q: string): string | null {
  const wantsIdea = /\b(ide|saran|rekomendasi|usul|resep)\b|masak apa|makan apa|mau masak/.test(q);

  if (wantsIdea && /menu|masak|makan|sarapan|resep/.test(q)) {
    const meal = /sarapan|pagi/.test(q) ? "sarapan" : /siang/.test(q) ? "siang" : "malam";
    const label = { sarapan: "sarapan", siang: "makan siang", malam: "makan malam" }[meal];
    return `Ide menu ${label}:\n${bullets(pick(menus[meal], 3))}\n\nMau ide lain? Tanya lagi saja. 🍽️`;
  }
  if (wantsIdea && /kegiatan|akhir pekan|weekend|liburan|main|bosan/.test(q)) {
    return `Ide kegiatan keluarga:\n${bullets(pick(activities, 3))}`;
  }
  if (wantsIdea && /hadiah|kado|ulang tahun/.test(q)) {
    return `Ide hadiah:\n${bullets(pick(gifts, 3))}`;
  }

  if (/tips|cara|saran|gimana|bagaimana/.test(q)) {
    const t = tips.find((x) => x.match.test(q));
    if (t) return `${t.title}:\n${bullets(t.items)}`;
    if (/tips/.test(q)) {
      return "Saya punya tips tentang: hemat listrik, belanja hemat, rumah rapi, tidur nyenyak, belajar anak, hidup sehat, dan keuangan keluarga. Contoh: \"Tips hemat listrik\".";
    }
  }

  if (/pantun/.test(q)) return pick(pantun, 1)[0];
  if (/jokes?|lelucon|lucu|humor|bercanda/.test(q)) return pick(jokes, 1)[0];
  if (/semangat|motivasi|kata.?kata (bijak|mutiara)|hibur/.test(q)) return pick(motivation, 1)[0];
  if (/fakta|tahukah/.test(q)) return `Fakta unik: ${pick(facts, 1)[0]}`;

  return null;
}

export const helpText = [
  "Yang bisa saya bantu:",
  "• Data keluarga: jadwal, tugas, belanja, keuangan, check-in, riwayat login",
  "• Perintah cepat (dengan konfirmasi): \"tambah belanja susu 2 liter\", \"tambah tugas cuci mobil untuk Ayah\", \"catat pengeluaran 50rb beli bensin\", \"tambah jadwal les besok jam 16.00\"",
  "• Alat bantu: kalkulator, diskon, patungan, konversi satuan, tanggal & jam",
  "• Ide & tips: menu masak, kegiatan akhir pekan, ide hadiah, tips rumah tangga",
  "• Hiburan: jokes, pantun, semangat, fakta unik",
  "• Pertanyaan umum apa saja (perlu OPENAI_API_KEY)",
].join("\n");
