import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ArrowLeft, Check, RotateCcw, Trophy, X, Zap } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Button } from "@/components/Button";
import { AdBanner } from "@/components/AdBanner";
import {
  generateId,
  getLesson,
  getQuizzes,
  saveProgress,
  updateStats,
  type Lesson,
  type Progress,
  type Quiz,
} from "@/utils/storage";

export default function QuizPlayer() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (lessonId) loadData();
  }, [lessonId]);

  const loadData = async () => {
    const [l, q] = await Promise.all([getLesson(lessonId), getQuizzes(lessonId)]);
    if (l) setLesson(l);
    setQuizzes(q);
  };

  const currentQuiz = quizzes[currentIndex];

  const handleOptionSelect = async (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    const isCorrect = currentQuiz.options[idx] === currentQuiz.answer;
    if (isCorrect) setScore((s) => s + 1);
    setIsAnswered(true);
    await saveProgress({
      id: generateId(),
      userId: "local",
      lessonId,
      quizId: currentQuiz.id,
      isCorrect,
      userAnswer: currentQuiz.options[idx],
      timestamp: new Date().toISOString(),
    });
  };

  const handleNext = async () => {
    if (currentIndex < quizzes.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      const finalScore = score + (isAnswered && selectedOption !== null && currentQuiz.options[selectedOption] === currentQuiz.answer ? 0 : 0);
      await updateStats({ totalAnswers: quizzes.length, correctAnswers: score, lastStudyDate: new Date().toISOString() });
      setShowResult(true);
    }
  };

  if (quizzes.length === 0) {
    return (
      <View className="flex-1 bg-white items-center justify-center p-10">
        <Zap color="#cbd5e1" size={64} />
        <Text className="text-2xl font-black mt-6 text-center">Belum Ada Quiz</Text>
        <Text className="text-gray-400 font-bold mt-2 text-center">Tambahkan soal terlebih dahulu.</Text>
        <Button className="mt-8 px-8 h-14 rounded-3xl" onPress={() => router.replace(`/create-quiz/${lessonId}`)}>
          Tambah Quiz
        </Button>
      </View>
    );
  }

  if (showResult) {
    const pct = Math.round((score / quizzes.length) * 100);
    return (
      <View className="flex-1 bg-white items-center justify-center p-8">
        <View className="w-24 h-24 bg-indigo-100 rounded-[2rem] items-center justify-center mb-6">
          <Trophy color="#6366f1" size={48} />
        </View>
        <Text className="text-4xl font-black text-black">{pct}%</Text>
        <Text className="text-gray-400 font-bold mt-2 text-center text-lg">
          {score} dari {quizzes.length} soal benar
        </Text>
        <View className="w-full mt-8 gap-3">
          <Button className="h-14 rounded-[2rem]" onPress={() => {
            setCurrentIndex(0); setSelectedOption(null); setIsAnswered(false); setScore(0); setShowResult(false);
          }}>
            <View className="flex-row items-center gap-2"><RotateCcw color="white" size={18} /><Text className="text-white font-black">Ulangi Quiz</Text></View>
          </Button>
          <Button variant="outline" className="h-14 rounded-[2rem]" onPress={() => router.back()}>Selesai</Button>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="bg-black pt-14 pb-6 px-6 rounded-b-[2.5rem]">
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white/10 rounded-xl items-center justify-center">
            <ArrowLeft color="white" size={20} />
          </TouchableOpacity>
          <Text className="text-white font-black">{currentIndex + 1} / {quizzes.length}</Text>
          <View className="bg-white/10 px-3 py-1.5 rounded-full">
            <Text className="text-white font-black text-xs">{score} ✓</Text>
          </View>
        </View>
        <Text className="text-white font-black text-sm">{lesson?.name ?? ""}</Text>
        <View className="bg-white/20 rounded-full h-2 mt-3">
          <View className="bg-white rounded-full h-2" style={{ width: `${((currentIndex + 1) / quizzes.length) * 100}%` }} />
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 120 }}>
        <Text className="text-black font-black text-xl leading-relaxed mb-6">{currentQuiz.question}</Text>

        <AdBanner className="mb-6" />

        <View className="gap-3">
          {currentQuiz.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = opt === currentQuiz.answer;
            const showCorrect = isAnswered && isCorrect;
            const showWrong = isAnswered && isSelected && !isCorrect;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => handleOptionSelect(idx)}
                disabled={isAnswered}
                activeOpacity={0.7}
                className={`p-5 rounded-[2rem] border-2 flex-row items-center justify-between ${
                  showCorrect ? "bg-emerald-50 border-emerald-400" :
                  showWrong ? "bg-red-50 border-red-400" :
                  isSelected ? "bg-black border-black" : "bg-gray-50 border-gray-100"
                }`}
              >
                <Text className={`flex-1 font-bold text-base ${
                  showCorrect ? "text-emerald-800" :
                  showWrong ? "text-red-800" :
                  isSelected ? "text-white" : "text-black"
                }`}>{opt}</Text>
                {showCorrect && <Check color="#10b981" size={22} />}
                {showWrong && <X color="#ef4444" size={22} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View className="px-6 pb-8">
        {isAnswered && (
          <Button className="h-14 rounded-[2rem] bg-black" onPress={handleNext}>
            <Text className="text-white font-black">
              {currentIndex === quizzes.length - 1 ? "Lihat Hasil" : "Soal Berikutnya"}
            </Text>
          </Button>
        )}
      </View>
    </View>
  );
}
