import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { BookOpen, User as UserIcon, Target, Brain } from "lucide-react-native";
import { useRouter } from "expo-router";

import { Button } from "@/components/Button";
import { saveUser, generateId, type User } from "@/utils/storage";

type Level = "beginner" | "intermediate" | "advanced";

export default function Onboarding() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState<Level>("beginner");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !goal.trim() || !topic.trim()) {
      Alert.alert("Data Kurang", "Lengkapi semua kolom untuk memulai perjalanan belajarmu!");
      return;
    }
    setLoading(true);
    const user: User = {
      id: generateId(),
      name: name.trim(),
      goal: goal.trim(),
      topic: topic.trim(),
      level,
      createdAt: new Date().toISOString(),
    };
    await saveUser(user);
    setLoading(false);
    router.replace("/(tabs)");
  };

  const LevelBtn = ({ val, label }: { val: Level; label: string }) => (
    <TouchableOpacity
      onPress={() => setLevel(val)}
      className={`flex-1 py-4 rounded-2xl border-2 items-center ${
        level === val ? "border-black bg-black" : "border-gray-100 bg-white"
      }`}
    >
      <Text className={`font-black text-sm ${level === val ? "text-white" : "text-gray-400"}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 28, justifyContent: "center" }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="items-center mb-10">
          <View className="w-20 h-20 bg-black rounded-[2rem] items-center justify-center mb-6">
            <BookOpen color="white" size={40} />
          </View>
          <Text className="text-4xl font-black text-center text-black">Ayo Mulai!</Text>
          <Text className="text-gray-400 text-center mt-2 text-base font-bold px-4">
            Rancang perjalanan belajarmu yang fleksibel dan personal.
          </Text>
        </View>

        {/* Fields */}
        <View className="gap-5">
          <View>
            <View className="flex-row items-center mb-2 gap-2">
              <UserIcon color="black" size={14} />
              <Text className="font-black text-black uppercase tracking-widest text-[10px]">
                Siapa namamu?
              </Text>
            </View>
            <TextInput
              placeholder="Masukkan namamu"
              value={name}
              onChangeText={setName}
              className="bg-gray-50 p-5 rounded-2xl border border-gray-100 font-bold text-base text-black"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View>
            <View className="flex-row items-center mb-2 gap-2">
              <Target color="black" size={14} />
              <Text className="font-black text-black uppercase tracking-widest text-[10px]">
                Apa target belajarmu?
              </Text>
            </View>
            <TextInput
              placeholder="Contoh: Kuasai React Native, Lulus JLPT N3"
              value={goal}
              onChangeText={setGoal}
              className="bg-gray-50 p-5 rounded-2xl border border-gray-100 font-bold text-base text-black"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View>
            <View className="flex-row items-center mb-2 gap-2">
              <Brain color="black" size={14} />
              <Text className="font-black text-black uppercase tracking-widest text-[10px]">
                Topik Utama?
              </Text>
            </View>
            <TextInput
              placeholder="Contoh: Pemrograman, Bahasa Jepang, Musik"
              value={topic}
              onChangeText={setTopic}
              className="bg-gray-50 p-5 rounded-2xl border border-gray-100 font-bold text-base text-black"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View>
            <Text className="font-black text-black uppercase tracking-widest text-[10px] mb-3">
              Level Saat Ini
            </Text>
            <View className="flex-row gap-2">
              <LevelBtn val="beginner" label="Pemula" />
              <LevelBtn val="intermediate" label="Menengah" />
              <LevelBtn val="advanced" label="Mahir" />
            </View>
          </View>

          <Button className="mt-6 h-16 rounded-[2rem]" onPress={handleSubmit} loading={loading}>
            Mulai Belajar Sekarang
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
