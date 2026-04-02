/**
 * fs-compat.ts
 * Thin compatibility layer over expo-file-system v19 (SDK 54).
 * Provides the same surface area as the old v1 API so that all
 * existing callers can keep using familiar names.
 *
 * New API mapping:
 *   cacheDirectory    → Paths.cache.uri
 *   documentDirectory → Paths.document.uri
 *   EncodingType      → plain string literals
 *   writeAsStringAsync→ new File(uri).write(content)  [sync inside async wrapper]
 *   readAsStringAsync → new File(uri).text() / .base64()
 *   getInfoAsync      → new File(uri).info()  [sync]
 *   makeDirectoryAsync→ new Directory(uri).create()   [sync inside async wrapper]
 *   deleteAsync       → new File(uri).delete() / new Directory(uri).delete()
 *   copyAsync         → new File(src).copy(dest)
 *   readDirectoryAsync→ new Directory(uri).list()
 */

import { Paths, File, Directory } from "expo-file-system";

export const cacheDirectory: string = Paths.cache.uri;
export const documentDirectory: string = Paths.document.uri;

export const EncodingType = {
  UTF8: "utf8" as const,
  Base64: "base64" as const,
};

export interface FileInfo {
  exists: boolean;
  uri: string;
  size?: number;
  isDirectory?: boolean;
  modificationTime?: number;
}

export async function getInfoAsync(
  fileUri: string,
  _options?: { size?: boolean; md5?: boolean }
): Promise<FileInfo> {
  // Paths ending with "/" are directories — use Directory, not File
  const isDir = fileUri.endsWith("/");
  try {
    if (isDir) {
      const d = new Directory(fileUri);
      if (!d.exists) return { exists: false, uri: fileUri, isDirectory: true };
      return { exists: true, uri: fileUri, isDirectory: true };
    }
    const f = new File(fileUri);
    if (!f.exists) return { exists: false, uri: fileUri };
    const info = f.info();
    return {
      exists: true,
      uri: fileUri,
      size: info.size ?? undefined,
    };
  } catch {
    // Fallback: try Directory if File check throws (e.g. path is actually a dir)
    try {
      const d = new Directory(fileUri);
      if (d.exists) return { exists: true, uri: fileUri, isDirectory: true };
    } catch { /* ignored */ }
    return { exists: false, uri: fileUri };
  }
}

export async function readAsStringAsync(
  fileUri: string,
  options?: { encoding?: "utf8" | "base64" }
): Promise<string> {
  const f = new File(fileUri);
  if (options?.encoding === "base64") {
    return await f.base64();
  }
  return await f.text();
}

export async function writeAsStringAsync(
  fileUri: string,
  contents: string,
  _options?: { encoding?: "utf8" | "base64" }
): Promise<void> {
  const f = new File(fileUri);
  f.write(contents);
}

export async function makeDirectoryAsync(
  fileUri: string,
  options?: { intermediates?: boolean }
): Promise<void> {
  const d = new Directory(fileUri);
  if (d.exists) return; // idempotent — already exists, skip
  d.create({ intermediates: options?.intermediates ?? false });
}

export async function deleteAsync(
  fileUri: string,
  _options?: { idempotent?: boolean }
): Promise<void> {
  try {
    const f = new File(fileUri);
    if (f.exists) f.delete();
  } catch {
    try {
      const d = new Directory(fileUri);
      if (d.exists) d.delete();
    } catch { /* ignored */ }
  }
}

export async function copyAsync(options: {
  from: string;
  to: string;
}): Promise<void> {
  const src = new File(options.from);
  src.copy(new File(options.to));
}

export async function readDirectoryAsync(fileUri: string): Promise<string[]> {
  const d = new Directory(fileUri);
  return d.list().map((entry) => {
    // Return filename only (matching old expo-file-system API behavior)
    const uri = entry.uri.replace(/\/$/, "");
    return uri.split("/").pop() ?? uri;
  });
}
