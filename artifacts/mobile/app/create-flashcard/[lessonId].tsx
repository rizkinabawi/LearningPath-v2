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
  X, Trash2, ChevronDown, ChevronUp, ImagePlus, Bot,
  Copy, Check, Download,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as Clipboard from "expo-clipboard";
import { Button } from "@/components/Button";
import {
  getFlashcards, saveFlashcard, deleteFlashcard,
  generateId, getLessons, type Flashcard,
} from "@/utils/storage";
import Colors from "@/constants/colors";
import { toast } from "@/components/Toast";

const IMAGE_DIR = (FileSystem.documentDirectory ?? "") + "flashcard-images/";

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

const buildFlashcardPrompt = (topic: string, count: number, difficulty: string) => {
  const diffLabel =
    difficulty === "easy"
      ? "mudah (untuk pemula)"
      : difficulty === "hard"
      ? "sulit (level lanjut)"
      : "sedang (level menengah)";

  return `Buatkan ${count} flashcard belajar tentang "${topic}" dengan tingkat kesulitan ${diffLabel}.

PENTING: Balas HANYA dengan array JSON murni. Jangan tambahkan teks, penjelasan, markdown, atau blok kode (\`\`\`). Langsung mulai dengan tanda [ dan akhiri dengan ].

Format JSON yang WAJIB digunakan (contoh):
[
  {
    "question": "Apa yang dimaksud dengan fotosintesis?",
    "answer": "Fotosintesis adalah proses di mana tumbuhan mengubah cahaya matahari, air, dan CO₂ menjadi glukosa dan oksigen menggunakan klorofil.",
    "tag": "biologi-dasar"
  }
]

ATURAN WAJIB — wajib diikuti untuk setiap kartu:
1. Field "question": string berisi pertanyaan atau konsep yang ingin diuji
2. Field "answer": string berisi jawaban lengkap dan jelas (boleh beberapa kalimat)
3. Field "tag": string kata kunci singkat tanpa spasi (gunakan tanda hubung jika perlu, contoh: "reaksi-kimia", "hukum-newton")
4. Tidak ada field lain selain "question", "answer", "tag"
5. Gunakan Bahasa Indonesia
6. Jawaban harus informatif dan edukatif, bukan sekadar satu kata
7. Topik: ${topic}`;
};

