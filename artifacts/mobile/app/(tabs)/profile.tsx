import React, { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { BookOpen, LogOut, Shield, Star, Trash2, User } from "lucide-react-native";
import { useRouter } from "expo-router";

import { AdBanner } from "@/components/AdBanner";
import { Card, CardContent } from "@/components/Card";
import { deleteUser, getStats, getUser, type Stats, type User as UserType } from "@/utils/storage";

const topPadding = Platform.OS === "web" ? 67 : 0;

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([getUser(), getStats()]).then(([u, s]) => {
      setUser(u);
      setStats(s);
    });
  }, []);

  const handleLogout = () => {
    Alert.alert(
      "Reset Data",
      "Ini akan menghapus semua data lokal dan kembali ke onboarding. Lanjutkan?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await deleteUser();
            router.replace("/onboarding");
          },
        },
      ]
    );
  };

  const LEVEL_LABELS: Record<string, string> = {
    beginner: "Pemula",
    intermediate: "Menengah",
    advanced: "Mahir",
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: topPadding }}>
      <View className="bg-black pt-14 pb-10 px-6 rounded-b-[2.5rem] items-center">
        <View className="w-20 h-20 bg-indigo-600 rounded-[2rem] items-center justify-center mb-4">
          <User color="white" size={40} />
        </View>
        <Text className="text-white text-2xl font-black">{user?.name ?? "—"}</Text>
        <Text className="text-gray-400 font-bold mt-1">{user?.topic ?? ""}</Text>
        <View className="mt-3 bg-white/10 px-4 py-1.5 rounded-full">
          <Text className="text-white font-black text-xs">
            {LEVEL_LABELS[user?.level ?? "beginner"] ?? "Pemula"}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Goal */}
        {!!user?.goal && (
          <Card className="mb-4 border-0 bg-indigo-50">
            <CardContent className="p-5">
              <View className="flex-row items-center gap-2 mb-2">
                <Star color="#6366f1" size={14} />
                <Text className="text-indigo-400 font-black uppercase text-[10px] tracking-widest">Target Belajar</Text>
              </View>
              <Text className="text-indigo-900 font-bold">{user.goal}</Text>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <Card className="mb-4 border-0 bg-gray-50">
          <CardContent className="p-5">
            <Text className="text-gray-400 font-black uppercase text-[10px] tracking-widest mb-4">Statistik</Text>
            <View className="flex-row justify-between">
              {[
                { label: "Jawaban", val: stats?.totalAnswers ?? 0 },
                {
                  label: "Akurasi",
                  val: stats?.totalAnswers
                    ? `${Math.round((stats.correctAnswers / stats.totalAnswers) * 100)}%`
                    : "0%",
                },
                { label: "Streak", val: `${stats?.streak ?? 0} 🔥` },
              ].map(({ label, val }) => (
                <View key={label} className="items-center">
                  <Text className="text-black font-black text-xl">{val}</Text>
                  <Text className="text-gray-400 font-bold text-xs mt-1">{label}</Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        <AdBanner className="mb-4" />

        {/* AdMob Info */}
        <Card className="mb-4 border-0 bg-amber-50">
          <CardContent className="p-5">
            <View className="flex-row items-center gap-2 mb-2">
              <Shield color="#f59e0b" size={14} />
              <Text className="text-amber-500 font-black uppercase text-[10px] tracking-widest">AdMob</Text>
            </View>
            <Text className="text-amber-900 font-bold text-sm">
              Banner iklan aktif. Untuk production build, konfigurasikan ID AdMob di app.json.
            </Text>
          </CardContent>
        </Card>

        {/* Reset */}
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center gap-3 p-5 bg-red-50 rounded-[2rem] border border-red-100"
        >
          <View className="w-10 h-10 bg-red-100 rounded-xl items-center justify-center">
            <Trash2 color="#ef4444" size={18} />
          </View>
          <View>
            <Text className="text-red-600 font-black">Reset Data</Text>
            <Text className="text-red-400 font-bold text-xs mt-0.5">Hapus semua data & mulai ulang</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
