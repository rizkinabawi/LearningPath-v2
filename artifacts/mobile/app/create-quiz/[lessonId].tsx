import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import {
  X,
  Trash2,
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Bot,
  Copy,
  Check,
  Download,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as Clipboard from "expo-clipboard";
import { Button } from "@/components/Button";
import {
  getQuizzes,
  saveQuiz,
  deleteQuiz,
  generateId,
  getLessons,
  type Quiz,
} from "@/utils/storage";
import Colors from "@/constants/colors";
import { toast } from "@/components/Toast";

const IMAGE_DIR = ((FileSystem as any).documentDirectory ?? "") + "quiz-images/";

const ensureImageDir = async () => {
  if (Platform.OS === "web") return;
  const info = await FileSystem.getInfoAsync(IMAGE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
  }
};

const saveImageToLocal = async (uri: string, id: string): Promise<string> => {
  if (Platform.OS === "web") return uri;
  await ensureImageDir();
  const ext = uri.split(".").pop()?.split("?")[0] ?? "jpg";
  const dest = IMAGE_DIR + id + "." + ext;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
};

const buildAIPrompt = (topic: string, count: number, difficulty: string) => {
  const diffLabel =
    difficulty === "easy"
      ? "mudah (untuk pemula)"
      : difficulty === "hard"
      ? "sulit (level lanjut)"
      : "sedang (level menengah)";

  return `Buatkan ${count} soal pilihan ganda tentang "${topic}" dengan tingkat kesulitan ${diffLabel}.

PENTING: Balas HANYA dengan array JSON murni. Jangan tambahkan teks, penjelasan, markdown, atau blok kode (\`\`\`). Langsung mulai dengan tanda [ dan akhiri dengan ].

Format JSON yang WAJIB digunakan (contoh):
[
  {
    "question": "Apa fungsi dari useEffect di React?",
    "options": [
      "Mengelola side effects setelah render",
      "Menyimpan state lokal komponen",
      "Membuat komponen baru",
      "Menghapus elemen dari DOM"
    ],
    "answer": "Mengelola side effects setelah render"
  }
]

ATURAN WAJIB — wajib diikuti untuk setiap soal:
1. Field "question": string berisi pertanyaan
2. Field "options": array berisi TEPAT 4 string pilihan jawaban (teks lengkap, bukan huruf A/B/C/D)
3. Field "answer": string yang IDENTIK SAMA PERSIS (huruf, spasi, tanda baca) dengan salah satu elemen di array "options"
4. JANGAN gunakan "A", "B", "C", "D" sebagai nilai "answer" — gunakan teks lengkap opsinya
5. Tidak ada field lain selain "question", "options", "answer"
6. Gunakan Bahasa Indonesia
7. Topik: ${topic}`;
};

export default function CreateQuizScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState<number | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [existing, setExisting] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);

  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState("");

  const [showPrompt, setShowPrompt] = useState(false);
  const [promptTopic, setPromptTopic] = useState("");
  const [promptCount, setPromptCount] = useState("10");
  const [promptDifficulty, setPromptDifficulty] = useState("medium");
  const [promptCopied, setPromptCopied] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");

  useEffect(() => {
    (async () => {
      const data = await getQuizzes(lessonId);
      setExisting(data);
      if (lessonId) {
        const lessons = await getLessons();
        const lesson = lessons.find((l) => l.id === lessonId);
        if (lesson?.name) setPromptTopic(lesson.name);
      }
    })();
  }, [lessonId]);

  const pickImage = async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Izin Diperlukan", "Izinkan akses galeri untuk upload gambar.");
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!question.trim()) {
      Alert.alert("Isi Pertanyaan", "Pertanyaan tidak boleh kosong.");
      return;
    }
    const filledOptions = options.filter((o) => o.trim());
    if (filledOptions.length < 2) {
      Alert.alert("Minimal 2 Pilihan", "Isi minimal 2 pilihan jawaban.");
      return;
    }
    if (correctOption === null || !options[correctOption]?.trim()) {
      Alert.alert("Pilih Jawaban Benar", "Tandai salah satu pilihan sebagai jawaban benar.");
      return;
    }
    setLoading(true);
    const id = generateId();
    let savedImage: string | undefined;
    if (imageUri) {
      try {
        savedImage = await saveImageToLocal(imageUri, id);
      } catch {
        savedImage = imageUri;
      }
    }
    const quiz: Quiz = {
      id,
      lessonId: lessonId ?? "",
      question: question.trim(),
      options: options.filter((o) => o.trim()),
      answer: options[correctOption].trim(),
      type: "multiple-choice",
      image: savedImage,
      createdAt: new Date().toISOString(),
    };
    await saveQuiz(quiz);
    setExisting((prev) => [...prev, quiz]);
    setQuestion("");
    setOptions(["", "", "", ""]);
    setCorrectOption(null);
    setImageUri(null);
    setLoading(false);
    toast.success("Soal berhasil ditambahkan!");
  };

  const handleDelete = async (id: string) => {
    await deleteQuiz(id);
    setExisting((prev) => prev.filter((q) => q.id !== id));
    toast.info("Soal dihapus");
  };

  const handleImportJson = async () => {
    try {
      const parsed = JSON.parse(importJson);

      // Normalisasi: terima flat array ATAU wrapped {type, items}
      let rawItems: any[] = [];
      if (Array.isArray(parsed)) {
        rawItems = parsed;
      } else if (parsed && Array.isArray(parsed.items)) {
        rawItems = parsed.items;
      } else {
        rawItems = [parsed];
      }

      let count = 0;
      for (const item of rawItems) {
        if (!item.question || !Array.isArray(item.options) || !item.answer) continue;

        const options: string[] = item.options.map(String);
        const answerRaw = String(item.answer).trim();

        // Coba cocokkan jawaban: cari opsi yang mengandung jawaban atau sebaliknya
        let answer = answerRaw;
        const exactMatch = options.find((o) => o === answerRaw);
        if (!exactMatch) {
          // Fallback: cari opsi yang dimulai dengan huruf jawaban (misal: "A" → opsi pertama)
          const letterMatch = answerRaw.match(/^([A-Da-d])[\.\):\s]/);
          if (letterMatch) {
            const idx = "abcd".indexOf(letterMatch[1].toLowerCase());
            if (idx >= 0 && options[idx]) answer = options[idx];
          } else {
            // Partial match: cari opsi yang mengandung teks jawaban
            const partial = options.find((o) =>
              o.toLowerCase().includes(answerRaw.toLowerCase()) ||
              answerRaw.toLowerCase().includes(o.toLowerCase())
            );
            if (partial) answer = partial;
          }
        }

        const quiz: Quiz = {
          id: generateId(),
          lessonId: lessonId ?? "",
          question: String(item.question),
          options,
          answer,
          type: "multiple-choice",
          createdAt: new Date().toISOString(),
        };
        await saveQuiz(quiz);
        setExisting((prev) => [...prev, quiz]);
        count++;
      }

      if (count === 0) {
        Alert.alert("Tidak Ada Data", "Tidak ada soal valid. Pastikan setiap item punya field question, options (array), dan answer.");
        return;
      }

      setImportJson("");
      setShowImport(false);
      toast.success(`${count} soal berhasil diimport!`);
    } catch {
      Alert.alert(
        "JSON Tidak Valid",
        'Format yang didukung:\n\n1. Flat array (disarankan):\n[{"question":"...","options":["A","B","C","D"],"answer":"teks lengkap A"}]\n\n2. Wrapped format:\n{"items":[{"question":"...","options":[...],"answer":"..."}]}'
      );
    }
  };

  const handleGenerateAndCopyPrompt = async () => {
    if (!promptTopic.trim()) {
      toast.error("Isi topik materi terlebih dahulu");
      return;
    }
    const count = parseInt(promptCount) || 10;
    const prompt = buildAIPrompt(promptTopic.trim(), count, promptDifficulty);
    setGeneratedPrompt(prompt);
    await Clipboard.setStringAsync(prompt);
    setPromptCopied(true);
    toast.success("Prompt berhasil disalin! Tempel ke ChatGPT/Gemini.");
    setTimeout(() => setPromptCopied(false), 3000);
  };

  const difficulties = [
    { key: "easy", label: "Mudah" },
    { key: "medium", label: "Sedang" },
    { key: "hard", label: "Sulit" },
  ];

  return (
    <KeyboardAwareScrollViewCompat
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Platform.OS === "web" ? 80 : insets.top + 16,
          paddingBottom: 60,
        },
      ]}
      bottomOffset={16}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tambah Soal Quiz</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <X size={20} color={Colors.dark} />
        </TouchableOpacity>
      </View>
      <Text style={styles.count}>{existing.length} soal di pelajaran ini</Text>

      {/* ── AI PROMPT GENERATOR ── */}
      <View style={styles.aiCard}>
        <TouchableOpacity
          style={styles.aiCardHeader}
          onPress={() => setShowPrompt(!showPrompt)}
          activeOpacity={0.8}
        >
          <View style={styles.aiCardLeft}>
            <View style={styles.aiIcon}>
              <Bot size={18} color={Colors.white} />
            </View>
            <View>
              <Text style={styles.aiCardTitle}>Buat Soal dengan AI</Text>
              <Text style={styles.aiCardSub}>
                Salin prompt → tempel ke ChatGPT/Gemini → import hasilnya
              </Text>
            </View>
          </View>
          {showPrompt ? (
            <ChevronUp size={18} color={Colors.primary} />
          ) : (
            <ChevronDown size={18} color={Colors.primary} />
          )}
        </TouchableOpacity>

        {showPrompt && (
          <View style={styles.aiCardBody}>
            {/* Step 1 */}
            <View style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNum}>1</Text>
              </View>
              <Text style={styles.stepLabel}>Isi detail soal yang ingin dibuat</Text>
            </View>

            <Text style={styles.fieldLabel}>Topik / Materi</Text>
            <TextInput
              value={promptTopic}
              onChangeText={setPromptTopic}
              placeholder="Contoh: React Hooks, Fotosintesis, Perkalian"
              style={styles.aiInput}
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Jumlah Soal</Text>
            <View style={styles.countRow}>
              {["5", "10", "15", "20"].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[
                    styles.countBtn,
                    promptCount === n && styles.countBtnActive,
                  ]}
                  onPress={() => setPromptCount(n)}
                >
                  <Text
                    style={[
                      styles.countBtnText,
                      promptCount === n && styles.countBtnTextActive,
                    ]}
                  >
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
              <TextInput
                value={promptCount}
                onChangeText={setPromptCount}
                keyboardType="numeric"
                style={styles.countInput}
                placeholderTextColor={Colors.textMuted}
                placeholder="Lainnya"
                maxLength={3}
              />
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Tingkat Kesulitan</Text>
            <View style={styles.diffRow}>
              {difficulties.map((d) => (
                <TouchableOpacity
                  key={d.key}
                  style={[
                    styles.diffBtn,
                    promptDifficulty === d.key && styles.diffBtnActive,
                  ]}
                  onPress={() => setPromptDifficulty(d.key)}
                >
                  <Text
                    style={[
                      styles.diffBtnText,
                      promptDifficulty === d.key && styles.diffBtnTextActive,
                    ]}
                  >
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Copy Prompt Button */}
            <TouchableOpacity
              style={[styles.copyPromptBtn, promptCopied && styles.copyPromptBtnDone]}
              onPress={handleGenerateAndCopyPrompt}
              activeOpacity={0.85}
            >
              {promptCopied ? (
                <Check size={16} color={Colors.white} />
              ) : (
                <Copy size={16} color={Colors.white} />
              )}
              <Text style={styles.copyPromptBtnText}>
                {promptCopied ? "Prompt Tersalin!" : "Salin Prompt untuk AI"}
              </Text>
            </TouchableOpacity>

            {/* Step 2 & 3 instructions */}
            <View style={styles.stepsGuide}>
              <View style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepNum}>2</Text>
                </View>
                <Text style={styles.stepLabel}>
                  Tempel prompt ke{" "}
                  <Text style={{ fontWeight: "800", color: Colors.dark }}>
                    ChatGPT / Gemini / AI lainnya
                  </Text>
                </Text>
              </View>
              <View style={[styles.stepRow, { marginTop: 8 }]}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepNum}>3</Text>
                </View>
                <Text style={styles.stepLabel}>
                  Salin hasil JSON dari AI → tempel di bagian{" "}
                  <Text style={{ fontWeight: "800", color: Colors.primary }}>
                    "Import JSON dari AI"
                  </Text>{" "}
                  di bawah
                </Text>
              </View>
            </View>

            {/* Preview prompt */}
            {generatedPrompt !== "" && (
              <View style={styles.promptPreview}>
                <Text style={styles.promptPreviewLabel}>Preview Prompt:</Text>
                <Text style={styles.promptPreviewText} numberOfLines={5}>
                  {generatedPrompt}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* ── IMPORT JSON ── */}
      <TouchableOpacity
        style={styles.importToggle}
        onPress={() => setShowImport(!showImport)}
      >
        <View style={styles.importToggleLeft}>
          <Download size={15} color={Colors.primary} />
          <Text style={styles.importToggleText}>Import JSON dari AI</Text>
        </View>
        {showImport ? (
          <ChevronUp size={16} color={Colors.primary} />
        ) : (
          <ChevronDown size={16} color={Colors.primary} />
        )}
      </TouchableOpacity>

      {showImport && (
        <View style={styles.importBox}>
          <Text style={styles.importHint}>
            Tempel hasil JSON dari AI di sini lalu tap Import
          </Text>
          <Text style={styles.importFormat}>
            Format: {`[{"question":"...","options":["A","B","C","D"],"answer":"A"}]`}
          </Text>
          <TextInput
            value={importJson}
            onChangeText={setImportJson}
            style={[styles.input, { height: 140, textAlignVertical: "top" }]}
            placeholder={`[\n  {\n    "question": "...",\n    "options": ["A","B","C","D"],\n    "answer": "A"\n  }\n]`}
            placeholderTextColor={Colors.textMuted}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Button
            label="Import Soal"
            onPress={handleImportJson}
            style={{ borderRadius: 14, marginTop: 4 }}
          />
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>atau tambah manual</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* ── MANUAL FORM ── */}
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Pertanyaan</Text>
          <TextInput
            placeholder="Contoh: Apa yang dikembalikan useState?"
            value={question}
            onChangeText={setQuestion}
            style={[styles.input, { height: 80, textAlignVertical: "top" }]}
            placeholderTextColor={Colors.textMuted}
            multiline
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Gambar Soal (opsional)</Text>
          <TouchableOpacity
            onPress={pickImage}
            style={styles.imagePicker}
            activeOpacity={0.75}
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <ImagePlus size={28} color={Colors.textMuted} />
                <Text style={styles.imagePlaceholderText}>
                  Tap untuk upload gambar soal
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {imageUri && (
            <TouchableOpacity onPress={() => setImageUri(null)} style={styles.removeImage}>
              <Text style={styles.removeImageText}>Hapus gambar</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.fieldLabel}>Pilihan Jawaban</Text>
        <Text style={styles.fieldHint}>
          Tap salah satu pilihan untuk menandai sebagai jawaban benar
        </Text>
        {options.map((opt, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => setCorrectOption(idx)}
            style={[
              styles.optionRow,
              correctOption === idx && styles.optionRowActive,
            ]}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.optionBadge,
                correctOption === idx && styles.optionBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.optionBadgeText,
                  correctOption === idx && { color: Colors.white },
                ]}
              >
                {String.fromCharCode(65 + idx)}
              </Text>
            </View>
            <TextInput
              placeholder={`Pilihan ${String.fromCharCode(65 + idx)}`}
              value={opt}
              onChangeText={(text) => {
                const updated = [...options];
                updated[idx] = text;
                setOptions(updated);
              }}
              style={styles.optionInput}
              placeholderTextColor={Colors.textMuted}
            />
          </TouchableOpacity>
        ))}

        <Button
          label="Tambah Soal"
          loading={loading}
          onPress={handleSave}
          size="lg"
          style={{ borderRadius: 18 }}
        />
      </View>

      {/* ── EXISTING QUIZZES ── */}
      {existing.length > 0 && (
        <View style={styles.existingSection}>
          <Text style={styles.sectionTitle}>
            Soal yang Ada ({existing.length})
          </Text>
          {existing.map((q, i) => (
            <View key={q.id} style={styles.questionRow}>
              {q.image && (
                <Image
                  source={{ uri: q.image }}
                  style={styles.cardThumb}
                  resizeMode="cover"
                />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.questionNum}>Soal {i + 1}</Text>
                <Text style={styles.questionText}>{q.question}</Text>
                <Text style={styles.questionAnswer}>✓ {q.answer}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert("Hapus", "Hapus soal ini?", [
                    { text: "Batal", style: "cancel" },
                    {
                      text: "Hapus",
                      style: "destructive",
                      onPress: () => handleDelete(q.id),
                    },
                  ]);
                }}
                style={styles.deleteBtn}
              >
                <Trash2 size={16} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  headerTitle: { fontSize: 22, fontWeight: "900", color: Colors.dark },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  count: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: "600",
    marginBottom: 16,
  },

  // AI Card
  aiCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
    marginBottom: 12,
    overflow: "hidden",
  },
  aiCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  aiCardLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  aiIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  aiCardTitle: { fontSize: 14, fontWeight: "800", color: Colors.dark },
  aiCardSub: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: "500",
    marginTop: 1,
  },
  aiCardBody: {
    paddingHorizontal: 14,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 14,
    gap: 6,
  },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: { fontSize: 11, fontWeight: "900", color: Colors.primary },
  stepLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: "600", flex: 1 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 4,
  },
  aiInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
  },
  countRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
    alignItems: "center",
    flexWrap: "wrap",
  },
  countBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  countBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  countBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  countBtnTextActive: { color: Colors.white },
  countInput: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    fontWeight: "700",
    color: Colors.dark,
    borderWidth: 1.5,
    borderColor: Colors.border,
    width: 72,
  },
  diffRow: { flexDirection: "row", gap: 6, marginTop: 4 },
  diffBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
  },
  diffBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  diffBtnText: { fontSize: 12, fontWeight: "700", color: Colors.textSecondary },
  diffBtnTextActive: { color: Colors.white },
  copyPromptBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 12,
  },
  copyPromptBtnDone: { backgroundColor: Colors.success },
  copyPromptBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.white,
  },
  stepsGuide: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    gap: 0,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  promptPreview: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  promptPreviewLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.primary,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  promptPreviewText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "500",
    lineHeight: 16,
  },

  // Import section
  importToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    paddingHorizontal: 14,
    backgroundColor: Colors.white,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  importToggleLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  importToggleText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },
  importBox: {
    gap: 8,
    marginBottom: 16,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  importHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  importFormat: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: "500",
    fontStyle: "italic",
  },

  // Divider
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Manual Form
  form: { gap: 12, marginBottom: 20 },
  field: { gap: 6 },
  fieldHint: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "500",
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.dark,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  imagePicker: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: "dashed",
    backgroundColor: Colors.background,
  },
  imagePreview: { width: "100%", height: 180, borderRadius: 14 },
  imagePlaceholder: {
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  imagePlaceholderText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: "600",
  },
  removeImage: { alignSelf: "flex-end", marginTop: 4 },
  removeImageText: { fontSize: 12, color: Colors.danger, fontWeight: "700" },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingLeft: 12,
    paddingRight: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  optionRowActive: {
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
  },
  optionBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionBadgeActive: { backgroundColor: Colors.success, borderColor: Colors.success },
  optionBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.textSecondary,
  },
  optionInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark,
  },

  // Existing
  existingSection: { marginTop: 8 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: Colors.dark,
    marginBottom: 12,
  },
  questionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  cardThumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: Colors.background,
  },
  questionNum: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.textMuted,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  questionText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.dark,
    marginBottom: 4,
  },
  questionAnswer: { fontSize: 13, color: Colors.success, fontWeight: "600" },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.dangerLight,
    alignItems: "center",
    justifyContent: "center",
  },
});
