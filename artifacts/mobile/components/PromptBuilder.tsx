import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Clipboard,
} from "react-native";
import {
  BookOpen,
  Beaker,
  Check,
  ChevronRight,
  Code2,
  Copy,
  Divide,
  FileText,
  History,
  Share2,
  Sparkles,
} from "lucide-react-native";
import { Button } from "./Button";
import { Card, CardContent } from "./Card";
import { PROMPT_TEMPLATES, generatePrompt, type TemplateTopic } from "@/utils/prompt-templates";

const TOPIC_ICONS: Record<TemplateTopic, React.ElementType> = {
  Programming: Code2,
  Language: BookOpen,
  Science: Beaker,
  Math: Divide,
  History: History,
  General: FileText,
};

interface PromptBuilderProps {
  lessonId?: string;
}

export const PromptBuilder = ({ lessonId }: PromptBuilderProps) => {
  const [topic, setTopic] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<TemplateTopic | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = (template: string) => {
    if (!topic.trim()) {
      Alert.alert("Topik Kosong", "Masukkan topik terlebih dahulu!");
      return;
    }
    const prompt = generatePrompt(template, topic.trim(), lessonId);
    setGeneratedPrompt(prompt);
    setCopied(false);
  };

  const copyToClipboard = () => {
    Clipboard.setString(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: generatedPrompt });
    } catch {}
  };

  const topics = Object.keys(TOPIC_ICONS) as TemplateTopic[];

  return (
    <View className="space-y-6">
      {/* Step 1 */}
      <View>
        <Text className="text-gray-400 font-black uppercase tracking-widest text-[10px] mb-3">
          1. Masukkan Topik
        </Text>
        <TextInput
          placeholder="Contoh: React Hooks, Bahasa Jepang, Fisika Kuantum..."
          value={topic}
          onChangeText={setTopic}
          className="bg-gray-50 p-5 rounded-2xl border border-gray-100 font-bold text-lg"
          placeholderTextColor="#94a3b8"
        />
      </View>

      {/* Step 2 */}
      <View>
        <Text className="text-gray-400 font-black uppercase tracking-widest text-[10px] mb-3">
          2. Pilih Kategori
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-3">
            {topics.map((t) => {
              const Icon = TOPIC_ICONS[t];
              const isSelected = selectedTopic === t;
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => setSelectedTopic(t)}
                  className={`px-5 py-4 rounded-3xl flex-row items-center gap-2 ${
                    isSelected ? "bg-black" : "bg-gray-50 border border-gray-100"
                  }`}
                >
                  <Icon color={isSelected ? "white" : "black"} size={16} />
                  <Text className={`font-black ${isSelected ? "text-white" : "text-black"}`}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Step 3 */}
      {selectedTopic && (
        <View>
          <Text className="text-gray-400 font-black uppercase tracking-widest text-[10px] mb-3">
            3. Pilih Template
          </Text>
          <View className="gap-3">
            {PROMPT_TEMPLATES.filter((t) => t.topic === selectedTopic).map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => handleGenerate(t.template)}
                className="bg-white border border-gray-100 p-5 rounded-2xl flex-row items-center justify-between"
              >
                <View className="flex-1">
                  <Text className="text-black font-black text-base">{t.title}</Text>
                  <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-1">
                    {t.type} · JSON Format
                  </Text>
                </View>
                <View className="w-10 h-10 bg-indigo-50 rounded-full items-center justify-center ml-3">
                  <ChevronRight color="#6366f1" size={18} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Result */}
      {!!generatedPrompt && (
        <View className="mt-4 bg-indigo-50 p-6 rounded-[2.5rem] border border-indigo-100">
          <View className="flex-row items-center gap-2 mb-4">
            <Sparkles color="#6366f1" size={18} />
            <Text className="text-indigo-900 font-black uppercase tracking-widest text-xs">
              Prompt Siap Pakai
            </Text>
          </View>
          <Text className="text-indigo-900 font-bold leading-relaxed text-sm mb-6">
            {generatedPrompt}
          </Text>
          {!!lessonId && (
            <View className="bg-indigo-100 rounded-xl p-3 mb-4">
              <Text className="text-indigo-700 font-black text-[10px] uppercase tracking-widest mb-1">
                Lesson ID sudah otomatis diisi:
              </Text>
              <Text className="text-indigo-900 font-bold text-xs">{lessonId}</Text>
            </View>
          )}
          <View className="flex-row gap-3">
            <Button className="flex-1 h-12 bg-indigo-600 rounded-2xl" onPress={copyToClipboard}>
              <View className="flex-row items-center gap-2">
                {copied ? <Check color="white" size={18} /> : <Copy color="white" size={18} />}
                <Text className="text-white font-black">
                  {copied ? "Tersalin!" : "Salin Prompt"}
                </Text>
              </View>
            </Button>
            <TouchableOpacity
              onPress={handleShare}
              className="w-12 h-12 bg-white border border-indigo-200 rounded-2xl items-center justify-center"
            >
              <Share2 color="#6366f1" size={20} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};
