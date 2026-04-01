import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PromptBuilder } from "@/components/PromptBuilder";
import { getStats, getProgress, type Stats, type Progress } from "@/utils/storage";
import { classifyAllItems, type DifficultyStats } from "@/utils/difficulty-classifier";
import { generateReportHTML } from "@/utils/report-generator";
import { ProgressBar } from "@/components/ProgressBar";
import Colors from "@/constants/colors";
import { toast } from "@/components/Toast";

const { width } = Dimensions.get("window");
type Tab = "stats" | "classify" | "prompts";

const DIFF_CONFIG = {
  mudah:  { label: "Mudah",  color: "#0AD3C1", bg: "#E0FAF8", icon: "trending-up"  as const, emoji: "✅" },
  sedang: { label: "Sedang", color: "#FF9500", bg: "#FFF8EB", icon: "minus-circle"  as const, emoji: "⚡" },
  susah:  { label: "Susah",  color: "#FF6B6B", bg: "#FFF0F0", icon: "alert-triangle" as const, emoji: "🔥" },
};

export default function ProgressTab() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [stats, setStats] = useState<Stats | null>(null);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [difficulty, setDifficulty] = useState<DifficultyStats | null>(null);
  const [tab, setTab] = useState<Tab>("stats");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [activeDiff, setActiveDiff] = useState<"mudah" | "sedang" | "susah">("susah");

  // Switch tab when navigated with ?tab= param
  useEffect(() => {
    const t = params.tab;
    if (t === "stats" || t === "classify" || t === "prompts") {
      setTab(t);
    }
  }, [params.tab]);

  useFocusEffect(useCallback(() => {
    (async () => {
      const [s, p, d] = await Promise.all([getStats(), getProgress(), classifyAllItems()]);
      setStats(s); setProgress(p); setDifficulty(d);
    })();
  }, []));

  const accuracy = stats && stats.totalAnswers > 0
    ? Math.round((stats.correctAnswers / stats.totalAnswers) * 100) : 0;
  const wrong = (stats?.totalAnswers ?? 0) - (stats?.correctAnswers ?? 0);

  const handleExportPDF = async () => {
    if (Platform.OS === "web") {
      toast.info("PDF hanya tersedia di iOS/Android");
      return;
    }
    setPdfLoading(true);
    try {
      const Print = await import("expo-print");
      const Sharing = await import("expo-sharing");
      const html = await generateReportHTML();
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Laporan Belajar" });
        toast.success("PDF berhasil dibuat!");
      } else {
        toast.info("PDF tersimpan di perangkat");
      }
    } catch {
      toast.error("Gagal membuat PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  // Weekly bar chart data (last 7 days)
  const weeklyBars: { day: string; pct: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayP = progress.filter((p) => p.timestamp.slice(0, 10) === key);
    const dayCorrect = dayP.filter((p) => p.isCorrect).length;
    const pct = dayP.length > 0 ? Math.round((dayCorrect / dayP.length) * 100) : 0;
    weeklyBars.push({ day: d.toLocaleDateString("id-ID", { weekday: "short" }), pct });
  }
  const maxPct = Math.max(...weeklyBars.map((b) => b.pct), 1);

  const recent = [...progress]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);

  const TABS: { key: Tab; icon: React.ComponentProps<typeof Feather>["name"]; label: string }[] = [
    { key: "stats",    icon: "bar-chart-2", label: "Statistik" },
    { key: "classify", icon: "layers",      label: "Klasifikasi" },
    { key: "prompts",  icon: "zap",         label: "AI Prompt" },
  ];

  return (
    <View style={styles.container}>
      {/* ===== GRADIENT HEADER ===== */}
      <LinearGradient
        colors={["#4C6FFF", "#7C47FF"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.headerGrad, { paddingTop: Platform.OS === "web" ? 60 : insets.top + 12 }]}
      >
        <View style={styles.hDot1} />
        <View style={styles.hDot2} />

        {/* Title row */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.headerSub}>Perkembanganmu</Text>
            <Text style={styles.headerTitle}>Progress</Text>
          </View>
          <TouchableOpacity onPress={handleExportPDF} style={styles.pdfBtn} activeOpacity={0.8}>
            <LinearGradient colors={["#4A9EFF", "#6C63FF"]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.pdfBtnGrad}>
              {pdfLoading
                ? <ActivityIndicator size="small" color="#fff" />
                : <><Feather name="download" size={14} color="#fff" /><Text style={styles.pdfBtnText}>PDF</Text></>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Hero: Ring + Stat chips */}
        <View style={styles.heroRow}>
          {/* Accuracy ring */}
          <View style={styles.ringContainer}>
            <View style={styles.ringOuter}>
              <View style={styles.ringInner}>
                <Text style={styles.ringVal}>{accuracy}%</Text>
                <Text style={styles.ringLbl}>AKURASI</Text>
              </View>
            </View>
            {/* Arc decoration */}
            <View style={[styles.ringArc, { borderColor: accuracy >= 70 ? "#0AD3C1" : accuracy >= 40 ? "#FF9500" : "#FF6B6B" }]} />
          </View>

          {/* 4 stat chips */}
          <View style={styles.chipsGrid}>
            {[
              { icon: "message-circle" as const, val: stats?.totalAnswers ?? 0, lbl: "Jawaban", grad: ["#4A9EFF","#6C63FF"] as [string,string] },
              { icon: "check-circle"   as const, val: stats?.correctAnswers ?? 0, lbl: "Benar",   grad: ["#0AD3C1","#00B4D8"] as [string,string] },
              { icon: "x-circle"       as const, val: wrong,                     lbl: "Salah",   grad: ["#FF6B6B","#EF4444"] as [string,string] },
              { icon: "activity"       as const, val: stats?.streak ?? 0,        lbl: "Streak",  grad: ["#FF9500","#FF6B6B"] as [string,string] },
            ].map((c, i) => (
              <View key={i} style={styles.chip}>
                <LinearGradient colors={c.grad} style={styles.chipIcon}>
                  <Feather name={c.icon} size={13} color="#fff" />
                </LinearGradient>
                <Text style={styles.chipVal}>{c.val}</Text>
                <Text style={styles.chipLbl}>{c.lbl}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tab strip */}
        <View style={styles.tabStrip}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[styles.tabItem, tab === t.key && styles.tabItemActive]}
              activeOpacity={0.75}
            >
              <Feather name={t.icon} size={13} color={tab === t.key ? "#fff" : "rgba(255,255,255,0.4)"} />
              <Text style={[styles.tabItemText, tab === t.key && styles.tabItemTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* ===== CONTENT ===== */}
      {tab === "stats" && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Weekly bar chart */}
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.cardHeadLeft}>
                <LinearGradient colors={["#4A9EFF","#6C63FF"]} style={styles.cardHeadIcon}>
                  <Feather name="bar-chart-2" size={13} color="#fff" />
                </LinearGradient>
                <Text style={styles.cardTitle}>Akurasi 7 Hari</Text>
              </View>
              <Text style={styles.cardHint}>(%) per hari</Text>
            </View>
            <View style={styles.barChartWrap}>
              {weeklyBars.map((b, i) => {
                const h = Math.max(4, (b.pct / maxPct) * 80);
                const col = b.pct >= 70 ? "#0AD3C1" : b.pct >= 40 ? "#FF9500" : b.pct === 0 ? "#E2E8F0" : "#FF6B6B";
                return (
                  <View key={i} style={styles.barCol}>
                    <Text style={[styles.barValText, { color: col }]}>{b.pct > 0 ? `${b.pct}` : ""}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { height: h, backgroundColor: col }]} />
                    </View>
                    <Text style={styles.barDayText}>{b.day}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Accuracy progress */}
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.cardHeadLeft}>
                <LinearGradient colors={["#0AD3C1","#00B4D8"]} style={styles.cardHeadIcon}>
                  <Feather name="target" size={13} color="#fff" />
                </LinearGradient>
                <Text style={styles.cardTitle}>Akurasi Keseluruhan</Text>
              </View>
              <Text style={[styles.cardHint, { fontSize: 18, fontWeight: "900", color: Colors.dark }]}>{accuracy}%</Text>
            </View>
            <View style={{ marginTop: 4 }}>
              <ProgressBar
                value={accuracy}
                color={accuracy >= 70 ? "#0AD3C1" : accuracy >= 40 ? "#FF9500" : "#FF6B6B"}
                height={10}
                backgroundColor={Colors.border}
              />
            </View>
            <Text style={styles.progressSub}>{stats?.correctAnswers ?? 0} benar · {wrong} salah · {stats?.totalAnswers ?? 0} total</Text>
          </View>

          {/* Activity heatmap */}
          {recent.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <View style={styles.cardHeadLeft}>
                  <LinearGradient colors={["#7C3AED","#A855F7"]} style={styles.cardHeadIcon}>
                    <Feather name="grid" size={13} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.cardTitle}>Aktivitas Terbaru</Text>
                </View>
              </View>
              <View style={styles.heatmapWrap}>
                {recent.slice(0, 21).map((p, i) => (
                  <View
                    key={i}
                    style={[
                      styles.heatCell,
                      { backgroundColor: p.isCorrect ? "#0AD3C1" : "#FF6B6B" },
                    ]}
                  />
                ))}
              </View>
              <View style={styles.heatLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#0AD3C1" }]} />
                  <Text style={styles.legendText}>Benar</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#FF6B6B" }]} />
                  <Text style={styles.legendText}>Salah</Text>
                </View>
                <Text style={styles.legendText}>{recent.length} aktivitas</Text>
              </View>
            </View>
          )}

          {/* Log */}
          {recent.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <View style={styles.cardHeadLeft}>
                  <LinearGradient colors={["#FF9500","#FF6B6B"]} style={styles.cardHeadIcon}>
                    <Feather name="list" size={13} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.cardTitle}>Log Jawaban</Text>
                </View>
              </View>
              {recent.slice(0, 10).map((p, i) => (
                <View key={i} style={[styles.logRow, i < Math.min(10, recent.length) - 1 && styles.logRowBorder]}>
                  <View style={[styles.logDot, { backgroundColor: p.isCorrect ? "#0AD3C1" : "#FF6B6B" }]} />
                  <Feather name={p.flashcardId ? "credit-card" : "help-circle"} size={13} color={Colors.textMuted} />
                  <Text style={styles.logDate}>{new Date(p.timestamp).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</Text>
                  <Text style={[styles.logResult, { color: p.isCorrect ? "#059669" : "#DC2626" }]}>
                    {p.isCorrect ? "✓ Benar" : "✗ Salah"}
                  </Text>
                  {p.userAnswer ? <Text style={styles.logAnswer} numberOfLines={1}>{p.userAnswer}</Text> : null}
                </View>
              ))}
            </View>
          )}

          {recent.length === 0 && (
            <LinearGradient colors={["#0A1628","#1A3066"]} style={styles.emptyGrad}>
              <View style={styles.hDot1} /><View style={styles.hDot2} />
              <Feather name="trending-up" size={40} color="rgba(74,158,255,0.6)" />
              <Text style={styles.emptyTitle}>Belum Ada Data</Text>
              <Text style={styles.emptySub}>Kerjakan flashcard atau kuis untuk melihat statistikmu di sini</Text>
            </LinearGradient>
          )}

          {/* PDF Button */}
          <TouchableOpacity onPress={handleExportPDF} activeOpacity={0.85} style={{ borderRadius: 16, overflow: "hidden" }}>
            <LinearGradient colors={["#0A1628","#1A3066"]} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.pdfBigBtn}>
              <View style={styles.pdfBigIconWrap}>
                {pdfLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Feather name="file-text" size={20} color="#fff" />
                }
              </View>
              <View>
                <Text style={styles.pdfBigTitle}>Export Laporan PDF</Text>
                <Text style={styles.pdfBigSub}>Graph, heatmap, klasifikasi soal & log lengkap</Text>
              </View>
              <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.4)" style={{ marginLeft: "auto" }} />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {tab === "classify" && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Summary pills */}
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.cardHeadLeft}>
                <LinearGradient colors={["#7C3AED","#A855F7"]} style={styles.cardHeadIcon}>
                  <Feather name="layers" size={13} color="#fff" />
                </LinearGradient>
                <Text style={styles.cardTitle}>Klasifikasi Otomatis</Text>
              </View>
            </View>
            <Text style={styles.classifyDesc}>
              Soal diklasifikasikan berdasarkan akurasi percobaan kamu. Mudah (≥70%), Sedang (40–69%), Susah (&lt;40%).
            </Text>
            <View style={styles.diffSummaryRow}>
              {(["mudah","sedang","susah"] as const).map((d) => {
                const cfg = DIFF_CONFIG[d];
                const count = difficulty?.[d].length ?? 0;
                return (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setActiveDiff(d)}
                    style={[styles.diffSummaryChip, { backgroundColor: cfg.bg, borderColor: activeDiff === d ? cfg.color : "transparent", borderWidth: 2 }]}
                    activeOpacity={0.75}
                  >
                    <Feather name={cfg.icon} size={16} color={cfg.color} />
                    <Text style={[styles.diffSummaryVal, { color: cfg.color }]}>{count}</Text>
                    <Text style={[styles.diffSummaryLbl, { color: cfg.color }]}>{cfg.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Active category list */}
          {(() => {
            const cfg = DIFF_CONFIG[activeDiff];
            const items = difficulty?.[activeDiff] ?? [];
            return (
              <View style={styles.card}>
                <View style={styles.cardHead}>
                  <View style={styles.cardHeadLeft}>
                    <LinearGradient
                      colors={activeDiff === "mudah" ? ["#0AD3C1","#00B4D8"] : activeDiff === "sedang" ? ["#FF9500","#FF6B6B"] : ["#FF6B6B","#EF4444"]}
                      style={styles.cardHeadIcon}
                    >
                      <Feather name={cfg.icon} size={13} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.cardTitle}>Soal {cfg.label}</Text>
                  </View>
                  <Text style={[styles.cardHint, { color: cfg.color, fontWeight: "800" }]}>{items.length} soal</Text>
                </View>

                {items.length === 0 ? (
                  <View style={styles.diffEmpty}>
                    <Feather name={cfg.icon} size={32} color={cfg.color} />
                    <Text style={[styles.diffEmptyText, { color: cfg.color }]}>Belum ada soal {cfg.label.toLowerCase()}</Text>
                    <Text style={styles.diffEmptySub}>Kerjakan lebih banyak latihan untuk melihat klasifikasi</Text>
                  </View>
                ) : (
                  items.map((item, i) => (
                    <View key={item.id} style={[styles.classifyRow, i < items.length - 1 && styles.classifyRowBorder]}>
                      <View style={[styles.classifyTypeBadge, { backgroundColor: cfg.bg }]}>
                        <Feather name={item.type === "flashcard" ? "credit-card" : "help-circle"} size={12} color={cfg.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.classifyQ} numberOfLines={2}>{item.question}</Text>
                        <View style={styles.classifyMeta}>
                          <Text style={styles.classifyMetaText}>{item.attempts}× attempt</Text>
                          <Text style={styles.classifyMetaText}>·</Text>
                          <Text style={[styles.classifyAcc, { color: cfg.color }]}>{item.accuracy}% benar</Text>
                        </View>
                      </View>
                      <View style={[styles.accuracyPill, { backgroundColor: cfg.bg }]}>
                        <Text style={[styles.accuracyPillText, { color: cfg.color }]}>{item.accuracy}%</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            );
          })()}
        </ScrollView>
      )}

      {tab === "prompts" && <PromptBuilder />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerGrad: { paddingHorizontal: 20, paddingBottom: 0, overflow: "hidden" },
  hDot1: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(74,158,255,0.1)", top: -50, right: -50 },
  hDot2: { position: "absolute", width: 110, height: 110, borderRadius: 55, backgroundColor: "rgba(10,211,193,0.07)", bottom: -20, left: 20 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  pdfBtn: { borderRadius: 12, overflow: "hidden" },
  pdfBtnGrad: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9 },
  pdfBtnText: { fontSize: 12, fontWeight: "800", color: "#fff" },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 },
  ringContainer: { width: 100, height: 100, alignItems: "center", justifyContent: "center" },
  ringOuter: { width: 96, height: 96, borderRadius: 48, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  ringInner: { width: 74, height: 74, borderRadius: 37, backgroundColor: "rgba(10,22,40,0.6)", alignItems: "center", justifyContent: "center" },
  ringArc: { position: "absolute", width: 96, height: 96, borderRadius: 48, borderWidth: 4, borderTopColor: "transparent", borderRightColor: "transparent" },
  ringVal: { fontSize: 20, fontWeight: "900", color: "#fff" },
  ringLbl: { fontSize: 8, color: "rgba(255,255,255,0.5)", fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  chipsGrid: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { width: "46%", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 14, padding: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  chipIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  chipVal: { fontSize: 16, fontWeight: "900", color: "#fff" },
  chipLbl: { fontSize: 9, color: "rgba(255,255,255,0.45)", fontWeight: "700", textTransform: "uppercase" },
  tabStrip: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" },
  tabItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 12 },
  tabItemActive: { borderBottomWidth: 2.5, borderBottomColor: Colors.primary },
  tabItemText: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.4)" },
  tabItemTextActive: { color: "#fff" },
  scrollContent: { padding: 20, paddingBottom: 40, gap: 12 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardHeadLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardHeadIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 13, fontWeight: "800", color: Colors.dark },
  cardHint: { fontSize: 11, color: Colors.textMuted, fontWeight: "600" },
  barChartWrap: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 110, paddingTop: 16 },
  barCol: { flex: 1, alignItems: "center", gap: 4 },
  barValText: { fontSize: 9, fontWeight: "800", height: 12 },
  barTrack: { width: "70%", height: 80, justifyContent: "flex-end" },
  barFill: { width: "100%", borderRadius: 4 },
  barDayText: { fontSize: 9, color: Colors.textMuted, fontWeight: "700" },
  progressSub: { fontSize: 11, color: Colors.textMuted, fontWeight: "600" },
  heatmapWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  heatCell: { width: (width - 28 - 14 * 2 - 6 * 6) / 7, height: (width - 28 - 14 * 2 - 6 * 6) / 7, borderRadius: 5 },
  heatLegend: { flexDirection: "row", alignItems: "center", gap: 14 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontSize: 11, color: Colors.textMuted, fontWeight: "600" },
  logRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 9 },
  logRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  logDot: { width: 7, height: 7, borderRadius: 4 },
  logDate: { fontSize: 11, color: Colors.textMuted, fontWeight: "700", width: 50 },
  logResult: { fontSize: 12, fontWeight: "800", width: 60 },
  logAnswer: { flex: 1, fontSize: 11, color: Colors.textSecondary, fontWeight: "500" },
  emptyGrad: { borderRadius: 20, padding: 32, alignItems: "center", gap: 10, overflow: "hidden" },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: "#fff" },
  emptySub: { fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: "500", textAlign: "center", lineHeight: 20 },
  pdfBigBtn: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 16, padding: 18, overflow: "hidden" },
  pdfBigIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  pdfBigTitle: { fontSize: 15, fontWeight: "900", color: "#fff" },
  pdfBigSub: { fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: "500", marginTop: 2 },
  classifyDesc: { fontSize: 12, color: Colors.textSecondary, fontWeight: "500", lineHeight: 18 },
  diffSummaryRow: { flexDirection: "row", gap: 10 },
  diffSummaryChip: { flex: 1, alignItems: "center", borderRadius: 14, paddingVertical: 12, gap: 4 },
  diffSummaryVal: { fontSize: 22, fontWeight: "900" },
  diffSummaryLbl: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  diffEmpty: { alignItems: "center", paddingVertical: 24, gap: 8 },
  diffEmptyText: { fontSize: 15, fontWeight: "800" },
  diffEmptySub: { fontSize: 12, color: Colors.textMuted, fontWeight: "500", textAlign: "center" },
  classifyRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11 },
  classifyRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  classifyTypeBadge: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  classifyQ: { fontSize: 13, fontWeight: "700", color: Colors.dark, lineHeight: 19 },
  classifyMeta: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
  classifyMetaText: { fontSize: 11, color: Colors.textMuted, fontWeight: "600" },
  classifyAcc: { fontSize: 11, fontWeight: "800" },
  accuracyPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  accuracyPillText: { fontSize: 12, fontWeight: "900" },
});
