import React, { useCallback, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Platform, Share,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getUser, getStats, getLearningPaths, clearAllData,
  type User as UserType, type Stats,
} from "@/utils/storage";
import Colors, { shadow, shadowSm } from "@/constants/colors";

export default function ProfileTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<UserType | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pathCount, setPathCount] = useState(0);

  useFocusEffect(useCallback(() => {
    (async () => {
      const [u, s, paths] = await Promise.all([getUser(), getStats(), getLearningPaths()]);
      setUser(u); setStats(s); setPathCount(paths.length);
    })();
  }, []));

  const accuracy = stats && stats.totalAnswers > 0
    ? Math.round((stats.correctAnswers / stats.totalAnswers) * 100) : 0;
  const wrong = (stats?.totalAnswers ?? 0) - (stats?.correctAnswers ?? 0);

  const MENU = [
    {
      icon: "share-2" as const, label: "Bagikan Progress",
      sub: "Ceritakan pencapaianmu",
      color: Colors.primary,
      onPress: async () => Share.share({ message: `Akurasi saya ${accuracy}% dengan ${stats?.totalAnswers ?? 0} jawaban di Mobile Learning! 🎓` }),
    },
    {
      icon: "refresh-cw" as const, label: "Reset Profil",
      sub: "Data belajar tetap tersimpan",
      color: Colors.amber,
      onPress: () => Alert.alert("Reset Profil", "Reset profil pengguna?", [
        { text: "Batal", style: "cancel" },
        { text: "Reset", onPress: async () => { const AS = (await import("@react-native-async-storage/async-storage")).default; await AS.removeItem("user"); router.replace("/onboarding"); } },
      ]),
    },
    {
      icon: "trash-2" as const, label: "Hapus Semua Data",
      sub: "Tindakan ini tidak bisa dibatalkan",
      color: Colors.danger,
      onPress: () => Alert.alert("Hapus Semua Data", "Semua data akan dihapus permanen.", [
        { text: "Batal", style: "cancel" },
        { text: "Hapus", style: "destructive", onPress: async () => { await clearAllData(); router.replace("/onboarding"); } },
      ]),
    },
  ];

  const initial = (user?.name ?? "L").charAt(0).toUpperCase();

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {/* ── HEADER ── */}
      <LinearGradient
        colors={["#4C6FFF", "#7C47FF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: Platform.OS === "web" ? 56 : insets.top + 16 }]}
      >
        <View style={styles.blob1} /><View style={styles.blob2} />

        {/* Avatar + name */}
        <View style={styles.heroRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.name ?? "Learner"}</Text>
            <View style={styles.badges}>
              <View style={styles.badge}>
                <Feather name="award" size={10} color="rgba(255,255,255,0.9)" />
                <Text style={styles.badgeText}>{user?.level ?? "beginner"}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: "rgba(10,211,193,0.3)" }]}>
                <Feather name="book" size={10} color="rgba(255,255,255,0.9)" />
                <Text style={styles.badgeText}>{user?.topic ?? "Umum"}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Feather name="edit-2" size={16} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>

        {/* Stats bar */}
        <View style={styles.statsBar}>
          {[
            { val: pathCount, lbl: "Kursus", icon: "book-open" as const },
            { val: stats?.totalAnswers ?? 0, lbl: "Dijawab", icon: "message-circle" as const },
            { val: `${accuracy}%`, lbl: "Akurasi", icon: "target" as const },
            { val: stats?.streak ?? 0, lbl: "Streak", icon: "activity" as const },
          ].map((s, i) => (
            <View key={i} style={[styles.statItem, i < 3 && styles.statBorder]}>
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={styles.statLbl}>{s.lbl}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* Goal */}
        {user?.goal && (
          <View style={[styles.goalCard, shadowSm]}>
            <LinearGradient colors={["#4C6FFF", "#7C47FF"]} style={styles.goalIconWrap}>
              <Feather name="target" size={18} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.goalLabel}>Target Belajar</Text>
              <Text style={styles.goalText} numberOfLines={2}>{user.goal}</Text>
            </View>
          </View>
        )}

        {/* Progress summary */}
        <View style={[styles.progressCard, shadowSm]}>
          <Text style={styles.cardSectionLabel}>Ringkasan Progress</Text>
          <View style={styles.progressRow}>
            {[
              { val: stats?.correctAnswers ?? 0, lbl: "Benar", color: Colors.teal },
              { val: wrong, lbl: "Salah", color: Colors.danger },
              { val: `${accuracy}%`, lbl: "Akurasi", color: Colors.primary },
            ].map((p, i) => (
              <View key={i} style={[styles.progressChip, { backgroundColor: p.color + "15" }]}>
                <Text style={[styles.progressChipVal, { color: p.color }]}>{p.val}</Text>
                <Text style={[styles.progressChipLbl, { color: p.color }]}>{p.lbl}</Text>
              </View>
            ))}
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, {
              width: `${accuracy}%` as any,
              backgroundColor: accuracy >= 70 ? Colors.teal : accuracy >= 40 ? Colors.amber : Colors.danger,
            }]} />
          </View>
          <Text style={styles.barSub}>{stats?.totalAnswers ?? 0} total jawaban</Text>
        </View>

        {/* Quick actions */}
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: Colors.primaryLight }, shadowSm]}
            onPress={() => router.push("/(tabs)/progress")}
          >
            <Feather name="bar-chart-2" size={20} color={Colors.primary} />
            <Text style={[styles.quickLbl, { color: Colors.primary }]}>Progress{"\n"}Detail</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: Colors.amberLight }, shadowSm]}
            onPress={() => router.push("/(tabs)/practice")}
          >
            <Feather name="zap" size={20} color={Colors.amber} />
            <Text style={[styles.quickLbl, { color: Colors.amber }]}>Mulai{"\n"}Latihan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: Colors.tealLight }, shadowSm]}
            onPress={() => router.push("/(tabs)/learn")}
          >
            <Feather name="book-open" size={20} color={Colors.teal} />
            <Text style={[styles.quickLbl, { color: Colors.teal }]}>Semua{"\n"}Kursus</Text>
          </TouchableOpacity>
        </View>

        {/* Settings menu */}
        <Text style={styles.menuLabel}>Pengaturan</Text>
        <View style={[styles.menuCard, shadowSm]}>
          {MENU.map((item, i) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity onPress={item.onPress} style={styles.menuItem} activeOpacity={0.7}>
                <View style={[styles.menuIconWrap, { backgroundColor: item.color + "18" }]}>
                  <Feather name={item.icon} size={18} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuTitle, item.color === Colors.danger && { color: Colors.danger }]}>
                    {item.label}
                  </Text>
                  <Text style={styles.menuSub}>{item.sub}</Text>
                </View>
                <Feather name="chevron-right" size={15} color={Colors.textMuted} />
              </TouchableOpacity>
              {i < MENU.length - 1 && <View style={styles.menuDivider} />}
            </React.Fragment>
          ))}
        </View>

        <Text style={styles.footer}>Mobile Learning · v1.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 0, overflow: "hidden" },
  blob1: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.08)", top: -50, right: -50 },
  blob2: { position: "absolute", width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.06)", bottom: 20, left: 20 },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 22 },
  avatar: { width: 68, height: 68, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.35)" },
  avatarText: { fontSize: 28, fontWeight: "900", color: "#fff" },
  name: { fontSize: 22, fontWeight: "900", color: "#fff", marginBottom: 8 },
  badges: { flexDirection: "row", gap: 8 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(76,111,255,0.35)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#fff", textTransform: "capitalize" },
  editBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  statsBar: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.15)" },
  statItem: { flex: 1, paddingVertical: 16, alignItems: "center" },
  statBorder: { borderRightWidth: 1, borderRightColor: "rgba(255,255,255,0.12)" },
  statVal: { fontSize: 18, fontWeight: "900", color: "#fff" },
  statLbl: { fontSize: 9, color: "rgba(255,255,255,0.5)", fontWeight: "700", textTransform: "uppercase", marginTop: 2 },
  body: { padding: 16, gap: 12, paddingBottom: 40 },
  goalCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: Colors.white, borderRadius: 20, padding: 16 },
  goalIconWrap: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  goalLabel: { fontSize: 10, fontWeight: "800", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  goalText: { fontSize: 14, fontWeight: "700", color: Colors.dark, lineHeight: 20 },
  progressCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 18, gap: 12 },
  cardSectionLabel: { fontSize: 11, fontWeight: "800", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 1 },
  progressRow: { flexDirection: "row", gap: 8 },
  progressChip: { flex: 1, borderRadius: 14, padding: 12, alignItems: "center", gap: 3 },
  progressChipVal: { fontSize: 20, fontWeight: "900" },
  progressChipLbl: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  barTrack: { height: 7, backgroundColor: Colors.border, borderRadius: 999, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 999 },
  barSub: { fontSize: 12, color: Colors.textMuted, fontWeight: "600" },
  quickRow: { flexDirection: "row", gap: 10 },
  quickCard: { flex: 1, borderRadius: 18, padding: 14, alignItems: "center", gap: 8 },
  quickLbl: { fontSize: 12, fontWeight: "800", textAlign: "center", lineHeight: 17 },
  menuLabel: { fontSize: 11, fontWeight: "800", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 1 },
  menuCard: { backgroundColor: Colors.white, borderRadius: 20, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 16, gap: 14 },
  menuIconWrap: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  menuTitle: { fontSize: 14, fontWeight: "800", color: Colors.dark },
  menuSub: { fontSize: 11, color: Colors.textMuted, fontWeight: "500", marginTop: 2 },
  menuDivider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: 16 },
  footer: { textAlign: "center", fontSize: 11, color: Colors.textMuted, fontWeight: "600", paddingTop: 8, paddingBottom: 12 },
});
