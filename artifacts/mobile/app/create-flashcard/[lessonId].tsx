import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ArrowLeft, Image as ImageIcon, Save, X } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Button } from "@/components/Button";
import { generateId, getLesson, saveFlashcard, saveImage, type Flashcard, type Lesson } from "@/utils/storage";

const TAGS = ["Key Concept", "Syntax", "Vocabulary", "Example", "Pitfall"];

export default function CreateFlashcard() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [tag, setTag] = useState(TAGS[0]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (lessonId) getLesson(lessonId).then((l) => l && setLesson(l)); }, [lessonId]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Izin Diperlukan", "Butuh akses galeri."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!question.trim() || !answer.trim()) {
      Alert.alert("Error", "Pertanyaan dan jawaban wajib diisi.");
      return;
    }
    setLoading(true);
    try {
      const flashcard: Flashcard = {
        id: generateId(),
        lessonId,
        question: question.trim(),
        answer: answer.trim(),
        tag,
        image: imageUri ? await saveImage(imageUri) : "",
        createdAt: new Date().toISOString(),
      };
      await saveFlashcard(flashcard);
      Alert.alert("Berhasil!", "Flashcard ditambahkan.", [
        { text: "Tambah Lagi", onPress: () => { setQuestion(""); setAnswer(""); setImageUri(null); } },
        { text: "Selesai", onPress: () => router.back() },
      ]);
    } catch { Alert.alert("Error", "Gagal menyimpan flashcard."); }
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
            <Text className="text-white text-xl font-black">Tambah Flashcard</Text>
            <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">{lesson?.name ?? ""}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
          <Text className="text-gray-400 font-black uppercase text-[10px] mb-3 tracking-widest">Pertanyaan / Depan</Text>
          <TextInput placeholder="Contoh: Apa itu React Hooks?"
            value={question} onChangeText={setQuestion} multiline
            className="bg-gray-50 p-5 rounded-2xl border border-gray-100 font-bold text-base min-h-[80px] mb-6"
            placeholderTextColor="#94a3b8" />

          <Text className="text-gray-400 font-black uppercase text-[10px] mb-3 tracking-widest">Jawaban / Belakang</Text>
          <TextInput placeholder="Tulis jawaban di sini..."
            value={answer} onChangeText={setAnswer} multiline
            className="bg-gray-50 p-5 rounded-2xl border border-gray-100 font-bold text-base min-h-[80px] mb-6"
            placeholderTextColor="#94a3b8" />

          <Text className="text-gray-400 font-black uppercase text-[10px] mb-3 tracking-widest">Gambar (Opsional)</Text>
          {imageUri ? (
            <View className="relative w-full aspect-video rounded-[2rem] overflow-hidden border border-gray-100 mb-6">
              <Image source={{ uri: imageUri }} className="w-full h-full" resizeMode="cover" />
              <TouchableOpacity onPress={() => setImageUri(null)}
                className="absolute top-3 right-3 w-10 h-10 bg-black/50 rounded-full items-center justify-center">
                <X color="white" size={18} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={pickImage}
              className="w-full h-28 border-2 border-dashed border-gray-200 rounded-[2rem] items-center justify-center bg-gray-50 mb-6">
              <ImageIcon color="#94a3b8" size={28} />
              <Text className="text-gray-400 font-bold mt-1 text-sm">Pilih dari Galeri</Text>
            </TouchableOpacity>
          )}

          <Text className="text-gray-400 font-black uppercase text-[10px] mb-3 tracking-widest">Tag</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8">
            <View className="flex-row gap-2">
              {TAGS.map((t) => (
                <TouchableOpacity key={t} onPress={() => setTag(t)}
                  className={`px-5 py-3 rounded-2xl border ${tag === t ? "bg-black border-black" : "bg-white border-gray-100"}`}>
                  <Text className={`font-black text-sm ${tag === t ? "text-white" : "text-black"}`}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Button className="h-14 rounded-[2rem] mb-12" onPress={handleSave} loading={loading}>
            <View className="flex-row items-center gap-2">
              <Save color="white" size={18} />
              <Text className="text-white font-black">Simpan Flashcard</Text>
            </View>
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
