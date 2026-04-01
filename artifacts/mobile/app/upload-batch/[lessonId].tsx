/**
 * Upload Batch JSON Screen
 *
 * Format JSON untuk Flashcard:
 * {
 *   "lessonId": "<lessonId>",
 *   "flashcards": [
 *     { "question": "...", "answer": "...", "tag": "Key Concept" }
 *   ]
 * }
 *
 * Format JSON untuk Quiz:
 * {
 *   "lessonId": "<lessonId>",
 *   "quizzes": [
 *     {
 *       "question": "...",
 *       "options": ["A", "B", "C", "D"],
 *       "answer": "A",
 *       "type": "multiple-choice"
 *     }
 *   ]
 * }
 */
import React, { useEffect, useState } from "react";
import {
  Alert,
  Clipboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardPaste,
  FileJson,
  Upload,
  Zap,
} from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";

import { Button } from "@/components/Button";
import {
  generateId,
  getLesson,
  saveFlashcardsBatch,
  saveQuizzesBatch,
  type Flashcard,
  type Lesson,
  type Quiz,
} from "@/utils/storage";
import { validateFlashcardBatch, validateQuizBatch } from "@/utils/validateBatchJSON";

type Mode = "flashcard" | "quiz";

const FLASHCARD_EXAMPLE = `{
  "lessonId": "YOUR_LESSON_ID",
  "flashcards": [
    {
      "question": "Apa itu React Hook?",
      "answer": "Fungsi yang menggunakan state/lifecycle di function component",
      "tag": "Key Concept"
    },
    {
      "question": "Apa kegunaan useState?",
      "answer": "Mengelola state lokal di dalam function component",
      "tag": "Syntax"
    }
  ]
}`;

const QUIZ_EXAMPLE = `{
  "lessonId": "YOUR_LESSON_ID",
  "quizzes": [
    {
      "question": "Apa kepanjangan dari JSX?",
      "options": ["JavaScript XML", "Java Syntax Extension", "JavaScript Extra", "Java XML"],
      "answer": "JavaScript XML",
      "type": "multiple-choice"
    },
    {
      "question": "React dibuat oleh Facebook.",
      "options": ["True", "False"],
      "answer": "True",
      "type": "true-false"
    }
  ]
}`;

