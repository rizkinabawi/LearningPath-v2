import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Types
export interface User {
  id: string;
  name: string;
  goal: string;
  topic: string;
  level: "beginner" | "intermediate" | "advanced";
  createdAt: string;
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  userId: string;
  tags?: string[];
  createdAt: string;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  pathId: string;
  order: number;
  icon?: string;
  createdAt: string;
}

export interface Lesson {
  id: string;
  name: string;
  description: string;
  moduleId: string;
  order: number;
  notes?: string;
  createdAt: string;
}

export interface FlashcardPack {
  id: string;
  lessonId: string;
  name: string;
  createdAt: string;
}

export interface QuizPack {
  id: string;
  lessonId: string;
  name: string;
  createdAt: string;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  tag: string;
  lessonId: string;
  packId?: string;
  image?: string;
  createdAt: string;
}

export interface Quiz {
  id: string;
  question: string;
  options: string[];
  answer: string;
  type: "multiple-choice" | "true-false";
  lessonId: string;
  packId?: string;
  image?: string;
  createdAt: string;
}

export interface Progress {
  id: string;
  userId: string;
  lessonId: string;
  flashcardId?: string;
  quizId?: string;
  isCorrect: boolean;
  userAnswer?: string;
  timestamp: string;
}

export interface Stats {
  totalStudyTime: number;
  totalAnswers: number;
  correctAnswers: number;
  streak: number;
  lastStudyDate: string;
}

export interface Note {
  id: string;
  lessonId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudyMaterial {
  id: string;
  lessonId: string;
  title: string;
  type: "text" | "html" | "file" | "youtube" | "googledoc" | "image";
  content: string;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  fileMime?: string;
  videoUrl?: string;
  imageLocalPath?: string;
  createdAt: string;
}

// Course Pack for export/import
export interface CoursePack {
  version: number;
  exportedAt: string;
  paths: LearningPath[];
  modules: Module[];
  lessons: Lesson[];
  flashcardPacks: FlashcardPack[];
  quizPacks: QuizPack[];
  flashcards: Flashcard[];
  quizzes: Quiz[];
  materials: StudyMaterial[];
  notes: Note[];
}

const STORAGE_KEYS = {
  USER: "user",
  LEARNING_PATHS: "learning_paths",
  MODULES: "modules",
  LESSONS: "lessons",
  FLASHCARD_PACKS: "flashcard_packs",
  QUIZ_PACKS: "quiz_packs",
  FLASHCARDS: "flashcards",
  QUIZZES: "quizzes",
  PROGRESS: "progress",
  STATS: "stats",
  NOTES: "notes",
  STUDY_MATERIALS: "study_materials",
};

export const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const getFromStorage = async <T>(key: string): Promise<T[]> => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveToStorage = async <T>(key: string, data: T[]) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch {}
};

// User
export const getUser = async (): Promise<User | null> => {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.USER);
  return data ? JSON.parse(data) : null;
};

