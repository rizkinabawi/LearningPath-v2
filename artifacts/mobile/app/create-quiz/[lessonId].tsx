import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ArrowLeft, Check, Plus } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Button } from "@/components/Button";
import { generateId, getLesson, saveQuiz, type Lesson, type Quiz } from "@/utils/storage";

export default function CreateQuiz() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (lessonId) getLesson(lessonId).then((l) => l && setLesson(l)); }, [lessonId]);

  const updateOption = (idx: number, text: string) => {
    const opts = [...options];
    opts[idx] = text;
    setOptions(opts);
  };

  const handleSave = async () => {
    if (!question.trim() || options.some((o) => !o.trim())) {
      Alert.alert("Error", "Isi semua opsi jawaban.");
      return;
    }
    setLoading(true);
    try {
      const quiz: Quiz = {
        id: generateId(),
        lessonId,
        question: question.trim(),
        options: options.map((o) => o.trim()),
        answer: options[correctAnswer].trim(),
        type: "multiple-choice",
        createdAt: new Date().toISOString(),
      };
      await saveQuiz(quiz);
      Alert.alert("Berhasil!", "Soal ditambahkan.", [
        { text: "Tambah Lagi", onPress: () => { setQuestion(""); setOptions(["", "", "", ""]); setCorrectAnswer(0); } },
        { text: "Selesai", onPress: () => router.back() },
      ]);
    } catch { Alert.alert("Error", "Gagal menyimpan soal."); }
    finally { setLoading(false); }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="bg-black pt-14 pb-6 px-6 rounded-b-[2.5rem]">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white/10 rounded-xl items-center justify-center">
            <ArrowLeft color="white" size={20} />
          </TouchableOpacity>
          <View>
            <Text className="text-white text-xl font-black">Tambah Soal Quiz</Text>
            <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">{lesson?.name ?? ""}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
          <Text className="text-gray-400 font-black uppercase text-[10px] mb-3 tracking-widest">Pertanyaan</Text>
          <TextInput placeholder="Tulis soal di sini..." value={question} onChangeText={setQuestion} multiline
            className="bg-gray-50 p-5 rounded-2xl border border-gray-100 font-bold text-base min-h-[80px] mb-6"
            placeholderTextColor="#94a3b8" />

          <Text className="text-gray-400 font-black uppercase text-[10px] mb-3 tracking-widest">
            Pilihan Jawaban (centang yang benar)
          </Text>
          <View className="gap-3 mb-8">
            {options.map((opt, idx) => (
              <View key={idx} className="flex-row items-center gap-3">
                <TouchableOpacity
                  onPress={() => setCorrectAnswer(idx)}
                  className={`w-8 h-8 rounded-full border-2 items-center justify-center ${correctAnswer === idx ? "bg-black border-black" : "border-gray-200"}`}
                >
                  {correctAnswer === idx && <Check color="white" size={14} />}
                </TouchableOpacity>
                <TextInput
                  placeholder={`Pilihan ${String.fromCharCode(65 + idx)}`}
                  value={opt}
                  onChangeText={(t) => updateOption(idx, t)}
                  className="flex-1 bg-gray-50 p-4 rounded-2xl border border-gray-100 font-bold"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            ))}
          </View>

          <Button className="h-14 rounded-[2rem] mb-12" onPress={handleSave} loading={loading}>
            <View className="flex-row items-center gap-2">
              <Plus color="white" size={18} />
              <Text className="text-white font-black">Tambah Soal</Text>
            </View>
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
