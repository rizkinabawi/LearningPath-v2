import { Tabs } from "expo-router";
import { Home, Compass, BarChart2, Menu } from "lucide-react-native";
import React from "react";
import { Platform } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#000",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          borderTopWidth: 0,
          height: Platform.OS === "web" ? 84 : 80,
          paddingBottom: Platform.OS === "web" ? 34 : 20,
          paddingTop: 10,
          backgroundColor: "#fff",
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "800" },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Home color={color} size={22} fill={focused ? color : "none"} />
          ),
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: "Belajar",
          tabBarIcon: ({ color }) => <Compass color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ color }) => <BarChart2 color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Menu",
          tabBarIcon: ({ color }) => <Menu color={color} size={22} />,
        }}
      />
    </Tabs>
  );
}
