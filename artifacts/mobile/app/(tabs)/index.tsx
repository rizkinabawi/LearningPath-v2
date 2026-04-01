import React, { useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { ArrowRight, BookOpen, Compass, Play, Plus, Zap } from "lucide-react-native";
import { useRouter } from "expo-router";

import { AdBanner } from "@/components/AdBanner";
import { Card, CardContent } from "@/components/Card";
import { getLearningPaths, getStats, getUser, type LearningPath, type Stats, type User } from "@/utils/storage";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const [u, p, s] = await Promise.all([getUser(), getLearningPaths(), getStats()]);
    setUser(u);
    setPaths(p);
    setStats(s);
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
  const accuracy = stats?.totalAnswers ? Math.round((stats.correctAnswers / stats.totalAnswers) * 100) : 0;

  const topPadding = Platform.OS === "web" ? 67 : 0;

  return (
    <ScrollView
      className="flex-1 bg-[#FDFDFD]"
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 120 : 100, paddingTop: topPadding }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View className="pt-14 pb-6 px-6 bg-black rounded-b-[2.5rem]">
        <Text className="text-gray-400 font-bold text-xs mb-1">{today}</Text>
        <Text className="text-white text-3xl font-black">
          Hi, {user?.name?.split(" ")[0] || "Pelajar"} 👋
        </Text>
        <Text className="text-gray-400 font-bold mt-1 text-sm">{user?.goal || "Mari mulai belajar!"}</Text>
      </View>

      {/* Stats Row */}
      <View className="flex-row gap-3 px-5 mt-5">
        <Card className="flex-1 bg-indigo-50 border-0">
          <CardContent className="p-4">
            <Text className="text-indigo-400 font-black uppercase text-[10px] tracking-widest">Jawaban</Text>
            <Text className="text-indigo-900 font-black text-2xl mt-1">{stats?.totalAnswers ?? 0}</Text>
          </CardContent>
        </Card>
        <Card className="flex-1 bg-emerald-50 border-0">
          <CardContent className="p-4">
            <Text className="text-emerald-400 font-black uppercase text-[10px] tracking-widest">Akurasi</Text>
            <Text className="text-emerald-900 font-black text-2xl mt-1">{accuracy}%</Text>
          </CardContent>
        </Card>
        <Card className="flex-1 bg-amber-50 border-0">
          <CardContent className="p-4">
            <Text className="text-amber-400 font-black uppercase text-[10px] tracking-widest">Streak</Text>
            <Text className="text-amber-900 font-black text-2xl mt-1">{stats?.streak ?? 0} 🔥</Text>
          </CardContent>
        </Card>
      </View>

      {/* AdMob Banner */}
      <View className="mt-5">
        <AdBanner />
      </View>

      {/* Quick Actions */}
      <View className="px-5 mt-5">
        <Text className="font-black text-black uppercase tracking-widest text-[10px] mb-3">Aksi Cepat</Text>
        <View className="flex-row gap-3">
          <TouchableOpacity
            className="flex-1 bg-black p-5 rounded-[2rem] items-center gap-2"
            onPress={() => router.push("/learn")}
          >
            <Compass color="white" size={24} />
            <Text className="text-white font-black text-xs text-center">Buka{"\n"}Pelajaran</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-indigo-600 p-5 rounded-[2rem] items-center gap-2"
            onPress={() => router.push("/learn")}
          >
            <Zap color="white" size={24} />
            <Text className="text-white font-black text-xs text-center">Mulai{"\n"}Quiz</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-emerald-600 p-5 rounded-[2rem] items-center gap-2"
            onPress={() => router.push("/learn")}
          >
            <BookOpen color="white" size={24} />
            <Text className="text-white font-black text-xs text-center">Belajar{"\n"}Flashcard</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Learning Paths */}
      <View className="px-5 mt-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="font-black text-black uppercase tracking-widest text-[10px]">
            Learning Path
          </Text>
          <TouchableOpacity onPress={() => router.push("/learn")}>
            <Text className="text-indigo-600 font-black text-xs">Lihat Semua</Text>
          </TouchableOpacity>
        </View>

        {paths.length === 0 ? (
          <TouchableOpacity
            onPress={() => router.push("/learn")}
            className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2rem] p-8 items-center gap-3"
          >
            <Plus color="#94a3b8" size={32} />
            <Text className="text-gray-400 font-bold text-center">
              Buat Learning Path pertamamu
            </Text>
          </TouchableOpacity>
        ) : (
          <View className="gap-3">
            {paths.slice(0, 3).map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => router.push("/learn")}
                className="bg-white border border-gray-100 p-5 rounded-[2rem] flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center">
                    <BookOpen color="#6366f1" size={18} />
                  </View>
                  <View>
                    <Text className="text-black font-black">{p.name}</Text>
                    <Text className="text-gray-400 text-xs font-bold mt-0.5">
                      {p.description || "Tap untuk belajar"}
                    </Text>
                  </View>
                </View>
                <ArrowRight color="#94a3b8" size={18} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

