import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { saveUser, getUser, generateId, type User } from "@/utils/storage";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";

const { width } = Dimensions.get("window");
type Level = "beginner" | "intermediate" | "advanced";
const LEVELS: { val: Level; label: string; emoji: string }[] = [
  { val: "beginner", label: "Pemula", emoji: "🌱" },
  { val: "intermediate", label: "Menengah", emoji: "🚀" },
  { val: "advanced", label: "Lanjut", emoji: "⭐" },
];

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState<Level>("beginner");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const user = await getUser();
      if (user) router.replace("/(tabs)");
    })();
  }, []);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const user: User = {
      id: generateId(),
      name: name.trim(),
      goal: goal.trim() || "Belajar hal baru",
      topic: topic.trim() || "Umum",
      level,
      createdAt: new Date().toISOString(),
    };
    await saveUser(user);
    router.replace("/(tabs)");
  };

  const STEPS = [
    {
      emoji: "👋",
      bg: "#EBF5FF",
      title: "Find Your\nFavourite Lesson",
      sub: "Rancang perjalanan belajarmu yang fleksibel dan personal bersama kami.",
      cta: "Mulai",
      field: null,
    },
    {
      emoji: "📝",
      bg: "#FFF8EB",
      title: "Siapa namamu?",
      sub: "Kami ingin menyapa dengan namamu setiap hari.",
      cta: "Lanjut",
      field: "name",
    },
    {
      emoji: "🎯",
      bg: "#E0FAF8",
      title: "Apa targetmu?",
      sub: "Tentukan topik dan level belajarmu sekarang.",
      cta: "Mulai Belajar!",
      field: "goal",
    },
  ];

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = async () => {
    if (step === 0) { setStep(1); return; }
    if (step === 1) {
      if (!name.trim()) return;
      setStep(2);
      return;
    }
    await handleSubmit();
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: Platform.OS === "web" ? 60 : insets.top + 16, paddingBottom: 40 },
      ]}
      bottomOffset={16}
      keyboardShouldPersistTaps="handled"
    >
      {/* Skip */}
      {step < 2 && (
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          style={styles.skipBtn}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Illustration circle */}
      <View style={[styles.illustrationWrap, { backgroundColor: current.bg }]}>
        <Text style={styles.illustrationEmoji}>{current.emoji}</Text>
      </View>

      {/* Text */}
      <Text style={styles.title}>{current.title}</Text>
      <Text style={styles.sub}>{current.sub}</Text>

      {/* Step-specific inputs */}
      {step === 1 && (
        <View style={styles.inputsWrap}>
          <TextInput
            placeholder="Nama kamu"
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholderTextColor={Colors.textMuted}
            autoFocus
          />
        </View>
      )}

      {step === 2 && (
        <View style={styles.inputsWrap}>
          <TextInput
            placeholder="Target belajar (misal: lulus JLPT N3)"
            value={goal}
            onChangeText={setGoal}
            style={styles.input}
            placeholderTextColor={Colors.textMuted}
          />
          <TextInput
            placeholder="Topik utama (misal: React Native)"
            value={topic}
            onChangeText={setTopic}
            style={styles.input}
            placeholderTextColor={Colors.textMuted}
          />
          <Text style={styles.levelLabel}>Level kamu saat ini</Text>
          <View style={styles.levelRow}>
            {LEVELS.map((l) => (
              <TouchableOpacity
                key={l.val}
                onPress={() => setLevel(l.val)}
                style={[
                  styles.levelChip,
                  level === l.val && styles.levelChipActive,
                ]}
                activeOpacity={0.75}
              >
                <Text style={styles.levelEmoji}>{l.emoji}</Text>
                <Text
                  style={[
                    styles.levelText,
                    level === l.val && styles.levelTextActive,
                  ]}
                >
                  {l.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* CTA */}
      <TouchableOpacity
        onPress={handleNext}
        style={[styles.ctaBtn, loading && styles.ctaBtnDisabled]}
        activeOpacity={0.85}
        disabled={loading}
      >
        <Text style={styles.ctaText}>{current.cta}</Text>
      </TouchableOpacity>

      {/* Dots */}
      <View style={styles.dots}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === step && styles.dotActive]}
          />
        ))}
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { paddingHorizontal: 28, alignItems: "center" },
  skipBtn: { alignSelf: "flex-end", marginBottom: 24 },
  skipText: { fontSize: 14, fontWeight: "700", color: Colors.textMuted },
  illustrationWrap: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: (width * 0.6) / 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 36,
  },
  illustrationEmoji: { fontSize: 80 },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: Colors.dark,
    textAlign: "center",
    lineHeight: 38,
    marginBottom: 14,
  },
  sub: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "500",
    paddingHorizontal: 8,
    marginBottom: 32,
  },
  inputsWrap: { width: "100%", gap: 12, marginBottom: 24 },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 15,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.dark,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  levelLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 4,
  },
  levelRow: { flexDirection: "row", gap: 10 },
  levelChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: "center",
    gap: 4,
  },
  levelChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  levelEmoji: { fontSize: 20 },
  levelText: { fontSize: 12, fontWeight: "700", color: Colors.textSecondary },
  levelTextActive: { color: Colors.primaryDark },
  ctaBtn: {
    width: "100%",
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  ctaBtnDisabled: { opacity: 0.6 },
  ctaText: { fontSize: 16, fontWeight: "900", color: Colors.white },
  dots: { flexDirection: "row", gap: 8 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
});
