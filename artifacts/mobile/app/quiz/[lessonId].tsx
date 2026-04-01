import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, ChevronRight, Check, Plus, RotateCcw } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import {
  getQuizzes,
  saveProgress,
  updateStats,
  getStats,
  generateId,
  type Quiz,
} from "@/utils/storage";
import Colors from "@/constants/colors";
import { ProgressBar } from "@/components/ProgressBar";

export default function QuizScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await getQuizzes(lessonId);
      setQuizzes(data);
    })();
  }, [lessonId]);

  const currentQuiz = quizzes[currentIndex];
  const progress = (currentIndex / Math.max(quizzes.length, 1)) * 100;

  const handleOptionSelect = async (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    const correct = currentQuiz.options[idx] === currentQuiz.answer;
    Haptics.impactAsync(
      correct ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
    );

    if (correct) setScore((s) => s + 1);

    await saveProgress({
      id: generateId(),
      userId: "local",
      lessonId: lessonId ?? "",
      quizId: currentQuiz.id,
      isCorrect: correct,
      userAnswer: currentQuiz.options[idx],
      timestamp: new Date().toISOString(),
    });

    const stats = await getStats();
    await updateStats({
      totalAnswers: stats.totalAnswers + 1,
      correctAnswers: stats.correctAnswers + (correct ? 1 : 0),
    });
  };

  const handleNext = () => {
    if (currentIndex < quizzes.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setDone(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setDone(false);
  };

  if (quizzes.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Belum Ada Soal</Text>
        <Text style={styles.emptySub}>Tambahkan soal quiz ke pelajaran ini dulu.</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push(`/create-quiz/${lessonId}`)}
        >
          <Plus size={16} color={Colors.white} />
          <Text style={styles.addBtnText}>Tambah Soal</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (done) {
    const pct = Math.round((score / quizzes.length) * 100);
    return (
      <View
        style={[
          styles.resultWrap,
          { paddingTop: Platform.OS === "web" ? 80 : insets.top + 24 },
        ]}
      >
        <Text style={styles.resultEmoji}>{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"}</Text>
        <Text style={styles.resultTitle}>Quiz Selesai!</Text>
        <Text style={styles.resultScore}>{pct}%</Text>
        <Text style={styles.resultSub}>{score} / {quizzes.length} benar</Text>
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
        <Text style={styles.navCount}>{currentIndex + 1} / {quizzes.length}</Text>
        <TouchableOpacity
          onPress={() => router.push(`/create-quiz/${lessonId}`)}
          style={styles.navBtn}
        >
          <Plus size={20} color={Colors.black} />
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <ProgressBar value={progress} height={6} />
      </View>

      {/* Question + Image */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.questionCard}>
          <Text style={styles.questionLabel}>Soal {currentIndex + 1}</Text>
          {/* Image above question */}
          {currentQuiz.image && (
            <Image
              source={{ uri: currentQuiz.image }}
              style={styles.questionImage}
              resizeMode="cover"
            />
          )}
          <Text style={styles.questionText}>{currentQuiz.question}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsWrap}>
          {currentQuiz.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrectAnswer = opt === currentQuiz.answer;
            const showCorrect = isAnswered && isCorrectAnswer;
            const showWrong = isAnswered && isSelected && !isCorrectAnswer;

            return (
              <TouchableOpacity
                key={idx}
                onPress={() => handleOptionSelect(idx)}
                disabled={isAnswered}
                activeOpacity={0.7}
                style={[
                  styles.option,
                  showCorrect && styles.optionCorrect,
                  showWrong && styles.optionWrong,
                  isSelected && !isAnswered && styles.optionSelected,
                ]}
              >
                <View
                  style={[
                    styles.optionBadge,
                    showCorrect && styles.badgeCorrect,
                    showWrong && styles.badgeWrong,
                    isSelected && !isAnswered && styles.badgeSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionBadgeText,
                      (showCorrect || showWrong || isSelected) && styles.optionBadgeTextActive,
                    ]}
                  >
                    {String.fromCharCode(65 + idx)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.optionText,
                    showCorrect && { color: Colors.success },
                    showWrong && { color: Colors.danger },
                    isSelected && !isAnswered && { color: Colors.black },
                  ]}
                >
                  {opt}
                </Text>
                {showCorrect && <Check size={18} color={Colors.success} />}
                {showWrong && <X size={18} color={Colors.danger} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Platform.OS === "web" ? 20 : insets.bottom + 20 },
        ]}
      >
        {isAnswered && (
          <TouchableOpacity onPress={handleNext} style={styles.nextBtn}>
            <Text style={styles.nextBtnText}>
              {currentIndex === quizzes.length - 1 ? "Lihat Hasil" : "Soal Berikutnya"}
            </Text>
            <ChevronRight size={20} color={Colors.white} />
          </TouchableOpacity>
        )}
      </View>
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
  questionCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 10,
    overflow: "hidden",
  },
  questionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  questionImage: {
    width: "100%",
    height: 160,
    borderRadius: 16,
  },
  questionText: {
    fontSize: 19,
    fontWeight: "800",
    color: Colors.black,
    lineHeight: 26,
  },
  optionsWrap: { gap: 10 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    gap: 14,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  optionSelected: { borderColor: Colors.black, backgroundColor: Colors.surface },
  optionCorrect: { borderColor: Colors.success, backgroundColor: Colors.successLight },
  optionWrong: { borderColor: Colors.danger, backgroundColor: Colors.dangerLight },
  optionBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  badgeSelected: { backgroundColor: Colors.black, borderColor: Colors.black },
  badgeCorrect: { backgroundColor: Colors.success, borderColor: Colors.success },
  badgeWrong: { backgroundColor: Colors.danger, borderColor: Colors.danger },
  optionBadgeText: { fontSize: 13, fontWeight: "800", color: Colors.textSecondary },
  optionBadgeTextActive: { color: Colors.white },
  optionText: { flex: 1, fontSize: 15, fontWeight: "600", color: Colors.black },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.black,
    paddingVertical: 18,
    borderRadius: 20,
  },
  nextBtnText: { color: Colors.white, fontWeight: "800", fontSize: 16 },
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