export default function UploadBatch() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [mode, setMode] = useState<Mode>("flashcard");
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showExample, setShowExample] = useState(false);

  useEffect(() => {
    if (lessonId) getLesson(lessonId).then((l) => l && setLesson(l));
  }, [lessonId]);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "application/json" });
      if (result.canceled || !result.assets?.[0]) return;
      const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
      setJsonText(content);
      setError(null);
      setSuccess(null);
    } catch {
      setError("Gagal membaca file. Pastikan file berformat .json");
    }
  };

  const handlePasteFromClipboard = async () => {
    const text = await Clipboard.getString();
    if (!text) { Alert.alert("Clipboard kosong"); return; }
    setJsonText(text);
    setError(null);
    setSuccess(null);
  };

  const handleUpload = async () => {
    if (!jsonText.trim()) { setError("JSON tidak boleh kosong."); return; }
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const parsed = JSON.parse(jsonText);

      if (mode === "flashcard") {
        const validated = validateFlashcardBatch(parsed);
        const cards: Flashcard[] = validated.flashcards.map((item) => ({
          id: generateId(),
          lessonId: lessonId,
          question: item.question,
          answer: item.answer,
          tag: item.tag,
          createdAt: new Date().toISOString(),
        }));
        await saveFlashcardsBatch(cards);
        setSuccess(`${cards.length} flashcard berhasil diimpor ke "${lesson?.name}"!`);
        setJsonText("");
      } else {
        const validated = validateQuizBatch(parsed);
        const quizzes: Quiz[] = validated.quizzes.map((item) => ({
          id: generateId(),
          lessonId: lessonId,
          question: item.question,
          options: item.options,
          answer: item.answer,
          type: item.type,
          createdAt: new Date().toISOString(),
        }));
        await saveQuizzesBatch(quizzes);
        setSuccess(`${quizzes.length} soal quiz berhasil diimpor ke "${lesson?.name}"!`);
        setJsonText("");
      }
    } catch (e: unknown) {
      if (e instanceof SyntaxError) {
        setError(`JSON tidak valid: ${e.message}`);
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Terjadi kesalahan tidak diketahui.");
      }
    } finally {
      setLoading(false);
    }
  };

  const currentExample = mode === "flashcard" ? FLASHCARD_EXAMPLE : QUIZ_EXAMPLE;

  return (
    <View className="flex-1 bg-white">
      <View className="bg-black pt-14 pb-6 px-6 rounded-b-[2.5rem]">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white/10 rounded-xl items-center justify-center">
            <ArrowLeft color="white" size={20} />
          </TouchableOpacity>
          <View>
            <Text className="text-white text-xl font-black">Upload Batch JSON</Text>
            <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">
              {lesson?.name ?? "Loading..."}
            </Text>
          </View>
        </View>

        {/* Mode Selector */}
        <View className="flex-row gap-2 mt-5">
          <TouchableOpacity
            onPress={() => { setMode("flashcard"); setError(null); setSuccess(null); }}
            className={`flex-1 py-3 rounded-2xl flex-row items-center justify-center gap-2 ${mode === "flashcard" ? "bg-white" : "bg-white/10"}`}
          >
            <BookOpen color={mode === "flashcard" ? "#000" : "#fff"} size={16} />
            <Text className={`font-black text-sm ${mode === "flashcard" ? "text-black" : "text-white"}`}>Flashcard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setMode("quiz"); setError(null); setSuccess(null); }}
            className={`flex-1 py-3 rounded-2xl flex-row items-center justify-center gap-2 ${mode === "quiz" ? "bg-white" : "bg-white/10"}`}
          >
            <Zap color={mode === "quiz" ? "#000" : "#fff"} size={16} />
            <Text className={`font-black text-sm ${mode === "quiz" ? "text-black" : "text-white"}`}>Quiz</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>

          {/* Lesson ID Info */}
          <View className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-4">
            <Text className="text-indigo-400 font-black uppercase text-[10px] tracking-widest mb-1">Lesson ID</Text>
            <Text className="text-indigo-900 font-bold text-sm font-mono">{lessonId}</Text>
            <Text className="text-indigo-400 text-xs mt-1">Gunakan ID ini di field "lessonId" dalam JSON kamu.</Text>
          </View>

          {/* Format Example */}
          <TouchableOpacity
            onPress={() => setShowExample(!showExample)}
            className="flex-row items-center justify-between bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-4"
          >
            <View className="flex-row items-center gap-2">
              <FileJson color="#6366f1" size={18} />
              <Text className="text-black font-black text-sm">Lihat Contoh Format JSON</Text>
            </View>
            <Text className="text-indigo-600 font-black text-xs">{showExample ? "Sembunyikan" : "Tampilkan"}</Text>
          </TouchableOpacity>

          {showExample && (
            <View className="bg-gray-900 rounded-2xl p-4 mb-4">
              <Text className="text-gray-300 font-mono text-xs leading-relaxed">{currentExample}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View className="flex-row gap-3 mb-4">
            <TouchableOpacity onPress={handlePickFile}
              className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl p-4 items-center gap-2">
              <Upload color="#6366f1" size={22} />
              <Text className="text-black font-black text-xs text-center">Pilih File{"\n"}.json</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePasteFromClipboard}
              className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl p-4 items-center gap-2">
              <ClipboardPaste color="#10b981" size={22} />
              <Text className="text-black font-black text-xs text-center">Paste dari{"\n"}Clipboard</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setJsonText(currentExample.replace("YOUR_LESSON_ID", lessonId)); setError(null); }}
              className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl p-4 items-center gap-2">
              <FileJson color="#f59e0b" size={22} />
              <Text className="text-black font-black text-xs text-center">Pakai{"\n"}Contoh</Text>
            </TouchableOpacity>
          </View>

          {/* JSON Input */}
          <Text className="text-gray-400 font-black uppercase text-[10px] mb-2 tracking-widest">
            JSON Input
          </Text>
          <TextInput
            placeholder={`Paste JSON ${mode === "flashcard" ? "flashcard" : "quiz"} di sini...`}
            value={jsonText}
            onChangeText={(t) => { setJsonText(t); setError(null); setSuccess(null); }}
            multiline
            className="bg-gray-50 p-4 rounded-2xl border border-gray-100 font-mono text-xs min-h-[160px] mb-4"
            placeholderTextColor="#94a3b8"
            style={{ textAlignVertical: "top" }}
          />

          {/* Error Message */}
          {!!error && (
            <View className="flex-row gap-2 bg-red-50 border border-red-100 rounded-2xl p-4 mb-4">
              <AlertCircle color="#ef4444" size={18} />
              <Text className="text-red-700 font-bold text-sm flex-1">{error}</Text>
            </View>
          )}

          {/* Success Message */}
          {!!success && (
            <View className="flex-row gap-2 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-4">
              <CheckCircle2 color="#10b981" size={18} />
              <Text className="text-emerald-700 font-bold text-sm flex-1">{success}</Text>
            </View>
          )}

          <Button className="h-14 rounded-[2rem] mb-12" onPress={handleUpload} loading={loading}>
            <View className="flex-row items-center gap-2">
              <Upload color="white" size={18} />
              <Text className="text-white font-black">Import Sekarang</Text>
            </View>
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
