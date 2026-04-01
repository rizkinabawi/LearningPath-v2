import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ArrowLeft, ChevronRight, RotateCw, Trophy } from "lucide-react-native";
import { useRouter } from "expo-router";

import { Button } from "@/components/Button";
import { getFlashcards, getProgress, getQuizzes, type Flashcard, type Progress, type Quiz } from "@/utils/storage";

type ContentItem = { type: "flashcard"; data: Flashcard } | { type: "quiz"; data: Quiz };

export default function MistakesReview() {
  const router = useRouter();
  const [mistakes, setMistakes] = useState<Progress[]>([]);
  const [contents, setContents] = useState<(ContentItem | null)[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const wrong = (await getProgress()).filter((p) => !p.isCorrect);
    setMistakes(wrong);
    const items = await Promise.all(
      wrong.map(async (p) => {
        if (p.flashcardId) {
          const all = await getFlashcards(p.lessonId);
          const fc = all.find((c) => c.id === p.flashcardId);
          return fc ? { type: "flashcard" as const, data: fc } : null;
        } else if (p.quizId) {
          const all = await getQuizzes(p.lessonId);
          const qz = all.find((q) => q.id === p.quizId);
          return qz ? { type: "quiz" as const, data: qz } : null;
        }
        return null;
      })
    );
    setContents(items);
    setLoading(false);
  };

  const handleNext = () => {
    if (currentIndex < mistakes.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsAnswerVisible(false);
    } else {
      router.back();
    }
  };

  if (loading) return null;

  if (mistakes.length === 0) {
    return (
      <View className="flex-1 bg-white items-center justify-center p-10">
        <Trophy color="#fbbf24" size={64} />
        <Text className="text-2xl font-black mt-6 text-center">Tidak Ada Kesalahan!</Text>
        <Text className="text-gray-400 font-bold mt-2 text-center">Semua jawaban kamu benar. Luar biasa!</Text>
        <Button className="mt-8 px-8 h-14 rounded-3xl" onPress={() => router.back()}>Kembali</Button>
      </View>
    );
  }

  const currentMistake = mistakes[currentIndex];
  const currentContent = contents[currentIndex];

  return (
    <View className="flex-1 bg-white">
      <View className="bg-black pt-14 pb-6 px-6 rounded-b-[2.5rem]">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white/10 rounded-xl items-center justify-center">
            <ArrowLeft color="white" size={20} />
          </TouchableOpacity>
          <Text className="text-white font-black">{currentIndex + 1} / {mistakes.length}</Text>
          <View className="w-10" />
        </View>
        <Text className="text-white text-xl font-black mt-3">Review Kesalahan</Text>
        <View className="bg-white/20 rounded-full h-2 mt-3">
          <View className="bg-white rounded-full h-2" style={{ width: `${((currentIndex + 1) / mistakes.length) * 100}%` }} />
        </View>
      </View>

      <ScrollView className="flex-1 p-6" contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="bg-gray-50 border border-gray-100 rounded-[2rem] p-6 mb-6">
          <Text className="text-gray-400 font-black uppercase text-[10px] mb-3 tracking-widest">
            {currentContent?.type === "flashcard" ? "Pertanyaan Flashcard" : "Soal Quiz"}
          </Text>
          <Text className="text-black font-black text-lg leading-relaxed">
            {currentContent?.data.question ?? "—"}
          </Text>
        </View>

        {currentContent?.type === "quiz" && (
          <View className="bg-red-50 border border-red-100 rounded-[2rem] p-6 mb-6">
            <Text className="text-red-400 font-black uppercase text-[10px] mb-2 tracking-widest">Jawaban Kamu</Text>
            <Text className="text-red-600 font-bold line-through">{currentMistake.userAnswer ?? "—"}</Text>
          </View>
        )}

        {!isAnswerVisible ? (
          <TouchableOpacity
            onPress={() => setIsAnswerVisible(true)}
            className="bg-black p-6 rounded-[2rem] items-center justify-center"
          >
            <RotateCw color="white" size={22} />
            <Text className="text-white font-black text-base mt-2 text-center">Tampilkan Jawaban Benar</Text>
          </TouchableOpacity>
        ) : (
          <View className="bg-emerald-600 p-6 rounded-[2rem]">
            <Text className="text-emerald-100 font-black uppercase text-[10px] mb-3 tracking-widest">Jawaban Benar</Text>
            <Text className="text-white text-xl font-black leading-tight text-center">
              {currentContent?.type === "flashcard"
                ? currentContent.data.answer
                : currentContent?.data.answer ?? "—"}
            </Text>
          </View>
        )}
      </ScrollView>

      <View className="px-6 pb-8">
        <Button className="h-14 rounded-[2rem] bg-black" onPress={handleNext}>
          <View className="flex-row items-center gap-2">
            <Text className="text-white font-black">
              {currentIndex === mistakes.length - 1 ? "Selesai Review" : "Kesalahan Berikutnya"}
            </Text>
            <ChevronRight color="white" size={20} />
          </View>
        </Button>
      </View>
    </View>
  );
}
