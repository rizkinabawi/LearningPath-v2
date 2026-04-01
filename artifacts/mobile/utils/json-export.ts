import { Share, Platform } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

export interface QuizItem {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
  image?: string;
}

export interface FlashcardItem {
  front: string;
  back: string;
  image?: string;
}

export interface QuizJsonOutput {
  type: "quiz";
  topic: string;
  difficulty: string;
  items: QuizItem[];
}

export interface FlashcardJsonOutput {
  type: "flashcard";
  topic: string;
  difficulty: string;
  items: FlashcardItem[];
}

export type LearningJsonOutput = QuizJsonOutput | FlashcardJsonOutput;

export async function copyJsonToClipboard(data: LearningJsonOutput): Promise<void> {
  const json = JSON.stringify(data, null, 2);
  await Clipboard.setStringAsync(json);
}

export async function shareJson(data: LearningJsonOutput): Promise<void> {
  const json = JSON.stringify(data, null, 2);
  const filename = `${data.type}_${data.topic.replace(/\s+/g, "_").toLowerCase()}.json`;

  if (Platform.OS === "web") {
    await Clipboard.setStringAsync(json);
    return;
  }

  try {
    const isAvailable = await Sharing.isAvailableAsync();

    if (isAvailable) {
      const path = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(path, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      await Sharing.shareAsync(path, {
        mimeType: "application/json",
        dialogTitle: `Bagikan ${data.type} — ${data.topic}`,
      });
    } else {
      await Share.share({ message: json, title: filename });
    }
  } catch {
    await Clipboard.setStringAsync(json);
  }
}

export async function downloadJson(data: LearningJsonOutput): Promise<string> {
  const json = JSON.stringify(data, null, 2);
  const filename = `${data.type}_${data.topic.replace(/\s+/g, "_").toLowerCase()}_${Date.now()}.json`;
  const path = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(path, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return path;
}
