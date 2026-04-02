import React, { useCallback, useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, Image, StyleSheet,
  Platform, Alert, ActivityIndicator, FlatList, Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as FileSystem from "expo-file-system";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { toast } from "@/components/Toast";

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "heic"]);

const DIRS = [
  { label: "Foto Quiz", key: "quiz", path: (FileSystem.documentDirectory ?? "") + "quiz-images/", color: "#EF4444" },
  { label: "Foto Flashcard", key: "flashcard", path: (FileSystem.documentDirectory ?? "") + "flashcard-images/", color: "#8B5CF6" },
  { label: "Materi Belajar", key: "material", path: (FileSystem.documentDirectory ?? "") + "study-materials/", color: "#0EA5E9" },
  { label: "Foto Profil", key: "avatar", path: (FileSystem.documentDirectory ?? "") + "avatars/", color: "#10B981" },
];

interface ImageItem {
  uri: string;
  name: string;
  dir: string;
  dirLabel: string;
  dirColor: string;
  size: number;
}

const { width: SW } = Dimensions.get("window");
const COLS = 3;
const IMG_SIZE = Math.floor((SW - 32 - (COLS - 1) * 6) / COLS);

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImageManager() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (Platform.OS === "web") { setLoading(false); return; }
    setLoading(true);
    const result: ImageItem[] = [];
    for (const dir of DIRS) {
      try {
        const info = await FileSystem.getInfoAsync(dir.path);
        if (!info.exists) continue;
        const files = await FileSystem.readDirectoryAsync(dir.path);
        for (const f of files) {
          const ext = f.split(".").pop()?.toLowerCase() ?? "";
          if (!IMAGE_EXTS.has(ext)) continue;
          const uri = dir.path + f;
          let size = 0;
          try {
            const fi = await FileSystem.getInfoAsync(uri, { size: true });
            size = (fi as any).size ?? 0;
          } catch {}
          result.push({ uri, name: f, dir: dir.key, dirLabel: dir.label, dirColor: dir.color, size });
        }
      } catch {}
    }
    result.sort((a, b) => b.size - a.size);
    setImages(result);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleSelect = (uri: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uri)) next.delete(uri);
      else next.add(uri);
      return next;
    });
  };

  const deleteSelected = () => {
    if (selected.size === 0) return;
    Alert.alert(
      "Hapus Gambar",
      `Hapus ${selected.size} gambar yang dipilih? Tindakan ini tidak bisa dibatalkan.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            let ok = 0;
            for (const uri of selected) {
              try { await FileSystem.deleteAsync(uri, { idempotent: true }); ok++; } catch {}
            }
            setImages((prev) => prev.filter((img) => !selected.has(img.uri)));
            setSelected(new Set());
            toast.success(`${ok} gambar dihapus`);
          },
        },
      ]
    );
  };

  const deleteOne = (uri: string, name: string) => {
    Alert.alert("Hapus Gambar", `Hapus "${name}"?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus", style: "destructive",
        onPress: async () => {
          try {
            await FileSystem.deleteAsync(uri, { idempotent: true });
            setImages((prev) => prev.filter((img) => img.uri !== uri));
            setSelected((prev) => { const n = new Set(prev); n.delete(uri); return n; });
            toast.info("Gambar dihapus");
          } catch {
            toast.error("Gagal menghapus gambar");
          }
        },
      },
    ]);
  };

  const filtered = filter ? images.filter((img) => img.dir === filter) : images;
  const totalSize = images.reduce((s, i) => s + i.size, 0);
  const isSelecting = selected.size > 0;

  if (Platform.OS === "web") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: Colors.textMuted, fontSize: 14 }}>Image Manager hanya tersedia di perangkat mobile.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <LinearGradient
        colors={["#0EA5E9", "#6366F1"]}
        style={[styles.header, { paddingTop: Platform.OS === "web" ? 60 : insets.top + 16 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Image Manager</Text>
            <Text style={styles.headerSub}>
              {images.length} gambar · {formatBytes(totalSize)} total
            </Text>
          </View>
          {isSelecting && (
            <TouchableOpacity style={styles.deleteBtn} onPress={deleteSelected}>
              <Feather name="trash-2" size={18} color="#fff" />
              <Text style={styles.deleteBtnText}>{selected.size}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
          <TouchableOpacity
            style={[styles.filterChip, filter === null && styles.filterChipActive]}
            onPress={() => setFilter(null)}
          >
            <Text style={[styles.filterText, filter === null && styles.filterTextActive]}>
              Semua ({images.length})
            </Text>
          </TouchableOpacity>
          {DIRS.map((d) => {
            const cnt = images.filter((i) => i.dir === d.key).length;
            if (cnt === 0) return null;
            const active = filter === d.key;
            return (
              <TouchableOpacity
                key={d.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilter(active ? null : d.key)}
              >
                <View style={[styles.filterDot, { backgroundColor: d.color }]} />
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {d.label} ({cnt})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </LinearGradient>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ color: Colors.textMuted, fontSize: 14 }}>Memuat gambar...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 10 }}>
          <Feather name="image" size={48} color={Colors.border} />
          <Text style={{ color: Colors.textMuted, fontSize: 15, fontWeight: "700" }}>Tidak ada gambar</Text>
          <Text style={{ color: Colors.textMuted, fontSize: 13 }}>Gambar akan muncul di sini saat kamu menambahkannya</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          numColumns={COLS}
          keyExtractor={(item) => item.uri}
          contentContainerStyle={{ padding: 16, gap: 6 }}
          columnWrapperStyle={{ gap: 6 }}
          renderItem={({ item }) => {
            const isSel = selected.has(item.uri);
            return (
              <TouchableOpacity
                style={[styles.imgCell, isSel && styles.imgCellSelected]}
                onPress={() => isSelecting ? toggleSelect(item.uri) : undefined}
                onLongPress={() => toggleSelect(item.uri)}
                activeOpacity={0.85}
              >
                <Image source={{ uri: item.uri }} style={styles.img} resizeMode="cover" />
                {/* Category dot */}
                <View style={[styles.catDot, { backgroundColor: item.dirColor }]} />
                {/* Size label */}
                <View style={styles.sizeLabel}>
                  <Text style={styles.sizeLabelText}>{formatBytes(item.size)}</Text>
                </View>
                {/* Selection checkmark */}
                {isSel && (
                  <View style={styles.checkOverlay}>
                    <Feather name="check-circle" size={28} color="#fff" />
                  </View>
                )}
                {/* Delete button (when not in select mode) */}
                {!isSelecting && (
                  <TouchableOpacity
                    style={styles.deleteOneBtn}
                    onPress={() => deleteOne(item.uri, item.name)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="x" size={12} color="#fff" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      {isSelecting && (
        <View style={[styles.selectBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity style={styles.selectBarCancel} onPress={() => setSelected(new Set())}>
            <Text style={styles.selectBarCancelText}>Batal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.selectBarDelete} onPress={deleteSelected}>
            <Feather name="trash-2" size={16} color="#fff" />
            <Text style={styles.selectBarDeleteText}>Hapus {selected.size} Gambar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#fff" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: "600", marginTop: 2 },
  deleteBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(239,68,68,0.85)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8,
  },
  deleteBtnText: { fontSize: 14, fontWeight: "900", color: "#fff" },
  filterChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  filterChipActive: { backgroundColor: "#fff" },
  filterDot: { width: 7, height: 7, borderRadius: 999 },
  filterText: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.85)" },
  filterTextActive: { color: "#4C6FFF" },
  imgCell: {
    width: IMG_SIZE, height: IMG_SIZE,
    borderRadius: 12, overflow: "hidden",
    backgroundColor: Colors.border,
    position: "relative",
  },
  imgCellSelected: {
    borderWidth: 3, borderColor: Colors.primary,
  },
  img: { width: "100%", height: "100%" },
  catDot: {
    position: "absolute", top: 6, left: 6,
    width: 8, height: 8, borderRadius: 999,
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.5)",
  },
  sizeLabel: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(0,0,0,0.45)", paddingVertical: 3, alignItems: "center",
  },
  sizeLabelText: { fontSize: 9, color: "#fff", fontWeight: "700" },
  checkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(76,111,255,0.55)",
    alignItems: "center", justifyContent: "center",
  },
  deleteOneBtn: {
    position: "absolute", top: 4, right: 4,
    width: 20, height: 20, borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center", justifyContent: "center",
  },
  selectBar: {
    flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  selectBarCancel: {
    flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: "center",
    backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border,
  },
  selectBarCancelText: { fontSize: 14, fontWeight: "800", color: Colors.textMuted },
  selectBarDelete: {
    flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 13, borderRadius: 14, backgroundColor: Colors.danger,
  },
  selectBarDeleteText: { fontSize: 14, fontWeight: "900", color: "#fff" },
});
