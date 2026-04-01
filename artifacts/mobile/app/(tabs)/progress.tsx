import React, { useEffect, useState } from "react";
import { Platform, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { AlertCircle, BarChart2, Flame, Target, Trophy, Zap } from "lucide-react-native";
import { useRouter } from "expo-router";

import { Card, CardContent } from "@/components/Card";
import { AdBanner } from "@/components/AdBanner";
import { getStats, getWrongAnswers, type Progress as ProgressType, type Stats } from "@/utils/storage";

const topPadding = Platform.OS === "web" ? 67 : 0;

export default function ProgressPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [wrongAnswers, setWrongAnswers] = useState<ProgressType[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const [s, mistakes] = await Promise.all([getStats(), getWrongAnswers()]);
    setStats(s);
    setWrongAnswers(mistakes);
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const accuracy = stats?.totalAnswers
    ? Math.round((stats.correctAnswers / stats.totalAnswers) * 100)
    : 0;

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: topPadding }}>
      <View className="bg-black pt-14 pb-8 px-6 rounded-b-[2.5rem]">
        <Text className="text-white text-3xl font-black">Performance</Text>
        <Text className="text-gray-400 font-bold mt-1 text-sm">Analisis perjalanan belajarmu</Text>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-6"
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 120 : 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats Grid */}
        <View className="flex-row gap-3 mb-4">
          <Card className="flex-1 bg-indigo-50 border-0">
            <CardContent className="p-5">
              <View className="w-10 h-10 bg-indigo-100 rounded-xl items-center justify-center mb-3">
                <BarChart2 color="#6366f1" size={18} />
              </View>
              <Text className="text-indigo-400 font-black uppercase text-[10px] tracking-widest">Total Jawaban</Text>
              <Text className="text-indigo-900 font-black text-3xl mt-1">{stats?.totalAnswers ?? 0}</Text>
            </CardContent>
          </Card>
          <Card className="flex-1 bg-emerald-50 border-0">
            <CardContent className="p-5">
              <View className="w-10 h-10 bg-emerald-100 rounded-xl items-center justify-center mb-3">
                <Target color="#10b981" size={18} />
              </View>
              <Text className="text-emerald-400 font-black uppercase text-[10px] tracking-widest">Akurasi</Text>
              <Text className="text-emerald-900 font-black text-3xl mt-1">{accuracy}%</Text>
            </CardContent>
          </Card>
        </View>

        <View className="flex-row gap-3 mb-6">
          <Card className="flex-1 bg-amber-50 border-0">
            <CardContent className="p-5">
              <View className="w-10 h-10 bg-amber-100 rounded-xl items-center justify-center mb-3">
                <Flame color="#f59e0b" size={18} />
              </View>
              <Text className="text-amber-400 font-black uppercase text-[10px] tracking-widest">Streak</Text>
              <Text className="text-amber-900 font-black text-3xl mt-1">{stats?.streak ?? 0} 🔥</Text>
            </CardContent>
          </Card>
          <Card className="flex-1 bg-rose-50 border-0">
            <CardContent className="p-5">
              <View className="w-10 h-10 bg-rose-100 rounded-xl items-center justify-center mb-3">
                <Zap color="#f43f5e" size={18} />
              </View>
              <Text className="text-rose-400 font-black uppercase text-[10px] tracking-widest">Salah</Text>
              <Text className="text-rose-900 font-black text-3xl mt-1">{wrongAnswers.length}</Text>
            </CardContent>
          </Card>
        </View>

        {/* AdMob Banner */}
        <AdBanner className="mb-6" />

        {/* Mistakes Review */}
        {wrongAnswers.length > 0 && (
          <View className="mb-6">
            <Text className="font-black text-black uppercase tracking-widest text-[10px] mb-3">
              Review Kesalahan
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/mistakes-review")}
              className="bg-rose-50 border border-rose-100 p-5 rounded-[2rem] flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-12 h-12 bg-rose-100 rounded-2xl items-center justify-center">
                  <AlertCircle color="#f43f5e" size={22} />
                </View>
                <View>
                  <Text className="text-rose-900 font-black">{wrongAnswers.length} Jawaban Salah</Text>
                  <Text className="text-rose-400 text-xs font-bold mt-0.5">Tap untuk review ulang</Text>
                </View>
              </View>
              <Trophy color="#f43f5e" size={20} />
            </TouchableOpacity>
          </View>
        )}

        {stats?.totalAnswers === 0 && (
          <View className="items-center py-12">
            <Trophy color="#e2e8f0" size={60} />
            <Text className="text-gray-300 font-black text-lg mt-4 text-center">
              Belum ada data performa
            </Text>
            <Text className="text-gray-300 font-bold text-sm mt-2 text-center">
              Mulai kerjakan flashcard atau quiz untuk melihat statistikmu!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
