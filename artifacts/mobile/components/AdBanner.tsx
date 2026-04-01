import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";

// ─────────────────────────────────────────────────────────────────────────────
// AdBanner — Mock AdMob Banner
//
// Di production (APK/AAB), ganti komponen ini dengan react-native-google-mobile-ads:
//   import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";
//   const adUnitId = __DEV__ ? TestIds.BANNER : "ca-app-pub-XXXX/YYYY";
//   <BannerAd unitId={adUnitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
//
// Unit ID production didapat dari Google AdMob Console:
//   https://admob.google.com/
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_ADS = [
  { label: "Belajar lebih cepat dengan AI", cta: "Coba Gratis", color: "#4C6FFF" },
  { label: "Flashcard & Quiz tersedia 24/7", cta: "Mulai Sekarang", color: "#7C3AED" },
  { label: "Raih target belajarmu hari ini", cta: "Lihat Tips", color: "#059669" },
];

interface AdBannerProps {
  size?: "banner" | "largeBanner" | "mediumRectangle";
  style?: object;
}

export function AdBanner({ size = "banner", style }: AdBannerProps) {
  const [adIndex, setAdIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setAdIndex((i) => (i + 1) % MOCK_ADS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  if (dismissed) return null;

  const ad = MOCK_ADS[adIndex];
  const bannerHeight = size === "banner" ? 50 : size === "largeBanner" ? 100 : 250;

  return (
    <View
      style={[
        styles.container,
        { height: bannerHeight },
        size === "mediumRectangle" && styles.mrec,
        style,
      ]}
    >
      {/* AdMob-style badge */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Ad</Text>
      </View>

      {/* Ad Content */}
      <View style={styles.content}>
        <Feather name="zap" size={14} color={ad.color} style={{ marginRight: 6 }} />
        <Text style={styles.adText} numberOfLines={1}>{ad.label}</Text>
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={[styles.ctaBtn, { borderColor: ad.color }]}
        activeOpacity={0.75}
        onPress={() => {}}
      >
        <Text style={[styles.ctaText, { color: ad.color }]}>{ad.cta}</Text>
      </TouchableOpacity>

      {/* Dismiss */}
      <TouchableOpacity
        onPress={() => setDismissed(true)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.dismissBtn}
        activeOpacity={0.7}
      >
        <Feather name="x" size={12} color={Colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    width: "100%",
  },
  mrec: {
    flexDirection: "column",
    justifyContent: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderTopWidth: 1,
  },
  badge: {
    backgroundColor: "#F0F4FF",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  adText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.dark,
    flex: 1,
  },
  ctaBtn: {
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  ctaText: {
    fontSize: 11,
    fontWeight: "700",
  },
  dismissBtn: {
    padding: 2,
    marginLeft: 2,
  },
});
