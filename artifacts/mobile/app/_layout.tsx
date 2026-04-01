import "../global.css";

import {
  Inter_400Regular,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { getUser } from "@/utils/storage";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    getUser().then((user) => {
      const inOnboarding = segments[0] === "onboarding";
      if (!user && !inOnboarding) {
        router.replace("/onboarding");
      } else if (user && inOnboarding) {
        router.replace("/(tabs)");
      }
      setChecked(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!checked) return null;

  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="onboarding" options={{ headerShown: false, animation: "none" }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="flashcard/[lessonId]" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="quiz/[lessonId]" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="create-flashcard/[lessonId]" options={{ headerShown: false }} />
      <Stack.Screen name="create-quiz/[lessonId]" options={{ headerShown: false }} />
      <Stack.Screen name="upload-batch/[lessonId]" options={{ headerShown: false }} />
      <Stack.Screen name="mistakes-review" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_700Bold });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <RootLayoutNav />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
