import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getLearningPaths, getModules, getLessons,
  getFlashcards, getQuizzes, getNotes, getStudyMaterials,
  saveLearningPath, saveModule, saveLesson, deleteLearningPath,
  generateId, type LearningPath, type Module, type Lesson,
} from "@/utils/storage";
import Colors from "@/constants/colors";

const GRAD_PALETTE: [string, string][] = [
  ["#4A9EFF", "#6C63FF"],
  ["#FF6B6B", "#FF9500"],
  ["#0AD3C1", "#00B4D8"],
  ["#7C3AED", "#A855F7"],
  ["#059669", "#10B981"],
];

type ModCounts = { fc: number; qz: number; nt: number; mt: number };

export default function LearnPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [activePath, setActivePath] = useState<LearningPath | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [counts, setCounts] = useState<Record<string, ModCounts>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [showNewPath, setShowNewPath] = useState(false);
  const [showNewModule, setShowNewModule] = useState(false);
  const [showNewLesson, setShowNewLesson] = useState(false);
  const [pathName, setPathName] = useState("");
  const [pathDesc, setPathDesc] = useState("");
  const [modName, setModName] = useState("");
  const [lessonName, setLessonName] = useState("");
  const [lessonDesc, setLessonDesc] = useState("");
  const [targetMod, setTargetMod] = useState<string | null>(null);

  const loadPaths = async () => {
    const data = await getLearningPaths();
    setPaths(data);
    if (data.length > 0 && !activePath) setActivePath(data[0]);
  };

  const loadModules = async () => {
    if (!activePath) return;
    const mods = (await getModules(activePath.id)).sort((a, b) => a.order - b.order);
    setModules(mods);
    const lMap: Record<string, Lesson[]> = {};
    const cMap: Record<string, ModCounts> = {};
    for (const mod of mods) {
      const ls = await getLessons(mod.id);
      lMap[mod.id] = ls.sort((a, b) => a.order - b.order);
      let fc = 0, qz = 0, nt = 0, mt = 0;
      for (const l of ls) {
        fc += (await getFlashcards(l.id)).length;
        qz += (await getQuizzes(l.id)).length;
        nt += (await getNotes(l.id)).length;
        mt += (await getStudyMaterials(l.id)).length;
      }
      cMap[mod.id] = { fc, qz, nt, mt };
    }
    setLessons(lMap);
    setCounts(cMap);
  };

  useFocusEffect(useCallback(() => { loadPaths(); }, []));
  useEffect(() => { if (activePath) loadModules(); }, [activePath]);

  const createPath = async () => {
    if (!pathName.trim()) return;
    const p: LearningPath = {
      id: generateId(), name: pathName.trim(),
      description: pathDesc.trim(), userId: "local",
      createdAt: new Date().toISOString(),
    };
    await saveLearningPath(p);
    setPathName(""); setPathDesc(""); setShowNewPath(false);
    const updated = await getLearningPaths();
    setPaths(updated); setActivePath(p);
  };

  const createModule = async () => {
    if (!modName.trim() || !activePath) return;
    const m: Module = {
      id: generateId(), pathId: activePath.id,
      name: modName.trim(), description: "",
      order: modules.length, createdAt: new Date().toISOString(),
    };
    await saveModule(m);
    setModName(""); setShowNewModule(false);
    loadModules();
  };

  const createLesson = async () => {
    if (!lessonName.trim() || !targetMod) return;
    const l: Lesson = {
      id: generateId(), moduleId: targetMod,
      name: lessonName.trim(), description: lessonDesc.trim(),
      order: (lessons[targetMod] ?? []).length,
      createdAt: new Date().toISOString(),
    };
    await saveLesson(l);
    setLessonName(""); setLessonDesc(""); setShowNewLesson(false);
    loadModules();
  };

  return (
    <View style={styles.container}>
      {/* GRADIENT HEADER */}
      <LinearGradient
        colors={["#4C6FFF", "#7C47FF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGrad, { paddingTop: Platform.OS === "web" ? 60 : insets.top + 12 }]}
      >
        <View style={styles.hdot1} />
        <View style={styles.hdot2} />
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerSub}>Kurikulum</Text>
            <Text style={styles.headerTitle}>My Courses</Text>
          </View>
          <TouchableOpacity onPress={() => setShowNewPath(true)} style={styles.addBtn} activeOpacity={0.8}>
            <LinearGradient colors={["#4A9EFF", "#6C63FF"]} style={styles.addGrad}>
              <Feather name="plus" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {paths.length > 0 && (
          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pathTabsContent}
            style={styles.pathTabsScroll}
          >
            {paths.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => setActivePath(p)}
                onLongPress={() => Alert.alert("Hapus", `Hapus "${p.name}"?`, [
                  { text: "Batal", style: "cancel" },
                  { text: "Hapus", style: "destructive", onPress: async () => {
                    await deleteLearningPath(p.id);
                    const u = await getLearningPaths();
                    setPaths(u); setActivePath(u[0] ?? null);
                  }},
                ])}
                style={[styles.pathTab, activePath?.id === p.id && styles.pathTabActive]}
                activeOpacity={0.7}
              >
                {activePath?.id === p.id && <View style={styles.pathTabDot} />}
                <Text style={[styles.pathTabText, activePath?.id === p.id && styles.pathTabTextActive]} numberOfLines={1}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {paths.length === 0 && (
          <TouchableOpacity onPress={() => setShowNewPath(true)} activeOpacity={0.85}>
            <LinearGradient colors={["#4A9EFF", "#6C63FF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.emptyGrad}>
              <View style={styles.hdot1} /><View style={styles.hdot2} />
              <Feather name="plus-circle" size={36} color="rgba(255,255,255,0.9)" />
              <Text style={styles.emptyGradTitle}>Buat Kursus Pertama</Text>
              <Text style={styles.emptyGradSub}>Tap untuk membuat jalur belajarmu</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {modules.map((mod, mi) => {
          const isExpanded = !!expanded[mod.id];
          const modLessons = lessons[mod.id] ?? [];
          const cnt = counts[mod.id] ?? { fc: 0, qz: 0, nt: 0, mt: 0 };
          const grad = GRAD_PALETTE[mi % GRAD_PALETTE.length];

          return (
            <View key={mod.id} style={styles.moduleCard}>
              <TouchableOpacity
                onPress={() => setExpanded((p) => ({ ...p, [mod.id]: !p[mod.id] }))}
                style={styles.moduleHeader}
                activeOpacity={0.7}
              >
                <LinearGradient colors={grad} style={styles.modIconGrad}>
                  <Text style={{ fontSize: 16 }}>
                    {["📘","🎨","🌐","🧠","⚗️"][mi % 5]}
                  </Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={styles.moduleName}>{mod.name}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.moduleMetaRow}>
                      <View style={styles.metaChip}><Text style={styles.metaChipText}>{modLessons.length} Pelajaran</Text></View>
                      <View style={styles.metaChip}><Text style={styles.metaChipText}>{cnt.fc} Kartu</Text></View>
                      <View style={styles.metaChip}><Text style={styles.metaChipText}>{cnt.qz} Quiz</Text></View>
                      <View style={[styles.metaChip, { backgroundColor: "#EEF0FF" }]}><Text style={[styles.metaChipText, { color: Colors.primary }]}>{cnt.nt} Catatan</Text></View>
                      <View style={[styles.metaChip, { backgroundColor: Colors.purpleLight }]}><Text style={[styles.metaChipText, { color: Colors.purple }]}>{cnt.mt} Materi</Text></View>
                    </View>
                  </ScrollView>
                </View>
                <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color={Colors.textMuted} />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.lessonList}>
                  {modLessons.map((lesson, li) => (
                    <View key={lesson.id} style={styles.lessonRow}>
                      <LinearGradient colors={grad} style={styles.lessonNum}>
                        <Text style={styles.lessonNumText}>{li + 1}</Text>
                      </LinearGradient>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.lessonName} numberOfLines={1}>{lesson.name}</Text>
                        {lesson.description ? (
                          <Text style={styles.lessonDesc} numberOfLines={1}>{lesson.description}</Text>
                        ) : null}

                        {/* Action row */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                          <View style={styles.actionRow}>
                            <TouchableOpacity
                              onPress={() => router.push(`/notes/${lesson.id}`)}
                              style={[styles.actionPill, styles.pillNote]}
                              activeOpacity={0.75}
                            >
                              <Text style={styles.actionPillText}>📝 Catatan</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => router.push(`/study-material/${lesson.id}`)}
                              style={[styles.actionPill, styles.pillMaterial]}
                              activeOpacity={0.75}
                            >
                              <Text style={styles.actionPillText}>📚 Materi</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => router.push(`/flashcard/${lesson.id}`)}
                              style={[styles.actionPill, styles.pillCard]}
                              activeOpacity={0.75}
                            >
                              <Text style={styles.actionPillText}>🃏 Kartu</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => router.push(`/quiz/${lesson.id}`)}
                              style={[styles.actionPill, styles.pillQuiz]}
                              activeOpacity={0.75}
                            >
                              <Text style={styles.actionPillText}>❓ Quiz</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => router.push(`/create-quiz/${lesson.id}`)}
                              style={[styles.actionPill, styles.pillAdd]}
                              activeOpacity={0.75}
                            >
                              <Feather name="plus" size={11} color={Colors.primary} />
                              <Text style={[styles.actionPillText, { color: Colors.primary }]}>Soal</Text>
                            </TouchableOpacity>
                          </View>
                        </ScrollView>
                      </View>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.addLessonRow}
                    onPress={() => { setTargetMod(mod.id); setShowNewLesson(true); }}
                  >
                    <Feather name="plus-circle" size={15} color={Colors.primary} />
                    <Text style={styles.addLessonText}>Tambah Pelajaran</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        {activePath && (
          <TouchableOpacity style={styles.addModBtn} onPress={() => setShowNewModule(true)}>
            <Feather name="plus" size={15} color={Colors.primary} />
            <Text style={styles.addModText}>Tambah Modul Baru</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* MODALS */}
      {[
        {
          vis: showNewPath, title: "📚 Kursus Baru",
          close: () => setShowNewPath(false), save: createPath,
          body: (
            <>
              <TextInput placeholder="Nama kursus" value={pathName} onChangeText={setPathName} style={styles.mInput} placeholderTextColor={Colors.textMuted} autoFocus />
              <TextInput placeholder="Deskripsi (opsional)" value={pathDesc} onChangeText={setPathDesc} style={styles.mInput} placeholderTextColor={Colors.textMuted} />
            </>
          ),
        },
        {
          vis: showNewModule, title: "📂 Modul Baru",
          close: () => setShowNewModule(false), save: createModule,
          body: (
            <TextInput placeholder="Nama modul" value={modName} onChangeText={setModName} style={styles.mInput} placeholderTextColor={Colors.textMuted} autoFocus />
          ),
        },
        {
          vis: showNewLesson, title: "📝 Pelajaran Baru",
          close: () => setShowNewLesson(false), save: createLesson,
          body: (
            <>
              <TextInput placeholder="Nama pelajaran" value={lessonName} onChangeText={setLessonName} style={styles.mInput} placeholderTextColor={Colors.textMuted} autoFocus />
              <TextInput placeholder="Deskripsi (opsional)" value={lessonDesc} onChangeText={setLessonDesc} style={styles.mInput} placeholderTextColor={Colors.textMuted} />
            </>
          ),
        },
      ].map((m) => (
        <Modal key={m.title} visible={m.vis} transparent animationType="slide">
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View style={styles.mOverlay}>
              <View style={styles.mBox}>
                <Text style={styles.mTitle}>{m.title}</Text>
                {m.body}
                <View style={styles.mBtns}>
                  <TouchableOpacity onPress={m.close} style={styles.mBtnCancel}>
                    <Text style={styles.mBtnCancelText}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={m.save} style={styles.mBtnOk}>
                    <LinearGradient colors={["#4A9EFF", "#6C63FF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.mBtnOkGrad}>
                      <Text style={styles.mBtnOkText}>Simpan</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerGrad: { paddingHorizontal: 20, paddingBottom: 16, overflow: "hidden" },
  hdot1: { position: "absolute", width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(74,158,255,0.1)", top: -40, right: -40 },
  hdot2: { position: "absolute", width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(108,99,255,0.08)", top: 10, right: 60 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#fff", letterSpacing: -0.4 },
  addBtn: { borderRadius: 14, overflow: "hidden" },
  addGrad: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  pathTabsScroll: { height: 38 },
  pathTabsContent: { flexDirection: "row", alignItems: "center", gap: 8, paddingRight: 4 },
  pathTab: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.1)", height: 36 },
  pathTabActive: { backgroundColor: "rgba(255,255,255,0.2)", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  pathTabDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  pathTabText: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.65)", maxWidth: 120 },
  pathTabTextActive: { color: "#fff" },
  scroll: { flex: 1 },
  emptyGrad: { borderRadius: 22, padding: 36, alignItems: "center", gap: 10, overflow: "hidden", marginBottom: 12 },
  emptyGradTitle: { fontSize: 18, fontWeight: "900", color: "#fff" },
  emptyGradSub: { fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: "500" },
  moduleCard: { backgroundColor: "#fff", borderRadius: 16, marginBottom: 10, overflow: "hidden", borderWidth: 1, borderColor: Colors.border },
  moduleHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  modIconGrad: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  moduleName: { fontSize: 15, fontWeight: "800", color: Colors.dark, marginBottom: 6 },
  moduleMetaRow: { flexDirection: "row", gap: 5 },
  metaChip: { backgroundColor: Colors.background, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 },
  metaChipText: { fontSize: 10, fontWeight: "700", color: Colors.textSecondary },
  lessonList: { borderTopWidth: 1, borderTopColor: Colors.border, paddingHorizontal: 14, paddingBottom: 8 },
  lessonRow: {
    flexDirection: "row", alignItems: "flex-start",
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 10,
  },
  lessonNum: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 2 },
  lessonNumText: { fontSize: 11, fontWeight: "900", color: "#fff" },
  lessonName: { fontSize: 13, fontWeight: "700", color: Colors.dark },
  lessonDesc: { fontSize: 11, color: Colors.textMuted, fontWeight: "500", marginTop: 1 },
  actionRow: { flexDirection: "row", gap: 5, alignItems: "center" },
  actionPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8,
  },
  pillNote: { backgroundColor: "#EEF0FF" },
  pillMaterial: { backgroundColor: Colors.purpleLight },
  pillCard: { backgroundColor: Colors.primaryLight },
  pillQuiz: { backgroundColor: Colors.amberLight },
  pillAdd: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  actionPillText: { fontSize: 10, fontWeight: "800", color: Colors.dark },
  addLessonRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10 },
  addLessonText: { fontSize: 13, color: Colors.primary, fontWeight: "700" },
  addModBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.primary, borderStyle: "dashed",
  },
  addModText: { fontSize: 13, fontWeight: "700", color: Colors.primary },
  mOverlay: { flex: 1, backgroundColor: "rgba(10,22,40,0.6)", justifyContent: "flex-end" },
  mBox: { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, gap: 12 },
  mTitle: { fontSize: 20, fontWeight: "900", color: Colors.dark },
  mInput: { backgroundColor: Colors.background, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, fontWeight: "600", color: Colors.dark, borderWidth: 1.5, borderColor: Colors.border },
  mBtns: { flexDirection: "row", gap: 10 },
  mBtnCancel: { flex: 1, paddingVertical: 14, borderRadius: 999, alignItems: "center", backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  mBtnCancelText: { fontSize: 14, fontWeight: "700", color: Colors.textSecondary },
  mBtnOk: { flex: 1, borderRadius: 999, overflow: "hidden" },
  mBtnOkGrad: { paddingVertical: 14, alignItems: "center" },
  mBtnOkText: { fontSize: 14, fontWeight: "900", color: "#fff" },
});
