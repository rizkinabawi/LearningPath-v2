import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "../global.css";
import { useEffect, useState } from "react";
import { getUser } from "@/utils/storage";

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
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen
          name="quiz/[lessonId]"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="flashcard/[lessonId]"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen name="create-flashcard/[lessonId]" options={{ headerShown: false }} />
        <Stack.Screen name="create-quiz/[lessonId]" options={{ headerShown: false }} />
        <Stack.Screen name="upload-batch/[lessonId]" options={{ headerShown: false }} />
        <Stack.Screen name="mistakes-review" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return <RootLayoutNav />;
}