export default function CreateFlashcardScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [tag, setTag] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [existing, setExisting] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState("");

  // AI Prompt Builder state
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptTopic, setPromptTopic] = useState("");
  const [promptCount, setPromptCount] = useState("10");
  const [promptDifficulty, setPromptDifficulty] = useState("medium");
  const [promptCopied, setPromptCopied] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");

  useEffect(() => {
    (async () => {
      const data = await getFlashcards(lessonId);
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
    if (!question.trim() || !answer.trim()) {
      Alert.alert("Lengkapi Form", "Pertanyaan dan jawaban wajib diisi.");
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
    const card: Flashcard = {
      id,
      lessonId: lessonId ?? "",
      question: question.trim(),
      answer: answer.trim(),
      tag: tag.trim(),
      image: savedImage,
      createdAt: new Date().toISOString(),
    };
    await saveFlashcard(card);
    setExisting((prev) => [...prev, card]);
    setQuestion("");
    setAnswer("");
    setTag("");
    setImageUri(null);
    setLoading(false);
    toast.success("Flashcard berhasil ditambahkan!");
  };

  const handleDelete = async (id: string) => {
    await deleteFlashcard(id);
    setExisting((prev) => prev.filter((c) => c.id !== id));
    toast.info("Flashcard dihapus");
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
        // Dukung field: question/answer/tag (format baru)
        //           ATAU front/back (format lama PromptBuilder)
        const question = item.question ?? item.front ?? "";
        const answer = item.answer ?? item.back ?? "";
        const tag = item.tag ?? "";

        if (question && answer) {
          const card: Flashcard = {
            id: generateId(),
            lessonId: lessonId ?? "",
            question: String(question),
            answer: String(answer),
            tag: String(tag),
            createdAt: new Date().toISOString(),
          };
          await saveFlashcard(card);
          setExisting((prev) => [...prev, card]);
          count++;
        }
      }

      if (count === 0) {
        Alert.alert("Tidak Ada Data", "Tidak ada item yang valid ditemukan. Pastikan setiap item memiliki field question/answer.");
        return;
      }

      setImportJson("");
      setShowImport(false);
      toast.success(`${count} flashcard berhasil diimport!`);
    } catch {
      Alert.alert(
        "JSON Tidak Valid",
        'Format yang didukung:\n\n1. Flat array (disarankan):\n[{"question":"...","answer":"...","tag":"..."}]\n\n2. Wrapped format:\n{"items":[{"question":"...","answer":"..."}]}'
      );
    }
  };

  const handleGenerateAndCopyPrompt = async () => {
    if (!promptTopic.trim()) {
      toast.error("Isi topik materi terlebih dahulu");
      return;
    }
    const count = parseInt(promptCount) || 10;
    const prompt = buildFlashcardPrompt(promptTopic.trim(), count, promptDifficulty);
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
        <Text style={styles.headerTitle}>Tambah Flashcard</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <X size={20} color={Colors.dark} />
        </TouchableOpacity>
      </View>
      <Text style={styles.count}>{existing.length} kartu di pelajaran ini</Text>

      {/* ── AI PROMPT BUILDER ── */}
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
            <View style={{ flex: 1 }}>
              <Text style={styles.aiCardTitle}>Buat Flashcard dengan AI</Text>
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
            <View style={styles.stepRow}>
              <View style={styles.stepBadge}><Text style={styles.stepNum}>1</Text></View>
              <Text style={styles.stepLabel}>Isi detail flashcard yang ingin dibuat</Text>
            </View>

            <Text style={styles.fieldLabel}>Topik / Materi</Text>
            <TextInput
              value={promptTopic}
              onChangeText={setPromptTopic}
              placeholder="Contoh: Fotosintesis, Hukum Newton, React Hooks"
              style={styles.aiInput}
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Jumlah Kartu</Text>
            <View style={styles.countRow}>
              {["5", "10", "15", "20"].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.countBtn, promptCount === n && styles.countBtnActive]}
                  onPress={() => setPromptCount(n)}
                >
                  <Text style={[styles.countBtnText, promptCount === n && styles.countBtnTextActive]}>
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
                  style={[styles.diffBtn, promptDifficulty === d.key && styles.diffBtnActive]}
                  onPress={() => setPromptDifficulty(d.key)}
                >
                  <Text style={[styles.diffBtnText, promptDifficulty === d.key && styles.diffBtnTextActive]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Format reminder */}
            <View style={styles.formatBox}>
              <Text style={styles.formatLabel}>Format output yang dihasilkan:</Text>
              <Text style={styles.formatCode}>
                {`[{\n  "question": "Pertanyaan?",\n  "answer": "Jawaban lengkap",\n  "tag": "kata-kunci"\n}]`}
              </Text>
            </View>

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

            <View style={styles.stepsGuide}>
              <View style={styles.stepRow}>
                <View style={styles.stepBadge}><Text style={styles.stepNum}>2</Text></View>
                <Text style={styles.stepLabel}>
                  Tempel prompt ke{" "}
                  <Text style={{ fontWeight: "800", color: Colors.dark }}>ChatGPT / Gemini / AI lainnya</Text>
                </Text>
              </View>
              <View style={[styles.stepRow, { marginTop: 8 }]}>
                <View style={styles.stepBadge}><Text style={styles.stepNum}>3</Text></View>
                <Text style={styles.stepLabel}>
                  Salin hasil JSON dari AI → tempel di{" "}
                  <Text style={{ fontWeight: "800", color: Colors.primary }}>"Import JSON dari AI"</Text>
                  {" "}di bawah
                </Text>
              </View>
            </View>

            {generatedPrompt !== "" && (
              <View style={styles.promptPreview}>
                <Text style={styles.promptPreviewLabel}>Preview Prompt:</Text>
                <Text style={styles.promptPreviewText} numberOfLines={6}>
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
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
          <Text style={styles.importHint}>Tempel hasil JSON dari AI di sini lalu tap Import</Text>
          <Text style={styles.importFormat}>
            Format: {`[{"question":"...","answer":"...","tag":"..."}]`}
          </Text>
          <TextInput
            value={importJson}
            onChangeText={setImportJson}
            style={[styles.input, { height: 140, textAlignVertical: "top" }]}
            placeholder={`[\n  {\n    "question": "Apa itu...",\n    "answer": "Adalah...",\n    "tag": "kata-kunci"\n  }\n]`}
            placeholderTextColor={Colors.textMuted}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Button
            label="Import Flashcard"
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
            placeholder="Contoh: Apa itu JSX?"
            value={question}
            onChangeText={setQuestion}
            style={[styles.input, { height: 80, textAlignVertical: "top" }]}
            placeholderTextColor={Colors.textMuted}
            multiline
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Jawaban</Text>
          <TextInput
            placeholder="Contoh: JSX adalah ekstensi sintaks JavaScript..."
            value={answer}
            onChangeText={setAnswer}
            style={[styles.input, { height: 90, textAlignVertical: "top" }]}
            placeholderTextColor={Colors.textMuted}
            multiline
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Tag (opsional)</Text>
          <TextInput
            placeholder="Contoh: dasar, syntax"
            value={tag}
            onChangeText={setTag}
            style={styles.input}
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Gambar (opsional)</Text>
          <TouchableOpacity onPress={pickImage} style={styles.imagePicker} activeOpacity={0.75}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <ImagePlus size={28} color={Colors.textMuted} />
                <Text style={styles.imagePlaceholderText}>Tap untuk upload gambar</Text>
              </View>
            )}
          </TouchableOpacity>
          {imageUri && (
            <TouchableOpacity onPress={() => setImageUri(null)} style={styles.removeImage}>
              <Text style={styles.removeImageText}>Hapus gambar</Text>
            </TouchableOpacity>
          )}
        </View>

        <Button
          label="Tambah Flashcard"
          loading={loading}
          onPress={handleSave}
          size="lg"
          style={{ borderRadius: 18 }}
        />
      </View>

      {/* ── EXISTING CARDS ── */}
      {existing.length > 0 && (
        <View style={styles.existingSection}>
          <Text style={styles.sectionTitle}>Flashcard yang Ada ({existing.length})</Text>
          {existing.map((card) => (
            <View key={card.id} style={styles.cardRow}>
              {card.image && (
                <Image source={{ uri: card.image }} style={styles.cardThumb} resizeMode="cover" />
              )}
              <View style={{ flex: 1 }}>
                {card.tag ? <Text style={styles.cardTag}>{card.tag}</Text> : null}
                <Text style={styles.cardQ}>{card.question}</Text>
                <Text style={styles.cardA}>{card.answer}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert("Hapus", "Hapus flashcard ini?", [
                    { text: "Batal", style: "cancel" },
                    { text: "Hapus", style: "destructive", onPress: () => handleDelete(card.id) },
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
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 4,
  },
  headerTitle: { fontSize: 22, fontWeight: "900", color: Colors.dark },
  closeBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.background, alignItems: "center",
    justifyContent: "center",
  },
  count: { fontSize: 13, color: Colors.textMuted, fontWeight: "600", marginBottom: 16 },

  // AI Card
  aiCard: {
    backgroundColor: Colors.white, borderRadius: 18,
    borderWidth: 1.5, borderColor: Colors.primaryLight,
    marginBottom: 12, overflow: "hidden",
  },
  aiCardHeader: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", padding: 14,
  },
  aiCardLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  aiIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center",
  },
  aiCardTitle: { fontSize: 14, fontWeight: "800", color: Colors.dark },
  aiCardSub: { fontSize: 11, color: Colors.textMuted, fontWeight: "500", marginTop: 1 },
  aiCardBody: {
    paddingHorizontal: 14, paddingBottom: 16,
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingTop: 14, gap: 6,
  },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepBadge: {
    width: 22, height: 22, borderRadius: 7,
    backgroundColor: Colors.primaryLight,
    alignItems: "center", justifyContent: "center",
  },
  stepNum: { fontSize: 11, fontWeight: "900", color: Colors.primary },
  stepLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: "600", flex: 1 },
  fieldLabel: {
    fontSize: 11, fontWeight: "800", color: Colors.textSecondary,
    textTransform: "uppercase", letterSpacing: 1,
  },
  aiInput: {
    backgroundColor: Colors.background, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, fontWeight: "600", color: Colors.dark,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  countRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  countBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border,
  },
  countBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  countBtnText: { fontSize: 13, fontWeight: "700", color: Colors.textSecondary },
  countBtnTextActive: { color: Colors.white },
  countInput: {
    flex: 1, minWidth: 70, paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 10, backgroundColor: Colors.background,
    borderWidth: 1.5, borderColor: Colors.border,
    fontSize: 13, fontWeight: "600", color: Colors.dark,
  },
  diffRow: { flexDirection: "row", gap: 6 },
  diffBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 10,
    backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: "center",
  },
  diffBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  diffBtnText: { fontSize: 12, fontWeight: "700", color: Colors.textSecondary },
  diffBtnTextActive: { color: Colors.white },
  formatBox: {
    backgroundColor: Colors.background, borderRadius: 12,
    padding: 10, borderWidth: 1, borderColor: Colors.border, gap: 4,
  },
  formatLabel: { fontSize: 10, fontWeight: "800", color: Colors.textMuted, textTransform: "uppercase" },
  formatCode: {
    fontSize: 11, color: Colors.dark, fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    lineHeight: 17,
  },
  copyPromptBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: Colors.primary,
    borderRadius: 12, paddingVertical: 13, marginTop: 4,
  },
  copyPromptBtnDone: { backgroundColor: Colors.success },
  copyPromptBtnText: { fontSize: 14, fontWeight: "900", color: Colors.white },
  stepsGuide: { backgroundColor: Colors.background, borderRadius: 12, padding: 12, gap: 0 },
  promptPreview: {
    backgroundColor: "#1E1E2E", borderRadius: 10, padding: 12,
  },
  promptPreviewLabel: {
    fontSize: 10, fontWeight: "800", color: "#A9B1D6",
    textTransform: "uppercase", marginBottom: 6,
  },
  promptPreviewText: {
    fontSize: 11, color: "#CDD6F4",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", lineHeight: 17,
  },

  // Import
  importToggle: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 14, borderTopWidth: 1, borderTopColor: Colors.border, marginBottom: 8,
  },
  importToggleText: { fontSize: 14, fontWeight: "700", color: Colors.primary },
  importBox: { gap: 8, marginBottom: 20 },
  importHint: { fontSize: 12, color: Colors.textMuted, fontWeight: "500", fontStyle: "italic" },
  importFormat: { fontSize: 11, color: Colors.textSecondary, fontWeight: "600", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },

  // Divider
  divider: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 12, color: Colors.textMuted, fontWeight: "600" },

  // Manual Form
  form: { gap: 14, marginBottom: 20 },
  field: { gap: 6 },
  input: {
    backgroundColor: Colors.white, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, fontWeight: "600", color: Colors.dark,
    borderWidth: 1, borderColor: Colors.border,
  },
  imagePicker: {
    borderRadius: 16, overflow: "hidden",
    borderWidth: 1.5, borderColor: Colors.border,
    borderStyle: "dashed", backgroundColor: Colors.background,
  },
  imagePreview: { width: "100%", height: 180, borderRadius: 14 },
  imagePlaceholder: { height: 100, alignItems: "center", justifyContent: "center", gap: 8 },
  imagePlaceholderText: { fontSize: 13, color: Colors.textMuted, fontWeight: "600" },
  removeImage: { alignSelf: "flex-end", marginTop: 4 },
  removeImageText: { fontSize: 12, color: Colors.danger, fontWeight: "700" },

  // Existing
  existingSection: { marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: Colors.dark, marginBottom: 12 },
  cardRow: {
    flexDirection: "row", alignItems: "flex-start",
    backgroundColor: Colors.white, borderRadius: 16,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.border, gap: 12,
  },
  cardThumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: Colors.background },
  cardTag: {
    fontSize: 10, fontWeight: "800", color: Colors.primary,
    textTransform: "uppercase", letterSpacing: 1, marginBottom: 4,
  },
  cardQ: { fontSize: 14, fontWeight: "700", color: Colors.dark, marginBottom: 4 },
  cardA: { fontSize: 13, color: Colors.textSecondary, fontWeight: "500" },
  deleteBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: Colors.dangerLight,
    alignItems: "center", justifyContent: "center",
  },
});