export const saveUser = async (user: User) => {
  await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

// Learning Paths
export const getLearningPaths = async (): Promise<LearningPath[]> => {
  return getFromStorage<LearningPath>(STORAGE_KEYS.LEARNING_PATHS);
};

export const saveLearningPath = async (path: LearningPath) => {
  const paths = await getLearningPaths();
  const index = paths.findIndex((p) => p.id === path.id);
  if (index >= 0) paths[index] = path;
  else paths.push(path);
  await saveToStorage(STORAGE_KEYS.LEARNING_PATHS, paths);
};

export const deleteLearningPath = async (id: string) => {
  const paths = await getLearningPaths();
  await saveToStorage(STORAGE_KEYS.LEARNING_PATHS, paths.filter((p) => p.id !== id));
};

// Modules
export const getModules = async (pathId?: string): Promise<Module[]> => {
  const modules = await getFromStorage<Module>(STORAGE_KEYS.MODULES);
  return pathId ? modules.filter((m) => m.pathId === pathId) : modules;
};

export const saveModule = async (module: Module) => {
  const modules = await getModules();
  const index = modules.findIndex((m) => m.id === module.id);
  if (index >= 0) modules[index] = module;
  else modules.push(module);
  await saveToStorage(STORAGE_KEYS.MODULES, modules);
};

export const deleteModule = async (id: string) => {
  const modules = await getModules();
  await saveToStorage(STORAGE_KEYS.MODULES, modules.filter((m) => m.id !== id));
};

// Lessons
export const getLessons = async (moduleId?: string): Promise<Lesson[]> => {
  const lessons = await getFromStorage<Lesson>(STORAGE_KEYS.LESSONS);
  return moduleId ? lessons.filter((l) => l.moduleId === moduleId) : lessons;
};

export const saveLesson = async (lesson: Lesson) => {
  const lessons = await getLessons();
  const index = lessons.findIndex((l) => l.id === lesson.id);
  if (index >= 0) lessons[index] = lesson;
  else lessons.push(lesson);
  await saveToStorage(STORAGE_KEYS.LESSONS, lessons);
};

export const deleteLesson = async (id: string) => {
  const lessons = await getLessons();
  await saveToStorage(STORAGE_KEYS.LESSONS, lessons.filter((l) => l.id !== id));
};

// ─── Flashcard Packs ───────────────────────────────────────────
export const getFlashcardPacks = async (lessonId?: string): Promise<FlashcardPack[]> => {
  const packs = await getFromStorage<FlashcardPack>(STORAGE_KEYS.FLASHCARD_PACKS);
  return lessonId ? packs.filter((p) => p.lessonId === lessonId) : packs;
};

export const saveFlashcardPack = async (pack: FlashcardPack) => {
  const packs = await getFlashcardPacks();
  const index = packs.findIndex((p) => p.id === pack.id);
  if (index >= 0) packs[index] = pack;
  else packs.push(pack);
  await saveToStorage(STORAGE_KEYS.FLASHCARD_PACKS, packs);
};

export const deleteFlashcardPack = async (packId: string) => {
  const packs = await getFlashcardPacks();
  await saveToStorage(STORAGE_KEYS.FLASHCARD_PACKS, packs.filter((p) => p.id !== packId));
  // Also delete all flashcards in this pack
  const cards = await getFromStorage<Flashcard>(STORAGE_KEYS.FLASHCARDS);
  await saveToStorage(STORAGE_KEYS.FLASHCARDS, cards.filter((c) => c.packId !== packId));
};

// ─── Quiz Packs ────────────────────────────────────────────────
export const getQuizPacks = async (lessonId?: string): Promise<QuizPack[]> => {
  const packs = await getFromStorage<QuizPack>(STORAGE_KEYS.QUIZ_PACKS);
  return lessonId ? packs.filter((p) => p.lessonId === lessonId) : packs;
};

export const saveQuizPack = async (pack: QuizPack) => {
  const packs = await getQuizPacks();
  const index = packs.findIndex((p) => p.id === pack.id);
  if (index >= 0) packs[index] = pack;
  else packs.push(pack);
  await saveToStorage(STORAGE_KEYS.QUIZ_PACKS, packs);
};

export const deleteQuizPack = async (packId: string) => {
  const packs = await getQuizPacks();
  await saveToStorage(STORAGE_KEYS.QUIZ_PACKS, packs.filter((p) => p.id !== packId));
  const quizzes = await getFromStorage<Quiz>(STORAGE_KEYS.QUIZZES);
  await saveToStorage(STORAGE_KEYS.QUIZZES, quizzes.filter((q) => q.packId !== packId));
};

// ─── Flashcards ────────────────────────────────────────────────
export const getFlashcards = async (lessonId?: string): Promise<Flashcard[]> => {
  const cards = await getFromStorage<Flashcard>(STORAGE_KEYS.FLASHCARDS);
  return lessonId ? cards.filter((c) => c.lessonId === lessonId) : cards;
};

export const getFlashcardsByPack = async (packId: string): Promise<Flashcard[]> => {
  const cards = await getFromStorage<Flashcard>(STORAGE_KEYS.FLASHCARDS);
  return cards.filter((c) => c.packId === packId);
};

export const saveFlashcard = async (card: Flashcard) => {
  const cards = await getFlashcards();
  const index = cards.findIndex((c) => c.id === card.id);
  if (index >= 0) cards[index] = card;
  else cards.push(card);
  await saveToStorage(STORAGE_KEYS.FLASHCARDS, cards);
};

export const deleteFlashcard = async (id: string) => {
  const cards = await getFlashcards();
  await saveToStorage(STORAGE_KEYS.FLASHCARDS, cards.filter((c) => c.id !== id));
};

// ─── Quizzes ───────────────────────────────────────────────────
export const getQuizzes = async (lessonId?: string): Promise<Quiz[]> => {
  const quizzes = await getFromStorage<Quiz>(STORAGE_KEYS.QUIZZES);
  return lessonId ? quizzes.filter((q) => q.lessonId === lessonId) : quizzes;
};

export const getQuizzesByPack = async (packId: string): Promise<Quiz[]> => {
  const quizzes = await getFromStorage<Quiz>(STORAGE_KEYS.QUIZZES);
  return quizzes.filter((q) => q.packId === packId);
};

export const saveQuiz = async (quiz: Quiz) => {
  const quizzes = await getQuizzes();
  const index = quizzes.findIndex((q) => q.id === quiz.id);
  if (index >= 0) quizzes[index] = quiz;
  else quizzes.push(quiz);
  await saveToStorage(STORAGE_KEYS.QUIZZES, quizzes);
};

export const deleteQuiz = async (id: string) => {
  const quizzes = await getQuizzes();
  await saveToStorage(STORAGE_KEYS.QUIZZES, quizzes.filter((q) => q.id !== id));
};

// Progress & Stats
export const getProgress = async (lessonId?: string): Promise<Progress[]> => {
  const progress = await getFromStorage<Progress>(STORAGE_KEYS.PROGRESS);
  return lessonId ? progress.filter((p) => p.lessonId === lessonId) : progress;
};

export const saveProgress = async (progress: Progress) => {
  const all = await getProgress();
  all.push(progress);
  await saveToStorage(STORAGE_KEYS.PROGRESS, all);
};

export const getWrongAnswers = async (): Promise<Progress[]> => {
  return (await getProgress()).filter((p) => !p.isCorrect);
};

export const getStats = async (): Promise<Stats> => {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.STATS);
  return data
    ? JSON.parse(data)
    : { totalStudyTime: 0, totalAnswers: 0, correctAnswers: 0, streak: 0, lastStudyDate: "" };
};

