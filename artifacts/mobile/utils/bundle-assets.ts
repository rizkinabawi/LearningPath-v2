/**
 * bundle-assets.ts
 * Handles embedding local images/files as base64 in CoursePack,
 * and extracting them back to the filesystem on import.
 */
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import type { CoursePack, StudyMaterial, Flashcard, Quiz } from "./storage";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const isLocalUri = (uri?: string): boolean => {
  if (!uri) return false;
  return (
    uri.startsWith("file://") ||
    uri.startsWith("/") ||
    uri.startsWith(FileSystem.documentDirectory ?? "") ||
    uri.startsWith(FileSystem.cacheDirectory ?? "")
  );
};

const readBase64Safe = async (uri: string): Promise<string | null> => {
  if (Platform.OS === "web") return null;
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) return null;
    return await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  } catch {
    return null;
  }
};

const writeBase64File = async (base64: string, filename: string): Promise<string> => {
  const dir = FileSystem.documentDirectory + "imported_assets/";
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  const dest = dir + filename;
  await FileSystem.writeAsStringAsync(dest, base64, { encoding: FileSystem.EncodingType.Base64 });
  return dest;
};

const safeFilename = (uri: string, fallback: string): string => {
  const parts = uri.split("/");
  const name = parts[parts.length - 1];
  return name && name.length > 0 ? name : fallback;
};

// ─── Embed: local files → base64 inside pack ────────────────────────────────

export const embedAssetsInPack = async (pack: CoursePack): Promise<CoursePack> => {
  if (Platform.OS === "web") return { ...pack, version: 2 };

  const assetData: Record<string, string> = { ...(pack.assetData ?? {}) };

  // Collect all local URIs to encode
  const toRead: string[] = [];

  for (const mat of pack.materials ?? []) {
    if (mat.type === "image" && mat.imageLocalPath && isLocalUri(mat.imageLocalPath)) {
      toRead.push(mat.imageLocalPath);
    }
    if (mat.type === "file" && mat.filePath && isLocalUri(mat.filePath)) {
      toRead.push(mat.filePath);
    }
  }
  for (const fc of pack.flashcards ?? []) {
    if (fc.image && isLocalUri(fc.image)) toRead.push(fc.image);
  }
  for (const qz of pack.quizzes ?? []) {
    if (qz.image && isLocalUri(qz.image)) toRead.push(qz.image);
  }

  // Read all unique URIs concurrently
  const unique = [...new Set(toRead)];
  await Promise.all(
    unique.map(async (uri) => {
      if (assetData[uri]) return; // already embedded
      const b64 = await readBase64Safe(uri);
      if (b64) assetData[uri] = b64;
    })
  );

  return { ...pack, version: 2, assetData };
};

// ─── Extract: base64 inside pack → local files ──────────────────────────────

export const extractAssetsFromPack = async (pack: CoursePack): Promise<CoursePack> => {
  if (Platform.OS === "web" || !pack.assetData || Object.keys(pack.assetData).length === 0) {
    return pack;
  }

  // Write all base64 assets to local storage and build URI remapping
  const uriMap: Record<string, string> = {};
  let counter = 0;

  await Promise.all(
    Object.entries(pack.assetData).map(async ([originalUri, base64]) => {
      try {
        counter++;
        const filename = safeFilename(originalUri, `asset_${counter}`);
        const newUri = await writeBase64File(base64, filename);
        uriMap[originalUri] = newUri;
      } catch {
        // skip broken asset
      }
    })
  );

  // Remap URIs in materials
  const remappedMaterials: StudyMaterial[] = (pack.materials ?? []).map((mat) => {
    const updated = { ...mat };
    if (mat.imageLocalPath && uriMap[mat.imageLocalPath]) {
      updated.imageLocalPath = uriMap[mat.imageLocalPath];
    }
    if (mat.filePath && uriMap[mat.filePath]) {
      updated.filePath = uriMap[mat.filePath];
    }
    return updated;
  });

  // Remap URIs in flashcards
  const remappedFlashcards: Flashcard[] = (pack.flashcards ?? []).map((fc) => {
    if (fc.image && uriMap[fc.image]) return { ...fc, image: uriMap[fc.image] };
    return fc;
  });

  // Remap URIs in quizzes
  const remappedQuizzes: Quiz[] = (pack.quizzes ?? []).map((qz) => {
    if (qz.image && uriMap[qz.image]) return { ...qz, image: uriMap[qz.image] };
    return qz;
  });

  return {
    ...pack,
    materials: remappedMaterials,
    flashcards: remappedFlashcards,
    quizzes: remappedQuizzes,
    assetData: undefined, // clear embedded data after extraction
  };
};

// ─── Count embedded assets for UI display ────────────────────────────────────

export const countEmbeddedAssets = (pack: CoursePack): { images: number; files: number; links: number } => {
  let images = 0, files = 0, links = 0;
  for (const mat of pack.materials ?? []) {
    if (mat.type === "image") images++;
    else if (mat.type === "file") files++;
    else if (mat.type === "youtube" || mat.type === "googledoc") links++;
  }
  // Count flashcard/quiz images
  for (const fc of pack.flashcards ?? []) { if (fc.image) images++; }
  for (const qz of pack.quizzes ?? []) { if (qz.image) images++; }
  return { images, files, links };
};
