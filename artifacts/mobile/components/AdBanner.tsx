/**
 * AdBanner Component
 *
 * Dalam Expo Go / development: menampilkan placeholder banner.
 * Dalam production build: ganti dengan react-native-google-mobile-ads
 * dan tambahkan konfigurasi di app.json:
 *
 * "plugins": [
 *   ["react-native-google-mobile-ads", {
 *     "androidAppId": "ca-app-pub-XXXXXXXX~XXXXXXXX",
 *     "iosAppId": "ca-app-pub-XXXXXXXX~XXXXXXXX"
 *   }]
 * ]
 *
 * Test Ad Unit IDs (safe to use in dev):
 * - Android Banner: ca-app-pub-3940256099942544/6300978111
 * - iOS Banner:     ca-app-pub-3940256099942544/2934735716
 */

import React from "react";
import { View, Text, Platform } from "react-native";

interface AdBannerProps {
  className?: string;
}

export function AdBanner({ className }: AdBannerProps) {
  return (
    <View
      className={`bg-gray-100 border border-dashed border-gray-300 rounded-2xl items-center justify-center py-3 px-4 mx-4 ${className ?? ""}`}
      style={{ minHeight: 50 }}
    >
      <Text className="text-gray-400 font-bold text-xs tracking-widest uppercase">
        Advertisement
      </Text>
      <Text className="text-gray-300 text-[10px] mt-0.5">
        AdMob Banner ({Platform.OS})
      </Text>
    </View>
  );
}
