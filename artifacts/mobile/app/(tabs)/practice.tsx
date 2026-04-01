import React, { useCallback, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getLearningPaths, getFlashcards, getQuizzes, getStats,
  type LearningPath,
} from "@/utils/storage";
import Colors, { shadow, shadowSm, CARD_GRADIENTS } from "@/constants/colors";

const { width } = Dimensions.get("window");

const MODES = [
  {
    icon: "credit-card" as const,
    label: "Flashcard",
    sub: "Review kartu pertanyaan",
    gradient: ["#4C6FFF", "#7C47FF"] as [string, string],
  },
  {
    icon: "help-circle" as const,
    label: "Quiz",
    sub: "Pilihan ganda & benar/salah",
    gradient: ["#FF6B6B", "#FF9500"] as [string, string],
  },
  {
    icon: "repeat" as const,
    label: "Review Salah",
    sub: "Ulangi soal yang salah",
    gradient: ["#7C3AED", "#A855F7"] as [string, string],
    route: "/mistakes-review",
  },
  {
    icon: "zap" as const,
    label: "Latihan Cepat",
    sub: "5 soal acak dari semua materi",
    gradient: ["#FF9500", "#F59E0B"] as [string, string],
  },
];

export default function PracticeTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [cardCount, setCardCount] = useState(0);
  const [quizCount, setQuizCount] = useState(0);
  const [stats, setStats] = useState<{ totalAnswers: number; correctAnswers: number } | null>(null);

  useFocusEffect(useCallback(() => {
    (async () => {
      const [p, fc, qz, s] = await Promise.all([
        getLearningPaths(), getFlashcards(), getQuizzes(), getStats(),
      ]);
      setPaths(p); setCardCount(fc.length); setQuizCount(qz.length); setStats(s);
    })();
  }, []));

  const accuracy = stats && stats.totalAnswers > 0
    ? Math.round((stats.correctAnswers / stats.totalAnswers) * 100) : 0;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#FF6B6B", "#FF9500"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: Platform.OS === "web" ? 56 : insets.top + 16 }]}
      >
        <View style={styles.hBlob1} />
        <View style={styles.hBlob2} />
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerSub}>Mode Latihan</Text>
            <Text style={styles.headerTitle}>Latihan</Text>
          </View>
          <View style={styles.streakBadge}>
            <Feather name="zap" size={16} color="#fff" />
            <Text style={styles.streakText}>{accuracy}% akurat</Text>
          </View>
        </View>

        {/* Content summary */}
        <View style={styles.summaryRow}>
          {[
            { icon: "credit-card" as const, val: cardCount, label: "Flashcard" },
            { icon: "help-circle" as const, val: quizCount, label: "Quiz Soal" },
            { icon: "book-open" as const, val: paths.length, label: "Kursus" },
          ].map((s, i) => (
            <View key={i} style={styles.summaryChip}>
              <Feather name={s.icon} size={14} color="rgba(255,255,255,0.85)" />
              <Text style={styles.summaryVal}>{s.val}</Text>
              <Text style={styles.summaryLbl}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Mode grid */}
        <Text style={styles.sectionTitle}>Pilih Mode</Text>
        <View style={styles.modeGrid}>
          {MODES.map((m, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => m.route ? router.push(m.route as any) : router.push("/(tabs)/learn")}
              activeOpacity={0.88}
              style={[styles.modeCard, shadow]}
            >
              <LinearGradient
                colors={m.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modeGrad}
              >
                <View style={styles.modeBlob} />
                <View style={styles.modeIconWrap}>
                  <Feather name={m.icon} size={22} color="#fff" />
                </View>
                <Text style={styles.modeLabel}>{m.label}</Text>
                <Text style={styles.modeSub}>{m.sub}</Text>
                <View style={styles.modeArrow}>
                  <Feather name="arrow-right" size={14} color="#fff" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Kursus untuk latihan */}
        {paths.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Pilih Kursus</Text>
            <View style={styles.courseList}>
              {paths.map((path, i) => (
                <TouchableOpacity
                  key={path.id}
                  onPress={() => router.push("/(tabs)/learn")}
                  style={[styles.courseRow, shadowSm]}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={CARD_GRADIENTS[i % CARD_GRADIENTS.length]}
                    style={styles.courseRowIcon}
                  >
                    <Feather name="book" size={16} color="#fff" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.courseRowName} numberOfLines={1}>{path.name}</Text>
                    <Text style={styles.courseRowSub} numberOfLines={1}>{path.description || "Ketuk untuk mulai latihan"}</Text>
                  </View>
                  <TouchableOpacity style={styles.practiceBtn} onPress={() => router.push("/(tabs)/learn")}>
                    <Text style={styles.practiceBtnText}>Latihan</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {paths.length === 0 && (
          <View style={[styles.emptyCard, shadow]}>
            <LinearGradient colors={["#4C6FFF","#7C47FF"]} style={styles.emptyGrad}>
              <View style={styles.hBlob1} />
              <Feather name="book-open" size={36} color="rgba(255,255,255,0.85)" />
              <Text style={styles.emptyTitle}>Belum Ada Kursus</Text>
              <Text style={styles.emptySub}>Buat kursus di tab Kursus untuk mulai berlatih</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push("/(tabs)/learn")}>
                <Text style={styles.emptyBtnText}>Buat Kursus</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 20, overflow: "hidden" },
  hBlob1: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.08)", top: -50, right: -50 },
  hBlob2: { position: "absolute", width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.06)", bottom: -20, left: 30 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.55)", fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#fff", letterSpacing: -0.4, marginTop: 2 },
  streakBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.18)", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  streakText: { fontSize: 13, fontWeight: "800", color: "#fff" },
  summaryRow: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 14, overflow: "hidden" },
  summaryChip: { flex: 1, alignItems: "center", paddingVertical: 12, gap: 3 },
  summaryVal: { fontSize: 16, fontWeight: "900", color: "#fff" },
  summaryLbl: { fontSize: 10, color: "rgba(255,255,255,0.55)", fontWeight: "700", textTransform: "uppercase" },
  scroll: { padding: 20, paddingBottom: 40, gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: Colors.dark, letterSpacing: -0.2, marginBottom: 12 },
  modeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  modeCard: { width: (width - 40 - 10) / 2, borderRadius: 16, overflow: "hidden" },
  modeGrad: { padding: 18, minHeight: 148, overflow: "hidden", justifyContent: "flex-end" },
  modeBlob: { position: "absolute", width: 90, height: 90, borderRadius: 45, backgroundColor: "rgba(255,255,255,0.1)", top: -20, right: -20 },
  modeIconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  modeLabel: { fontSize: 15, fontWeight: "800", color: "#fff", marginBottom: 3 },
  modeSub: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: "500", lineHeight: 17 },
  modeArrow: { position: "absolute", top: 14, right: 14, width: 26, height: 26, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  courseList: { gap: 8 },
  courseRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.white, borderRadius: 16, padding: 14 },
  courseRowIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  courseRowName: { fontSize: 14, fontWeight: "800", color: Colors.dark },
  courseRowSub: { fontSize: 12, color: Colors.textMuted, fontWeight: "500", marginTop: 2 },
  practiceBtn: { backgroundColor: Colors.primaryLight, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  practiceBtnText: { fontSize: 12, fontWeight: "800", color: Colors.primary },
  emptyCard: { borderRadius: 20, overflow: "hidden" },
  emptyGrad: { padding: 28, alignItems: "center", gap: 10, minHeight: 170, overflow: "hidden" },
  emptyTitle: { fontSize: 17, fontWeight: "900", color: "#fff" },
  emptySub: { fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: "500", textAlign: "center", lineHeight: 20 },
  emptyBtn: { backgroundColor: "rgba(255,255,255,0.25)", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 4 },
  emptyBtnText: { fontSize: 14, fontWeight: "800", color: "#fff" },
});
