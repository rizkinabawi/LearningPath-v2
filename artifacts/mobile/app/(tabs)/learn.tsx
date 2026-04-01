import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import {
  BookOpen,
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  Code2,
  Cpu,
  Globe,
  Languages,
  Layout as LayoutIcon,
  MessageSquare,
  NotebookPen,
  Plus,
  Settings,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react-native";
import { useRouter } from "expo-router";

import { Button } from "@/components/Button";
import { Card, CardContent } from "@/components/Card";
import { PromptBuilder } from "@/components/PromptBuilder";
import {
  generateId,
  getLearningPaths,
  getLessons,
  getModules,
  saveLearningPath,
  saveLesson,
  saveModule,
  getUser,
  type Lesson,
  type LearningPath,
  type Module,
} from "@/utils/storage";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MODULE_ICONS = [
  { name: "Book", icon: BookOpen },
  { name: "Code", icon: Code2 },
  { name: "Logic", icon: Cpu },
  { name: "Web", icon: Globe },
  { name: "Lang", icon: Languages },
  { name: "UI", icon: LayoutIcon },
  { name: "Chat", icon: MessageSquare },
  { name: "Setup", icon: Settings },
];

const topPadding = Platform.OS === "web" ? 67 : 0;

export default function LearnPage() {
  const router = useRouter();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [activePath, setActivePath] = useState<LearningPath | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [isPromptBuilderOpen, setIsPromptBuilderOpen] = useState(false);
  const [isCreatePathOpen, setIsCreatePathOpen] = useState(false);
  const [isCreateModuleOpen, setIsCreateModuleOpen] = useState(false);
  const [isCreateLessonOpen, setIsCreateLessonOpen] = useState(false);
  const [newPathName, setNewPathName] = useState("");
  const [newPathDesc, setNewPathDesc] = useState("");
  const [newModuleName, setNewModuleName] = useState("");
  const [newModuleIcon, setNewModuleIcon] = useState(MODULE_ICONS[0].name);
  const [newLessonName, setNewLessonName] = useState("");
  const [newLessonDesc, setNewLessonDesc] = useState("");
  const [targetModuleId, setTargetModuleId] = useState<string | null>(null);
  const [promptLessonId, setPromptLessonId] = useState<string | undefined>(undefined);

  const loadPaths = async () => {
    const data = await getLearningPaths();
    setPaths(data);
    if (data.length > 0 && !activePath) setActivePath(data[0]);
  };

  const loadModules = async () => {
    if (!activePath) return;
    const data = await getModules(activePath.id);
    const sorted = data.sort((a, b) => a.order - b.order);
    setModules(sorted);
    const lessonsData: Record<string, Lesson[]> = {};
    for (const mod of sorted) {
      const l = await getLessons(mod.id);
      lessonsData[mod.id] = l.sort((a, b) => a.order - b.order);
    }
    setLessons(lessonsData);
  };

  useEffect(() => { loadPaths(); }, []);
  useEffect(() => { if (activePath) loadModules(); }, [activePath]);

  const handleCreatePath = async () => {
    if (!newPathName.trim()) return;
    const user = await getUser();
    const path: LearningPath = {
      id: generateId(),
      name: newPathName.trim(),
      description: newPathDesc.trim(),
      userId: user?.id ?? "local",
      createdAt: new Date().toISOString(),
    };
    await saveLearningPath(path);
    setNewPathName(""); setNewPathDesc("");
    setIsCreatePathOpen(false);
    await loadPaths();
    setActivePath(path);
  };

  const handleCreateModule = async () => {
    if (!newModuleName.trim() || !activePath) return;
    const mod: Module = {
      id: generateId(),
      pathId: activePath.id,
      name: newModuleName.trim(),
      description: "",
      icon: newModuleIcon,
      order: modules.length,
      createdAt: new Date().toISOString(),
    };
    await saveModule(mod);
    setNewModuleName("");
    setIsCreateModuleOpen(false);
    loadModules();
  };

  const handleCreateLesson = async () => {
    if (!newLessonName.trim() || !targetModuleId) return;
    const lesson: Lesson = {
      id: generateId(),
      moduleId: targetModuleId,
      name: newLessonName.trim(),
      description: newLessonDesc.trim(),
      order: (lessons[targetModuleId] || []).length,
      createdAt: new Date().toISOString(),
      notes: "",
    };
    await saveLesson(lesson);
    setNewLessonName(""); setNewLessonDesc("");
    setIsCreateLessonOpen(false);
    loadModules();
  };

  const toggleModule = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const IconComp = ({ name, color, size }: { name: string; color: string; size: number }) => {
    const found = MODULE_ICONS.find((m) => m.name === name);
    const Icon = found ? found.icon : BookOpen;
    return <Icon color={color} size={size} />;
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: topPadding }}>
      {/* Header */}
      <View className="bg-black pt-14 pb-6 px-6 rounded-b-[2.5rem]">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-2xl font-black">Belajar</Text>
            <Text className="text-gray-400 text-xs font-bold mt-1">Kelola Learning Path-mu</Text>
          </View>
          <TouchableOpacity
            onPress={() => setIsPromptBuilderOpen(true)}
            className="w-10 h-10 bg-indigo-600 rounded-xl items-center justify-center"
          >
            <Sparkles color="white" size={18} />
          </TouchableOpacity>
        </View>

        {/* Path Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4">
          <View className="flex-row gap-2">
            {paths.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => setActivePath(p)}
                className={`px-4 py-2 rounded-2xl ${
                  activePath?.id === p.id ? "bg-white" : "bg-white/10"
                }`}
              >
                <Text className={`font-black text-sm ${activePath?.id === p.id ? "text-black" : "text-white"}`}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setIsCreatePathOpen(true)}
              className="w-9 h-9 bg-white/10 rounded-xl items-center justify-center"
            >
              <Plus color="white" size={18} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-5 pt-5" contentContainerStyle={{ paddingBottom: 120 }}>
        {!activePath ? (
          <View className="items-center py-20">
            <NotebookPen color="#cbd5e1" size={60} />
            <Text className="text-gray-400 font-black text-lg mt-4 text-center">
              Buat Learning Path pertamamu!
            </Text>
            <Button className="mt-6 px-8" onPress={() => setIsCreatePathOpen(true)}>
              Buat Path
            </Button>
          </View>
        ) : (
          <>
            {modules.map((mod) => (
              <View key={mod.id} className="mb-3">
                <TouchableOpacity
                  onPress={() => toggleModule(mod.id)}
                  className="bg-gray-50 border border-gray-100 p-5 rounded-[2rem] flex-row items-center justify-between"
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 bg-black rounded-xl items-center justify-center">
                      <IconComp name={mod.icon ?? "Book"} color="white" size={16} />
                    </View>
                    <View>
                      <Text className="text-black font-black">{mod.name}</Text>
                      <Text className="text-gray-400 text-xs font-bold">
                        {(lessons[mod.id] || []).length} pelajaran
                      </Text>
                    </View>
                  </View>
                  {expandedModules[mod.id] ? (
                    <ChevronDown color="#94a3b8" size={18} />
                  ) : (
                    <ChevronRight color="#94a3b8" size={18} />
                  )}
                </TouchableOpacity>

                {expandedModules[mod.id] && (
                  <View className="mt-2 ml-4 gap-2">
                    {(lessons[mod.id] || []).map((lesson) => (
                      <View
                        key={lesson.id}
                        className="bg-white border border-gray-100 p-4 rounded-2xl"
                      >
                        <Text className="text-black font-black text-sm">{lesson.name}</Text>
                        {!!lesson.description && (
                          <Text className="text-gray-400 text-xs font-bold mt-1">{lesson.description}</Text>
                        )}
                        <View className="flex-row gap-2 mt-3">
                          <TouchableOpacity
                            className="flex-1 bg-indigo-50 rounded-xl py-2 items-center flex-row justify-center gap-1"
                            onPress={() => router.push(`/flashcard/${lesson.id}`)}
                          >
                            <BookOpen color="#6366f1" size={14} />
                            <Text className="text-indigo-700 font-black text-xs">Flashcard</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            className="flex-1 bg-amber-50 rounded-xl py-2 items-center flex-row justify-center gap-1"
                            onPress={() => router.push(`/quiz/${lesson.id}`)}
                          >
                            <Zap color="#f59e0b" size={14} />
                            <Text className="text-amber-700 font-black text-xs">Quiz</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            className="flex-1 bg-emerald-50 rounded-xl py-2 items-center flex-row justify-center gap-1"
                            onPress={() => {
                              setPromptLessonId(lesson.id);
                              setIsPromptBuilderOpen(true);
                            }}
                          >
                            <Sparkles color="#10b981" size={14} />
                            <Text className="text-emerald-700 font-black text-xs">Prompt</Text>
                          </TouchableOpacity>
                        </View>
                        <View className="flex-row gap-2 mt-2">
                          <TouchableOpacity
                            className="flex-1 bg-gray-50 rounded-xl py-2 items-center"
                            onPress={() => router.push(`/create-flashcard/${lesson.id}`)}
                          >
                            <Text className="text-gray-600 font-black text-xs">+ Flashcard</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            className="flex-1 bg-gray-50 rounded-xl py-2 items-center"
                            onPress={() => router.push(`/create-quiz/${lesson.id}`)}
                          >
                            <Text className="text-gray-600 font-black text-xs">+ Quiz</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            className="flex-1 bg-gray-50 rounded-xl py-2 items-center"
                            onPress={() => router.push(`/upload-batch/${lesson.id}`)}
                          >
                            <Text className="text-gray-600 font-black text-xs">Upload JSON</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                    <TouchableOpacity
                      onPress={() => { setTargetModuleId(mod.id); setIsCreateLessonOpen(true); }}
                      className="border-2 border-dashed border-gray-200 rounded-2xl p-3 items-center"
                    >
                      <Text className="text-gray-400 font-black text-xs">+ Tambah Pelajaran</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}

            <TouchableOpacity
              onPress={() => setIsCreateModuleOpen(true)}
              className="border-2 border-dashed border-gray-200 rounded-[2rem] p-5 items-center mt-2"
            >
              <Plus color="#94a3b8" size={24} />
              <Text className="text-gray-400 font-bold mt-1">Tambah Modul</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Prompt Builder Modal */}
      <Modal visible={isPromptBuilderOpen} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-white">
          <View className="bg-black pt-12 pb-6 px-6 rounded-b-[2.5rem]">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white text-xl font-black">Prompt Builder</Text>
                <Text className="text-gray-400 text-xs font-bold mt-1">
                  Generate JSON-formatted prompts untuk AI
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => { setIsPromptBuilderOpen(false); setPromptLessonId(undefined); }}
                className="w-10 h-10 bg-white/10 rounded-xl items-center justify-center"
              >
                <Text className="text-white font-black">✕</Text>
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
            <PromptBuilder lessonId={promptLessonId} />
          </ScrollView>
        </View>
      </Modal>

      {/* Create Path Modal */}
      <Modal visible={isCreatePathOpen} animationType="slide" presentationStyle="formSheet">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-white p-6 pt-12">
          <Text className="text-2xl font-black mb-6">Buat Learning Path</Text>
          <TextInput placeholder="Nama path" value={newPathName} onChangeText={setNewPathName}
            className="bg-gray-50 p-4 rounded-2xl border border-gray-100 font-bold mb-3" placeholderTextColor="#94a3b8" />
          <TextInput placeholder="Deskripsi (opsional)" value={newPathDesc} onChangeText={setNewPathDesc}
            className="bg-gray-50 p-4 rounded-2xl border border-gray-100 font-bold mb-6" placeholderTextColor="#94a3b8" />
          <View className="flex-row gap-3">
            <Button variant="outline" className="flex-1" onPress={() => setIsCreatePathOpen(false)}>Batal</Button>
            <Button className="flex-1" onPress={handleCreatePath}>Buat</Button>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Create Module Modal */}
      <Modal visible={isCreateModuleOpen} animationType="slide" presentationStyle="formSheet">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-white p-6 pt-12">
          <Text className="text-2xl font-black mb-6">Tambah Modul</Text>
          <TextInput placeholder="Nama modul" value={newModuleName} onChangeText={setNewModuleName}
            className="bg-gray-50 p-4 rounded-2xl border border-gray-100 font-bold mb-4" placeholderTextColor="#94a3b8" />
          <Text className="font-black text-xs uppercase tracking-widest text-gray-400 mb-3">Pilih Ikon</Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {MODULE_ICONS.map(({ name, icon: Icon }) => (
              <TouchableOpacity key={name} onPress={() => setNewModuleIcon(name)}
                className={`w-12 h-12 rounded-xl items-center justify-center border-2 ${newModuleIcon === name ? "border-black bg-black" : "border-gray-100 bg-gray-50"}`}>
                <Icon color={newModuleIcon === name ? "white" : "black"} size={18} />
              </TouchableOpacity>
            ))}
          </View>
          <View className="flex-row gap-3">
            <Button variant="outline" className="flex-1" onPress={() => setIsCreateModuleOpen(false)}>Batal</Button>
            <Button className="flex-1" onPress={handleCreateModule}>Tambah</Button>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Create Lesson Modal */}
      <Modal visible={isCreateLessonOpen} animationType="slide" presentationStyle="formSheet">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-white p-6 pt-12">
          <Text className="text-2xl font-black mb-6">Tambah Pelajaran</Text>
          <TextInput placeholder="Nama pelajaran" value={newLessonName} onChangeText={setNewLessonName}
            className="bg-gray-50 p-4 rounded-2xl border border-gray-100 font-bold mb-3" placeholderTextColor="#94a3b8" />
          <TextInput placeholder="Deskripsi (opsional)" value={newLessonDesc} onChangeText={setNewLessonDesc}
            className="bg-gray-50 p-4 rounded-2xl border border-gray-100 font-bold mb-6" placeholderTextColor="#94a3b8" />
          <View className="flex-row gap-3">
            <Button variant="outline" className="flex-1" onPress={() => setIsCreateLessonOpen(false)}>Batal</Button>
            <Button className="flex-1" onPress={handleCreateLesson}>Tambah</Button>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
