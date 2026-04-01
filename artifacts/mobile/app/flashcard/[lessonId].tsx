import React, { useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, FileText, RotateCw, X } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Button } from "@/components/Button";
import { AdBanner } from "@/components/AdBanner";
import { getFlashcards, getLesson, saveProgress, generateId, type Flashcard, type Lesson } from "@/utils/storage";

const { width } = Dimensions.get("window");

export default function FlashcardPlayer() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flipAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (lessonId) loadData();
  }, [lessonId]);

  const loadData = async () => {
    const [l, cards] = await Promise.all([getLesson(lessonId), getFlashcards(lessonId)]);
    if (l) setLesson(l);
    setFlashcards(cards);
  };

  const flip = () => {
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 0 : 180,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const goNext = () => {
    if (currentIndex < flashcards.length - 1) {
      if (isFlipped) { Animated.spring(flipAnim, { toValue: 0, friction: 8, tension: 10, useNativeDriver: true }).start(); }
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex + 1), isFlipped ? 250 : 0);
    } else {
      router.back();
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      if (isFlipped) { Animated.spring(flipAnim, { toValue: 0, friction: 8, tension: 10, useNativeDriver: true }).start(); }
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex - 1), isFlipped ? 250 : 0);
    }
  };

  const markKnown = async (known: boolean) => {
    await saveProgress({
      id: generateId(),
      userId: "local",
      lessonId,
      flashcardId: flashcards[currentIndex].id,
      isCorrect: known,
      timestamp: new Date().toISOString(),
    });
    goNext();
  };

  const frontStyle = { transform: [{ rotateY: flipAnim.interpolate({ inputRange: [0, 180], outputRange: ["0deg", "180deg"] }) }] };
  const backStyle = { transform: [{ rotateY: flipAnim.interpolate({ inputRange: [0, 180], outputRange: ["180deg", "360deg"] }) }] };

  if (flashcards.length === 0) {
    return (
      <View className="flex-1 bg-white items-center justify-center p-10">
        <FileText color="#cbd5e1" size={64} />
        <Text className="text-2xl font-black mt-6 text-center">Belum Ada Flashcard</Text>
        <Text className="text-gray-400 font-bold mt-2 text-center">Tambahkan flashcard terlebih dahulu.</Text>
        <Button className="mt-8 px-8 h-14 rounded-3xl" onPress={() => router.replace(`/create-flashcard/${lessonId}`)}>
          Tambah Flashcard
        </Button>
      </View>
    );
  }

  const card = flashcards[currentIndex];

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-black pt-14 pb-6 px-6 rounded-b-[2.5rem]">
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white/10 rounded-xl items-center justify-center">
            <ArrowLeft color="white" size={20} />
          </TouchableOpacity>
          <Text className="text-white font-black">{currentIndex + 1} / {flashcards.length}</Text>
          <View className="w-10" />
        </View>
        <Text className="text-white font-black text-lg">{lesson?.name ?? ""}</Text>
        <View className="bg-white/20 rounded-full h-2 mt-3">
          <View className="bg-white rounded-full h-2" style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }} />
        </View>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        <TouchableOpacity onPress={flip} activeOpacity={0.9} style={{ width: width - 48, height: 280 }}>
          <Animated.View style={[StyleSheet.absoluteFill, frontStyle, { backfaceVisibility: "hidden" }]}>
            <View className="flex-1 bg-white rounded-[2.5rem] items-center justify-center p-8 shadow-sm border border-gray-100">
              <Text className="text-gray-400 font-black uppercase text-[10px] tracking-widest mb-4">Pertanyaan</Text>
              <Text className="text-black font-black text-xl text-center leading-relaxed">{card.question}</Text>
              <View className="flex-row items-center gap-2 mt-6">
                <RotateCw color="#94a3b8" size={14} />
                <Text className="text-gray-300 font-bold text-xs">Tap untuk balik kartu</Text>
              </View>
            </View>
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, backStyle, { backfaceVisibility: "hidden" }]}>
            <View className="flex-1 bg-black rounded-[2.5rem] items-center justify-center p-8">
              <Text className="text-gray-400 font-black uppercase text-[10px] tracking-widest mb-4">Jawaban</Text>
              <Text className="text-white font-black text-xl text-center leading-relaxed">{card.answer}</Text>
            </View>
          </Animated.View>
        </TouchableOpacity>

        <Text className="text-gray-300 font-black text-[10px] uppercase tracking-widest mt-3">{card.tag}</Text>
      </View>

      <View className="px-6 pb-6 gap-3">
        <AdBanner />
        {isFlipped ? (
          <View className="flex-row gap-3 mt-3">
            <TouchableOpacity onPress={() => markKnown(false)}
              className="flex-1 h-14 bg-red-50 rounded-[2rem] items-center justify-center flex-row gap-2 border border-red-100">
              <X color="#ef4444" size={20} />
              <Text className="text-red-600 font-black">Belum Hafal</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => markKnown(true)}
              className="flex-1 h-14 bg-emerald-50 rounded-[2rem] items-center justify-center flex-row gap-2 border border-emerald-100">
              <Check color="#10b981" size={20} />
              <Text className="text-emerald-600 font-black">Hafal!</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-row gap-3 mt-3">
            <TouchableOpacity onPress={goPrev} disabled={currentIndex === 0}
              className={`w-14 h-14 rounded-[1.5rem] items-center justify-center ${currentIndex === 0 ? "bg-gray-100" : "bg-gray-200"}`}>
              <ChevronLeft color={currentIndex === 0 ? "#d1d5db" : "#000"} size={24} />
            </TouchableOpacity>
            <TouchableOpacity onPress={goNext} className="flex-1 h-14 bg-black rounded-[2rem] items-center justify-center">
              <Text className="text-white font-black">
                {currentIndex === flashcards.length - 1 ? "Selesai" : "Lewati"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
