export interface PromptTemplate {
  id: string;
  topic: string;
  type: "quiz" | "flashcard";
  title: string;
  description: string;
  template: string;
}

// Format flashcard yang dibutuhkan sistem:
// [{"question":"...","answer":"...","tag":"..."}]
//
// Format quiz yang dibutuhkan sistem:
// [{"question":"...","options":["A","B","C","D"],"answer":"teks lengkap opsi A"}]

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  // ── FLASHCARD TEMPLATES ─────────────────────────────────────────
  {
    id: "fc-concepts",
    topic: "Umum",
    type: "flashcard",
    title: "Konsep & Definisi",
    description: "Flashcard konsep inti dan definisi",
    template: `Buatkan 10 flashcard tentang [TOPIC] untuk level [LEVEL].
Fokus pada konsep inti, definisi, dan contoh nyata.

PENTING: Balas HANYA dengan array JSON murni. Jangan tambahkan teks, penjelasan, markdown, atau blok kode (\`\`\`). Langsung mulai dengan [ dan akhiri dengan ].

Format JSON yang WAJIB digunakan (contoh):
[
  {
    "question": "Apa yang dimaksud dengan fotosintesis?",
    "answer": "Proses di mana tumbuhan mengubah cahaya matahari, air, dan CO₂ menjadi glukosa dan oksigen menggunakan klorofil.",
    "tag": "biologi-dasar"
  }
]

ATURAN WAJIB:
1. Field "question": pertanyaan atau konsep yang diuji
2. Field "answer": jawaban lengkap dan informatif (boleh beberapa kalimat)
3. Field "tag": kata kunci singkat dengan tanda hubung jika perlu (contoh: "reaksi-kimia")
4. Tidak ada field lain selain "question", "answer", "tag"
5. Gunakan Bahasa Indonesia
6. Topik: [TOPIC]`,
  },
  {
    id: "fc-vocab",
    topic: "Bahasa",
    type: "flashcard",
    title: "Kosakata & Frasa",
    description: "Flashcard kosakata dan frasa penting",
    template: `Buatkan 15 flashcard kosakata untuk belajar [TOPIC], level [LEVEL].
Sertakan kata, makna, dan contoh kalimat.

PENTING: Balas HANYA dengan array JSON murni. Jangan tambahkan teks, penjelasan, markdown, atau blok kode (\`\`\`). Langsung mulai dengan [ dan akhiri dengan ].

Format JSON yang WAJIB digunakan (contoh):
[
  {
    "question": "Apa arti kata 'Ubiquitous'?",
    "answer": "Ada di mana-mana; hadir atau ditemukan di mana saja. Contoh kalimat: 'Smartphones have become ubiquitous in modern society.'",
    "tag": "kosakata-inggris"
  }
]

ATURAN WAJIB:
1. Field "question": kata atau frasa yang ingin diuji
2. Field "answer": makna lengkap + contoh kalimat
3. Field "tag": kategori kosakata (contoh: "kosakata-inggris", "kata-sifat")
4. Tidak ada field lain selain "question", "answer", "tag"
5. Topik: [TOPIC]`,
  },
  {
    id: "fc-dates",
    topic: "Sejarah",
    type: "flashcard",
    title: "Tanggal & Peristiwa",
    description: "Flashcard peristiwa historis penting",
    template: `Buatkan 10 flashcard tentang peristiwa, tanggal, dan tokoh penting dalam [TOPIC], level [LEVEL].

PENTING: Balas HANYA dengan array JSON murni. Jangan tambahkan teks, penjelasan, markdown, atau blok kode (\`\`\`). Langsung mulai dengan [ dan akhiri dengan ].

Format JSON yang WAJIB digunakan (contoh):
[
  {
    "question": "Kapan dan di mana Proklamasi Kemerdekaan Indonesia dibacakan?",
    "answer": "17 Agustus 1945, di Jalan Pegangsaan Timur No. 56, Jakarta, oleh Soekarno dan Mohammad Hatta.",
    "tag": "sejarah-indonesia"
  }
]

ATURAN WAJIB:
1. Field "question": pertanyaan tentang tanggal, tokoh, atau peristiwa
2. Field "answer": penjelasan lengkap beserta konteks dan dampaknya
3. Field "tag": kategori sejarah (contoh: "sejarah-indonesia", "perang-dunia")
4. Tidak ada field lain selain "question", "answer", "tag"
5. Topik: [TOPIC]`,
  },

  // ── QUIZ TEMPLATES ──────────────────────────────────────────────
  {
    id: "qz-mcq",
    topic: "Umum",
    type: "quiz",
    title: "Pilihan Ganda",
    description: "Quiz pilihan ganda dengan 4 opsi",
    template: `Buatkan 10 soal pilihan ganda tentang [TOPIC] untuk level [LEVEL].

PENTING: Balas HANYA dengan array JSON murni. Jangan tambahkan teks, penjelasan, markdown, atau blok kode (\`\`\`). Langsung mulai dengan [ dan akhiri dengan ].

Format JSON yang WAJIB digunakan (contoh):
[
  {
    "question": "Apa fungsi dari useEffect di React?",
    "options": [
      "Mengelola side effects setelah render",
      "Menyimpan state lokal komponen",
      "Membuat elemen DOM baru",
      "Menghapus komponen dari tree"
    ],
    "answer": "Mengelola side effects setelah render"
  }
]

ATURAN WAJIB:
1. Field "question": string berisi pertanyaan
2. Field "options": array berisi TEPAT 4 string (teks lengkap, BUKAN huruf A/B/C/D)
3. Field "answer": string IDENTIK SAMA PERSIS dengan salah satu elemen di array "options"
4. JANGAN tulis "A", "B", "C", "D" sebagai nilai "answer" — tulis teks lengkap opsinya
5. Tidak ada field lain selain "question", "options", "answer"
6. Gunakan Bahasa Indonesia
7. Topik: [TOPIC]`,
  },
  {
    id: "qz-prog",
    topic: "Programming",
    type: "quiz",
    title: "Kode & Syntax",
    description: "Quiz konsep programming dan syntax",
    template: `Buatkan 8 soal quiz tentang [TOPIC] untuk level [LEVEL].
Campurkan soal konseptual dan soal tentang output kode.

PENTING: Balas HANYA dengan array JSON murni. Jangan tambahkan teks, penjelasan, markdown, atau blok kode (\`\`\`). Langsung mulai dengan [ dan akhiri dengan ].

Format JSON yang WAJIB digunakan (contoh):
[
  {
    "question": "Apa output dari: console.log(typeof null)?",
    "options": [
      "object",
      "null",
      "undefined",
      "string"
    ],
    "answer": "object"
  }
]

ATURAN WAJIB:
1. Field "question": string berisi pertanyaan atau snippet kode
2. Field "options": array berisi TEPAT 4 string jawaban (teks lengkap, bukan huruf)
3. Field "answer": string IDENTIK SAMA PERSIS dengan salah satu elemen di "options"
4. JANGAN tulis "A", "B", "C", "D" sebagai nilai "answer"
5. Tidak ada field lain selain "question", "options", "answer"
6. Topik: [TOPIC]`,
  },
  {
    id: "qz-math",
    topic: "Matematika",
    type: "quiz",
    title: "Soal & Pemecahan",
    description: "Quiz pemecahan soal matematika",
    template: `Buatkan 8 soal matematika tentang [TOPIC] untuk level [LEVEL].
Mulai dari soal mudah dan tingkatkan kesulitannya secara bertahap.

PENTING: Balas HANYA dengan array JSON murni. Jangan tambahkan teks, penjelasan, markdown, atau blok kode (\`\`\`). Langsung mulai dengan [ dan akhiri dengan ].

Format JSON yang WAJIB digunakan (contoh):
[
  {
    "question": "Berapakah hasil dari 15 × 12?",
    "options": [
      "180",
      "170",
      "175",
      "165"
    ],
    "answer": "180"
  }
]

ATURAN WAJIB:
1. Field "question": string berisi soal matematika
2. Field "options": array berisi TEPAT 4 string (angka/ekspresi sebagai teks)
3. Field "answer": string IDENTIK SAMA PERSIS dengan salah satu elemen di "options"
4. JANGAN tulis "A", "B", "C", "D" sebagai nilai "answer"
5. Tidak ada field lain selain "question", "options", "answer"
6. Topik: [TOPIC]`,
  },
];

export function generatePrompt(
  template: string,
  topic: string,
  level: string
): string {
  return template
    .replace(/\[TOPIC\]/g, topic)
    .replace(/\[LEVEL\]/g, level);
}
