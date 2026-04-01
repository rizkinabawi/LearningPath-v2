import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
  Modal,
  ScrollView,
  Linking,
  KeyboardAvoidingView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import {
  X,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  Code2,
  Paperclip,
  Eye,
  ExternalLink,
  BookOpen,
  Clock,
} from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import {
  getStudyMaterials,
  saveStudyMaterial,
  deleteStudyMaterial,
  getLessons,
  generateId,
  type StudyMaterial,
} from "@/utils/storage";
import Colors from "@/constants/colors";
import { toast } from "@/components/Toast";

const MATERIAL_DIR =
  ((FileSystem as any).documentDirectory ?? "") + "study-materials/";

const ensureDir = async () => {
  if (Platform.OS === "web") return;
  const info = await FileSystem.getInfoAsync(MATERIAL_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(MATERIAL_DIR, { intermediates: true });
  }
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
};

type TabType = "text" | "html" | "file";

const TYPE_INFO: Record<TabType, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  text: {
    icon: <FileText size={14} color={Colors.primary} />,
    label: "Teks",
    color: Colors.primary,
    bg: Colors.primaryLight,
  },
  html: {
    icon: <Code2 size={14} color={Colors.purple} />,
    label: "HTML",
    color: Colors.purple,
    bg: Colors.purpleLight,
  },
  file: {
    icon: <Paperclip size={14} color={Colors.amber} />,
    label: "File",
    color: Colors.amber,
    bg: Colors.amberLight,
  },
};

