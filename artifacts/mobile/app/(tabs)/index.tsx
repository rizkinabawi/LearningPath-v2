import React, { useEffect, useState } from "react";
import { 
  ScrollView, 
  View, 
  Text, 
  TouchableOpacity, 
  RefreshControl,
  Dimensions,
  TextInput,
  Image,
  Platform
} from "react-native";
import { 
  Plus, 
  ChevronRight,
  Search,
  Calendar,
  Play,
  ArrowRight,
  BookOpen,
  Bell
} from "lucide-react-native";
import { Card, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import { AdBanner } from "@/components/AdBanner";
import { 
  getUser,
  getLearningPaths,
  type User, 
  type LearningPath 
} from "@/utils/storage";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    const [userData, allPaths] = await Promise.all([
      getUser(),
      getLearningPaths(),
    ]);
    setUser(userData);
    setPaths(allPaths);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const today = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

  return (
    <ScrollView 
      className="flex-1 bg-[#FDFDFD]"
      contentContainerStyle={{ paddingBottom: 60 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Section */}
      <View className="pt-16 px-8 flex-row justify-between items-start">
        <View>
          <Text className="text-gray-400 font-bold text-sm mb-1">{today}</Text>
          <Text className="text-black text-4xl font-black">
            Hi, {user?.name?.split(' ')[0] || "Learner"}
          </Text>
        </View>
        <View className="relative">
          <View className="w-14 h-14 rounded-2xl bg-gray-200 overflow-hidden">
            <Image 
              source={{ uri: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Felix'}` }} 
              className="w-full h-full"
            />
          </View>
          <View className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
        </View>
      </View>

      {/* Search Bar */}
      <View className="px-8 mt-8">
        <View className="bg-gray-100/80 rounded-2xl flex-row items-center px-4 py-4">
          <Search color="#94a3b8" size={20} />
          <TextInput 
            placeholder="Search"
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 font-bold text-gray-600 ml-3"
          />
        </View>
      </View>

      {/* Hero Banner */}
      <View className="px-8 mt-8">
        <Card className="bg-[#EBF5FF] border-0 rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-0 flex-row">
            <View className="flex-1 p-8 pr-0 justify-center">
              <Text className="text-[#1E293B] text-2xl font-black leading-tight mb-6">
                What would you like to learn today?
              </Text>
              <TouchableOpacity 
                onPress={() => router.push("/learn")}
                className="bg-white py-3 px-6 rounded-2xl self-start shadow-sm"
              >
                <Text className="text-blue-600 font-black">Get started</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-1 items-end justify-end pt-4">
              <Image 
                source={{ uri: "https://img.freepik.com/free-vector/learning-concept-illustration_114360-6186.jpg" }}
                style={{ width: '100%', height: 160 }}
                resizeMode="contain"
              />
            </View>
          </CardContent>
        </Card>
      </View>

      {/* AdMob Banner */}
      <View className="px-8 mt-6">
        <AdBanner />
      </View>

      {/* Bento Grid */}
      <View className="px-8 mt-6 flex-row gap-4" style={{ height: 240 }}>
        {/* Left Column - Large Card */}
        <TouchableOpacity 
          className="flex-1"
          onPress={() => router.push("/learn")}
        >
          <Card className="flex-1 bg-[#5FB881] border-0 rounded-[2.5rem] p-6 justify-between">
            <CardContent className="p-0 flex-1 justify-between">
              <View>
                <Text className="text-white/70 font-black uppercase text-[10px] tracking-widest mb-2">My Paths</Text>
                <Text className="text-white text-2xl font-black leading-tight">
                  {paths.length > 0 ? paths[0].name : "Start Learning"}
                </Text>
              </View>
              
              <View className="flex-row items-center justify-between">
                <Text className="text-white font-black text-xs">
                  {paths.length} path{paths.length !== 1 ? 's' : ''}
                </Text>
                <View className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-md">
                  <Play color="#5FB881" size={18} fill="#5FB881" />
                </View>
              </View>
            </CardContent>
          </Card>
        </TouchableOpacity>

        {/* Right Column - Two Small Cards */}
        <View className="flex-1 gap-4">
          <Card className="flex-1 bg-[#F8FAFC] border-0 rounded-[2.5rem] p-6 shadow-sm">
            <Text className="text-[#1E293B] font-black text-base mb-3">Study{"\n"}Schedule –</Text>
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-indigo-100 items-center justify-center">
                <Calendar color="#6366f1" size={14} />
              </View>
              <Text className="text-[#64748B] font-black ml-2 text-xs">{today}</Text>
            </View>
          </Card>
          
          <Card className="flex-1 bg-[#F8FAFC] border-0 rounded-[2.5rem] p-6 shadow-sm">
            <Text className="text-[#94A3B8] font-black uppercase text-[10px] tracking-widest mb-1">Goal</Text>
            <Text className="text-[#1E293B] font-black text-sm" numberOfLines={2}>
              {user?.goal || "Set your learning goal"}
            </Text>
          </Card>
        </View>
      </View>

      {/* Quick Navigation Card */}
      <View className="px-8 mt-6">
        <TouchableOpacity 
          className="w-full bg-[#F1F5F9] p-6 rounded-[2.5rem] flex-row items-center justify-between"
          onPress={() => router.push("/learn")}
        >
          <View className="flex-row items-center gap-4">
            <View className="w-10 h-10 bg-white rounded-2xl items-center justify-center">
              <BookOpen color="black" size={20} />
            </View>
            <Text className="text-black font-black">Open Learning Path</Text>
          </View>
          <ArrowRight color="#94A3B8" size={20} />
        </TouchableOpacity>
      </View>

      {/* Recent Learning Paths */}
      {paths.length > 0 && (
        <View className="px-8 mt-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-black font-black text-lg">Your Paths</Text>
            <TouchableOpacity onPress={() => router.push("/learn")}>
              <Text className="text-blue-500 font-bold text-sm">See all</Text>
            </TouchableOpacity>
          </View>
          {paths.slice(0, 2).map((p) => (
            <TouchableOpacity
              key={p.id}
              onPress={() => router.push("/learn")}
              className="bg-white border border-gray-100 p-5 rounded-[2rem] flex-row items-center justify-between mb-3 shadow-sm"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-blue-50 rounded-xl items-center justify-center">
                  <BookOpen color="#3b82f6" size={18} />
                </View>
                <View>
                  <Text className="text-black font-black">{p.name}</Text>
                  <Text className="text-gray-400 text-xs font-bold mt-0.5">{p.description || "Tap to continue"}</Text>
                </View>
              </View>
              <ChevronRight color="#94A3B8" size={18} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Empty State */}
      {paths.length === 0 && (
        <View className="px-8 mt-6">
          <TouchableOpacity
            onPress={() => router.push("/learn")}
            className="border-2 border-dashed border-gray-200 rounded-[2rem] p-8 items-center gap-3"
          >
            <Plus color="#94a3b8" size={32} />
            <Text className="text-gray-400 font-bold text-center">
              Create your first Learning Path
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
