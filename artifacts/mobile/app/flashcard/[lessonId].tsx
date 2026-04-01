import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Plus, RotateCcw, Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import {
  getFlashcards,
  saveProgress,
  updateStats,
  getStats,
  generateId,
  type Flashcard,
} from "@/utils/storage";
import Colors from "@/constants/colors";
import { ProgressBar } from "@/components/ProgressBar";

export default function FlashcardScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completed, setCompleted] = useState<Record<string, "correct" | "wrong">>({});
  const [done, setDone] = useState(false);

  const [flipAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    (async () => {
      const data = await getFlashcards(lessonId);
      setCards(data);
    })();
  }, [lessonId]);

  const handleFlip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const toValue = flipped ? 0 : 1;
    Animated.spring(flipAnim, {
      toValue,
      friction: 8,
      tension: 100,
      useNativeDriver: false,
    }).start();
    setFlipped(!flipped);
  };

  const handleAnswer = async (correct: boolean) => {
    const card = cards[currentIndex];
    Haptics.impactAsync(
      correct ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
    );
    setCompleted((prev) => ({ ...prev, [card.id]: correct ? "correct" : "wrong" }));

    await saveProgress({
      id: generateId(),
      userId: "local",
      lessonId: lessonId ?? "",
      flashcardId: card.id,
      isCorrect: correct,
      timestamp: new Date().toISOString(),
    });

    const stats = await getStats();
    await updateStats({
      totalAnswers: stats.totalAnswers + 1,
      correctAnswers: stats.correctAnswers + (correct ? 1 : 0),
    });

    if (currentIndex < cards.length - 1) {
      setFlipped(false);
      flipAnim.setValue(0);
      setCurrentIndex((i) => i + 1);
    } else {
      setDone(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setFlipped(false);
    flipAnim.setValue(0);
    setCompleted({});
    setDone(false);
  };

  if (cards.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Belum Ada Flashcard</Text>
        <Text style={styles.emptySub}>Tambahkan flashcard ke pelajaran ini dulu.</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push(`/create-flashcard/${lessonId}`)}
        >
          <Plus size={16} color={Colors.white} />
          <Text style={styles.addBtnText}>Tambah Flashcard</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (done) {
    const correctCount = Object.values(completed).filter((v) => v === "correct").length;
    const pct = Math.round((correctCount / cards.length) * 100);
    return (
      <View
        style={[
          styles.resultWrap,
          { paddingTop: Platform.OS === "web" ? 80 : insets.top + 24 },
        ]}
      >
        <Text style={styles.resultEmoji}>{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"}</Text>
        <Text style={styles.resultTitle}>Sesi Selesai!</Text>
        <Text style={styles.resultScore}>{pct}%</Text>
        <Text style={styles.resultSub}>{correctCount} / {cards.length} benar</Text>
        <View style={{ width: "100%", marginVertical: 8 }}>
          <ProgressBar
            value={pct}
            color={pct >= 80 ? Colors.success : pct >= 50 ? Colors.warning : Colors.danger}
            height={10}
          />
        </View>
        <View style={styles.resultBtns}>
          <TouchableOpacity style={styles.restartBtn} onPress={handleRestart}>
            <RotateCcw size={16} color={Colors.white} />
            <Text style={styles.restartBtnText}>Ulangi</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>Selesai</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const card = cards[currentIndex];
  const progress = (currentIndex / cards.length) * 100;

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === "web" ? 74 : insets.top + 12,
          paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20,
        },
      ]}
    >
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
          <X size={20} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.navCount}>{currentIndex + 1} / {cards.length}</Text>
        <TouchableOpacity
          onPress={() => router.push(`/create-flashcard/${lessonId}`)}
          style={styles.navBtn}
        >
          <Plus size={20} color={Colors.black} />
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <ProgressBar value={progress} height={6} />
      </View>

      {/* Tag */}
      {card.tag ? (
        <Text style={styles.cardTag}>{card.tag}</Text>
      ) : null}

      {/* Card */}
      <View style={styles.cardWrap}>
        <TouchableOpacity
          onPress={handleFlip}
          activeOpacity={0.9}
          style={styles.cardOuter}
        >
          {/* Front */}
          <Animated.View
            style={[
              styles.cardFace,
              styles.cardFront,
              { transform: [{ rotateY: frontInterpolate }] },
              { opacity: flipped ? 0 : 1 },
            ]}
          >
            {card.image && !flipped && (
              <Image
                source={{ uri: card.image }}
                style={styles.cardImage}
                resizeMode="cover"
              />
            )}
            <Text style={styles.cardHint}>Pertanyaan</Text>
            <Text style={styles.cardText}>{card.question}</Text>
            <Text style={styles.tapHint}>Tap untuk lihat jawaban</Text>
          </Animated.View>

          {/* Back */}
          <Animated.View
            style={[
              styles.cardFace,
              styles.cardBack,
              { transform: [{ rotateY: backInterpolate }] },
              { opacity: flipped ? 1 : 0, position: "absolute", top: 0 },
            ]}
          >
            {card.image && flipped && (
              <Image
                source={{ uri: card.image }}
                style={styles.cardImage}
                resizeMode="cover"
              />
            )}
            <Text style={styles.cardHint}>Jawaban</Text>
            <Text style={styles.cardText}>{card.answer}</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Actions */}
      {flipped ? (
        <View style={styles.answerBtns}>
          <TouchableOpacity
            onPress={() => handleAnswer(false)}
            style={[styles.answerBtn, styles.wrongBtn]}
          >
            <X size={24} color={Colors.danger} />
            <Text style={[styles.answerBtnText, { color: Colors.danger }]}>Salah</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleAnswer(true)}
            style={[styles.answerBtn, styles.correctBtn]}
          >
            <Check size={24} color={Colors.success} />
            <Text style={[styles.answerBtnText, { color: Colors.success }]}>Benar!</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.flipHintWrap}>
          <Text style={styles.flipHintText}>Tap kartu untuk membaliknya</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
    backgroundColor: Colors.background,
  },
  emptyTitle: { fontSize: 22, fontWeight: "900", color: Colors.black },
  emptySub: { fontSize: 14, color: Colors.textMuted, textAlign: "center", fontWeight: "500" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.black,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
  },
  addBtnText: { color: Colors.white, fontWeight: "800", fontSize: 14 },
  backLink: { marginTop: 8 },
  backLinkText: { color: Colors.primary, fontWeight: "700", fontSize: 14 },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  navCount: { fontSize: 14, fontWeight: "800", color: Colors.textSecondary },
  cardTag: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
    alignSelf: "center",
  },
  cardWrap: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cardOuter: {
    width: "100%",
    flex: 1,
  },
  cardFace: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backfaceVisibility: "hidden",
    overflow: "hidden",
  },
  cardFront: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardBack: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  cardImage: {
    width: "100%",
    height: 140,
    borderRadius: 16,
    marginBottom: 4,
  },
  cardHint: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: Colors.textMuted,
  },
  cardText: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.black,
    textAlign: "center",
    lineHeight: 28,
  },
  tapHint: { fontSize: 12, color: Colors.textMuted, fontWeight: "500" },
  answerBtns: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 14,
    paddingTop: 16,
  },
  answerBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 2,
  },
  wrongBtn: { backgroundColor: Colors.dangerLight, borderColor: "#FCA5A5" },
  correctBtn: { backgroundColor: Colors.successLight, borderColor: "#86EFAC" },
  answerBtnText: { fontSize: 16, fontWeight: "800" },
  flipHintWrap: { paddingTop: 16, alignItems: "center" },
  flipHintText: { fontSize: 13, color: Colors.textMuted, fontWeight: "500" },
  resultWrap: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.background,
  },
  resultEmoji: { fontSize: 64 },
  resultTitle: { fontSize: 26, fontWeight: "900", color: Colors.black },
  resultScore: { fontSize: 64, fontWeight: "900", color: Colors.black },
  resultSub: { fontSize: 16, color: Colors.textMuted, fontWeight: "600" },
  resultBtns: { flexDirection: "row", gap: 12, marginTop: 16, width: "100%" },
  restartBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.black,
    paddingVertical: 16,
    borderRadius: 18,
  },
  restartBtnText: { color: Colors.white, fontWeight: "800", fontSize: 15 },
  doneBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  doneBtnText: { color: Colors.black, fontWeight: "800", fontSize: 15 },
});