export default function StudyMaterialScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [lessonName, setLessonName] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("text");
  const [editMat, setEditMat] = useState<StudyMaterial | null>(null);

  // Form state
  const [matTitle, setMatTitle] = useState("");
  const [matContent, setMatContent] = useState("");
  const [pickedFile, setPickedFile] = useState<{
    name: string; uri: string; size?: number; mimeType?: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const safeLesson = Array.isArray(lessonId) ? lessonId[0] : (lessonId ?? "");

  useEffect(() => {
    loadData();
  }, [safeLesson]);

  const loadData = async () => {
    const data = await getStudyMaterials(safeLesson);
    setMaterials(
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    );
    const lessons = await getLessons();
    const lesson = lessons.find((l) => l.id === safeLesson);
    if (lesson) setLessonName(lesson.name);
  };

  const openAdd = () => {
    setEditMat(null);
    setMatTitle("");
    setMatContent("");
    setPickedFile(null);
    setActiveTab("text");
    setShowModal(true);
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      setPickedFile({
        name: asset.name,
        uri: asset.uri,
        size: asset.size,
        mimeType: asset.mimeType ?? undefined,
      });
    } catch {
      toast.error("Gagal memilih file");
    }
  };

  const handleSave = async () => {
    if (!matTitle.trim()) {
      toast.error("Judul materi tidak boleh kosong");
      return;
    }
    if (activeTab !== "file" && !matContent.trim()) {
      toast.error("Isi konten materi");
      return;
    }
    if (activeTab === "file" && !pickedFile) {
      toast.error("Pilih file terlebih dahulu");
      return;
    }

    const safeId = Array.isArray(lessonId) ? lessonId[0] : (lessonId ?? "");

    setSaving(true);
    try {
      let filePath: string | undefined;
      let fileName: string | undefined;
      let fileSize: number | undefined;
      let fileMime: string | undefined;

      if (activeTab === "file" && pickedFile) {
        fileName = pickedFile.name;
        fileSize = pickedFile.size;
        fileMime = pickedFile.mimeType;

        if (Platform.OS !== "web") {
          try {
            await ensureDir();
            const ext = pickedFile.name.split(".").pop() ?? "bin";
            const destName = `${generateId()}.${ext}`;
            const dest = MATERIAL_DIR + destName;
            await FileSystem.copyAsync({ from: pickedFile.uri, to: dest });
            filePath = dest;
          } catch {
            // Fall back to original picker URI (still accessible from cache)
            filePath = pickedFile.uri;
          }
        } else {
          filePath = pickedFile.uri;
        }
      }

      const mat: StudyMaterial = {
        id: editMat?.id ?? generateId(),
        lessonId: safeId,
        title: matTitle.trim(),
        type: activeTab,
        content: activeTab === "file" ? "" : matContent.trim(),
        filePath,
        fileName,
        fileSize,
        fileMime,
        createdAt: editMat?.createdAt ?? new Date().toISOString(),
      };
      await saveStudyMaterial(mat);
      setShowModal(false);
      toast.success("Materi berhasil disimpan!");
      loadData();
    } catch (e: any) {
      toast.error(`Gagal menyimpan: ${e?.message ?? "Error tidak diketahui"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (mat: StudyMaterial) => {
    Alert.alert("Hapus Materi", `Hapus "${mat.title}"?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          await deleteStudyMaterial(mat.id);
          toast.info("Materi dihapus");
          loadData();
        },
      },
    ]);
  };

  const handleOpenFile = async (mat: StudyMaterial) => {
    if (!mat.filePath) return;
    try {
      if (Platform.OS !== "web") {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(mat.filePath, {
            dialogTitle: mat.title,
            mimeType: mat.fileMime,
            UTI: mat.fileMime,
          });
        } else {
          toast.error("Sharing tidak tersedia di perangkat ini");
        }
      } else {
        await Linking.openURL(mat.filePath);
      }
    } catch {
      toast.error("Tidak bisa membuka file");
    }
  };

  const handlePreviewHtml = async (mat: StudyMaterial) => {
    if (Platform.OS === "web") {
      const win = window.open();
      if (win) {
        win.document.write(mat.content);
        win.document.close();
      }
    } else {
      // Write HTML to temp file and open in browser
      try {
        const tmpPath = ((FileSystem as any).cacheDirectory ?? "") + "preview.html";
        await (FileSystem as any).writeAsStringAsync(tmpPath, mat.content);
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(tmpPath, {
            mimeType: "text/html",
            dialogTitle: mat.title,
            UTI: "public.html",
          });
        }
      } catch {
        toast.error("Tidak bisa preview HTML di perangkat ini");
      }
    }
  };

  const TABS: { key: TabType; label: string }[] = [
    { key: "text", label: "Teks" },
    { key: "html", label: "HTML" },
    { key: "file", label: "Upload File" },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === "web" ? 60 : insets.top + 12 },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <X size={20} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSub} numberOfLines={1}>
            {lessonName}
          </Text>
          <Text style={styles.headerTitle}>Materi Belajar</Text>
        </View>
        <TouchableOpacity onPress={openAdd} style={styles.addBtn}>
          <Plus size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      >
        {materials.length === 0 ? (
          <TouchableOpacity
            style={styles.emptyCard}
            onPress={openAdd}
            activeOpacity={0.85}
          >
            <BookOpen size={40} color={Colors.purple} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Belum Ada Materi</Text>
            <Text style={styles.emptySub}>
              Tambah teks, HTML, atau upload file PPT/PDF/DOC
            </Text>
          </TouchableOpacity>
        ) : (
          materials.map((mat) => {
            const isOpen = !!expanded[mat.id];
            const info = TYPE_INFO[mat.type];
            return (
              <View key={mat.id} style={styles.matCard}>
                <TouchableOpacity
                  style={styles.matHeader}
                  onPress={() =>
                    setExpanded((p) => ({ ...p, [mat.id]: !p[mat.id] }))
                  }
                  activeOpacity={0.75}
                >
                  <View style={[styles.typeTag, { backgroundColor: info.bg }]}>
                    {info.icon}
                    <Text style={[styles.typeTagText, { color: info.color }]}>
                      {info.label}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.matTitle}>{mat.title}</Text>
                    <View style={styles.matMeta}>
                      <Clock size={10} color={Colors.textMuted} />
                      <Text style={styles.matDate}>{formatDate(mat.createdAt)}</Text>
                      {mat.type === "file" && mat.fileSize && (
                        <Text style={styles.matDate}>
                          · {formatBytes(mat.fileSize)}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.matActions}>
                    <TouchableOpacity
                      onPress={() => handleDelete(mat)}
                      style={[styles.iconBtn, styles.iconBtnDanger]}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={13} color={Colors.danger} />
                    </TouchableOpacity>
                    {isOpen ? (
                      <ChevronUp size={16} color={Colors.textMuted} />
                    ) : (
                      <ChevronDown size={16} color={Colors.textMuted} />
                    )}
                  </View>
                </TouchableOpacity>

                {isOpen && (
                  <View style={styles.matBody}>
                    {mat.type === "text" && (
                      <ScrollView
                        style={styles.textScroll}
                        nestedScrollEnabled
                      >
                        <Text style={styles.matText}>{mat.content}</Text>
                      </ScrollView>
                    )}

                    {mat.type === "html" && (
                      <View style={styles.htmlBox}>
                        <View style={styles.htmlPreviewBar}>
                          <Code2 size={13} color={Colors.purple} />
                          <Text style={styles.htmlPreviewLabel}>Konten HTML</Text>
                          <TouchableOpacity
                            style={styles.previewBtn}
                            onPress={() => handlePreviewHtml(mat)}
                          >
                            <Eye size={13} color={Colors.white} />
                            <Text style={styles.previewBtnText}>Buka Preview</Text>
                          </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.htmlCodeScroll} nestedScrollEnabled>
                          <Text style={styles.htmlCode}>{mat.content}</Text>
                        </ScrollView>
                      </View>
                    )}

                    {mat.type === "file" && (
                      <View style={styles.fileBox}>
                        <View style={styles.fileInfo}>
                          <Paperclip size={20} color={Colors.amber} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.fileName}>{mat.fileName}</Text>
                            {mat.fileSize && (
                              <Text style={styles.fileSize}>
                                {formatBytes(mat.fileSize)}
                              </Text>
                            )}
                          </View>
                        </View>
                        <TouchableOpacity
                          style={styles.openFileBtn}
                          onPress={() => handleOpenFile(mat)}
                        >
                          <ExternalLink size={14} color={Colors.white} />
                          <Text style={styles.openFileBtnText}>
                            Buka / Bagikan File
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </KeyboardAwareScrollViewCompat>

      {/* Add Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalBox,
              { paddingBottom: Math.max(insets.bottom, 24) + 16 },
            ]}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Tambah Materi</Text>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 440 }}
              contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
            >
              {/* Type Tabs */}
              <View style={styles.tabRow}>
                {TABS.map((t) => (
                  <TouchableOpacity
                    key={t.key}
                    style={[
                      styles.tabBtn,
                      activeTab === t.key && styles.tabBtnActive,
                    ]}
                    onPress={() => {
                      setActiveTab(t.key);
                      setMatContent("");
                      setPickedFile(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.tabBtnText,
                        activeTab === t.key && styles.tabBtnTextActive,
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Judul Materi</Text>
              <TextInput
                value={matTitle}
                onChangeText={setMatTitle}
                placeholder="Judul materi..."
                style={styles.input}
                placeholderTextColor={Colors.textMuted}
                autoFocus
              />

              {activeTab === "text" && (
                <>
                  <Text style={[styles.fieldLabel, { marginTop: 6 }]}>
                    Isi Materi (Teks)
                  </Text>
                  <TextInput
                    value={matContent}
                    onChangeText={setMatContent}
                    placeholder="Tulis materi pelajaran di sini..."
                    style={[styles.input, styles.textArea]}
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    textAlignVertical="top"
                  />
                </>
              )}

              {activeTab === "html" && (
                <>
                  <Text style={[styles.fieldLabel, { marginTop: 6 }]}>
                    Kode HTML
                  </Text>
                  <Text style={styles.fieldHint}>
                    Salin HTML dari mana saja (presentasi, artikel, dokumen)
                  </Text>
                  <TextInput
                    value={matContent}
                    onChangeText={setMatContent}
                    placeholder={"<h1>Judul</h1>\n<p>Isi materi...</p>"}
                    style={[styles.input, styles.textArea, styles.codeInput]}
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    textAlignVertical="top"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </>
              )}

              {activeTab === "file" && (
                <>
                  <Text style={[styles.fieldLabel, { marginTop: 6 }]}>
                    Upload File (PPT, PDF, DOC, dll)
                  </Text>
                  {pickedFile ? (
                    <View style={styles.pickedFile}>
                      <Paperclip size={16} color={Colors.amber} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pickedFileName}>{pickedFile.name}</Text>
                        {pickedFile.size && (
                          <Text style={styles.pickedFileSize}>
                            {formatBytes(pickedFile.size)}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity onPress={() => setPickedFile(null)}>
                        <X size={16} color={Colors.danger} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.uploadBtn}
                      onPress={pickFile}
                      activeOpacity={0.8}
                    >
                      <Paperclip size={20} color={Colors.amber} />
                      <Text style={styles.uploadBtnText}>Pilih File</Text>
                      <Text style={styles.uploadBtnHint}>PPT, PDF, DOC, DOCX, dll</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </ScrollView>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                style={styles.saveBtn}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>
                  {saving ? "Menyimpan..." : "Simpan"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.purple,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerSub: {
    fontSize: 11, color: "rgba(255,255,255,0.6)",
    fontWeight: "700", textTransform: "uppercase",
  },
  headerTitle: { fontSize: 22, fontWeight: "900", color: Colors.white },
  addBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  listContent: { padding: 16, paddingBottom: 40, gap: 10 },
  emptyCard: {
    backgroundColor: Colors.white, borderRadius: 20, padding: 36,
    alignItems: "center", gap: 10, borderWidth: 1.5,
    borderColor: Colors.purpleLight, borderStyle: "dashed", marginTop: 24,
  },
  emptyTitle: { fontSize: 17, fontWeight: "900", color: Colors.dark },
  emptySub: { fontSize: 13, color: Colors.textMuted, fontWeight: "500", textAlign: "center" },
  matCard: {
    backgroundColor: Colors.white, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border, overflow: "hidden",
  },
  matHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  typeTag: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  typeTagText: { fontSize: 11, fontWeight: "800" },
  matTitle: { fontSize: 14, fontWeight: "800", color: Colors.dark },
  matMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  matDate: { fontSize: 10, color: Colors.textMuted, fontWeight: "500" },
  matActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  iconBtn: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  iconBtnDanger: { backgroundColor: Colors.dangerLight },
  matBody: {
    borderTopWidth: 1, borderTopColor: Colors.border,
    padding: 14, backgroundColor: Colors.background,
  },
  textScroll: { maxHeight: 240 },
  matText: {
    fontSize: 14, color: Colors.textSecondary,
    fontWeight: "500", lineHeight: 22,
  },
  htmlBox: { gap: 8 },
  htmlPreviewBar: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.purpleLight, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8,
  },
  htmlPreviewLabel: { flex: 1, fontSize: 12, fontWeight: "700", color: Colors.purple },
  previewBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: Colors.purple, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  previewBtnText: { fontSize: 11, fontWeight: "800", color: Colors.white },
  htmlCodeScroll: { maxHeight: 180, backgroundColor: "#1E1E2E", borderRadius: 10, padding: 10 },
  htmlCode: { fontSize: 11, color: "#A9B1D6", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", lineHeight: 18 },
  fileBox: { gap: 10 },
  fileInfo: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.amberLight, borderRadius: 12, padding: 12 },
  fileName: { fontSize: 13, fontWeight: "700", color: Colors.dark },
  fileSize: { fontSize: 11, color: Colors.textMuted, fontWeight: "500" },
  openFileBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.amber, borderRadius: 12, paddingVertical: 12,
  },
  openFileBtnText: { fontSize: 13, fontWeight: "800", color: Colors.white },
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(10,22,40,0.55)", justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 12, gap: 8,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: "center", marginBottom: 8,
  },
  modalTitle: { fontSize: 20, fontWeight: "900", color: Colors.dark, marginBottom: 4 },
  tabRow: { flexDirection: "row", gap: 6, marginBottom: 4 },
  tabBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 10,
    backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: "center",
  },
  tabBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabBtnText: { fontSize: 12, fontWeight: "700", color: Colors.textSecondary },
  tabBtnTextActive: { color: Colors.white },
  fieldLabel: {
    fontSize: 11, fontWeight: "800", color: Colors.textSecondary,
    textTransform: "uppercase", letterSpacing: 0.8,
  },
  fieldHint: { fontSize: 11, color: Colors.textMuted, fontWeight: "500" },
  input: {
    backgroundColor: Colors.background, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, fontWeight: "600", color: Colors.dark,
    borderWidth: 1.5, borderColor: Colors.border, marginTop: 6,
  },
  textArea: { height: 160, textAlignVertical: "top" },
  codeInput: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 12, backgroundColor: "#1E1E2E", color: "#A9B1D6",
    borderColor: "#3B3B5C",
  },
  uploadBtn: {
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.amber,
    borderStyle: "dashed", padding: 20, alignItems: "center", gap: 6,
    backgroundColor: Colors.amberLight, marginTop: 6,
  },
  uploadBtnText: { fontSize: 15, fontWeight: "800", color: Colors.amber },
  uploadBtnHint: { fontSize: 11, color: Colors.textMuted, fontWeight: "500" },
  pickedFile: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: Colors.amberLight, borderRadius: 12, padding: 12, marginTop: 6,
    borderWidth: 1, borderColor: Colors.amber,
  },
  pickedFileName: { fontSize: 13, fontWeight: "700", color: Colors.dark },
  pickedFileSize: { fontSize: 11, color: Colors.textMuted },
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 14, fontWeight: "700", color: Colors.textSecondary },
  saveBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 14,
    backgroundColor: Colors.primary, alignItems: "center",
  },
  saveBtnText: { fontSize: 14, fontWeight: "900", color: Colors.white },
});