export const updateStats = async (updates: Partial<Stats>) => {
  const stats = await getStats();
  const updated = { ...stats, ...updates };
  await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(updated));
};

export const clearAllData = async () => {
  await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
};

// ─── Notes ─────────────────────────────────────────────────────
export const getNotes = async (lessonId?: string): Promise<Note[]> => {
  const notes = await getFromStorage<Note>(STORAGE_KEYS.NOTES);
  return lessonId ? notes.filter((n) => n.lessonId === lessonId) : notes;
};

export const saveNote = async (note: Note) => {
  const notes = await getNotes();
  const index = notes.findIndex((n) => n.id === note.id);
  if (index >= 0) notes[index] = note;
  else notes.push(note);
  await saveToStorage(STORAGE_KEYS.NOTES, notes);
};

export const deleteNote = async (id: string) => {
  const notes = await getNotes();
  await saveToStorage(STORAGE_KEYS.NOTES, notes.filter((n) => n.id !== id));
};

// ─── Study Materials ───────────────────────────────────────────
export const getStudyMaterials = async (lessonId?: string): Promise<StudyMaterial[]> => {
  const mats = await getFromStorage<StudyMaterial>(STORAGE_KEYS.STUDY_MATERIALS);
  return lessonId ? mats.filter((m) => m.lessonId === lessonId) : mats;
};

export const saveStudyMaterial = async (mat: StudyMaterial) => {
  const mats = await getStudyMaterials();
  const index = mats.findIndex((m) => m.id === mat.id);
  if (index >= 0) mats[index] = mat;
  else mats.push(mat);
  await saveToStorage(STORAGE_KEYS.STUDY_MATERIALS, mats);
};

export const deleteStudyMaterial = async (id: string) => {
  const mats = await getStudyMaterials();
  await saveToStorage(STORAGE_KEYS.STUDY_MATERIALS, mats.filter((m) => m.id !== id));
};

// ─── Course Pack Export / Import ───────────────────────────────
export const exportCourse = async (pathId?: string): Promise<CoursePack> => {
  const [paths, modules, lessons, flashcardPacks, quizPacks, flashcards, quizzes, materials, notes] =
    await Promise.all([
      getLearningPaths(),
      getModules(),
      getLessons(),
      getFlashcardPacks(),
      getQuizPacks(),
      getFlashcards(),
      getQuizzes(),
      getStudyMaterials(),
      getNotes(),
    ]);

  const filteredPaths = pathId ? paths.filter((p) => p.id === pathId) : paths;
  const pathIds = new Set(filteredPaths.map((p) => p.id));
  const filteredModules = modules.filter((m) => pathIds.has(m.pathId));
  const moduleIds = new Set(filteredModules.map((m) => m.id));
  const filteredLessons = lessons.filter((l) => moduleIds.has(l.moduleId));
  const lessonIds = new Set(filteredLessons.map((l) => l.id));

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    paths: filteredPaths,
    modules: filteredModules,
    lessons: filteredLessons,
    flashcardPacks: flashcardPacks.filter((p) => lessonIds.has(p.lessonId)),
    quizPacks: quizPacks.filter((p) => lessonIds.has(p.lessonId)),
    flashcards: flashcards.filter((c) => lessonIds.has(c.lessonId)),
    quizzes: quizzes.filter((q) => lessonIds.has(q.lessonId)),
    materials: materials.filter((m) => lessonIds.has(m.lessonId)),
    notes: notes.filter((n) => lessonIds.has(n.lessonId)),
  };
};

export const importCourse = async (pack: CoursePack): Promise<number> => {
  let imported = 0;

  for (const p of pack.paths ?? []) { await saveLearningPath(p); imported++; }
  for (const m of pack.modules ?? []) { await saveModule(m); imported++; }
  for (const l of pack.lessons ?? []) { await saveLesson(l); imported++; }
  for (const p of pack.flashcardPacks ?? []) { await saveFlashcardPack(p); }
  for (const p of pack.quizPacks ?? []) { await saveQuizPack(p); }
  for (const c of pack.flashcards ?? []) { await saveFlashcard(c); imported++; }
  for (const q of pack.quizzes ?? []) { await saveQuiz(q); imported++; }
  for (const m of pack.materials ?? []) { await saveStudyMaterial(m); imported++; }
  for (const n of pack.notes ?? []) { await saveNote(n); imported++; }

  return imported;
};
