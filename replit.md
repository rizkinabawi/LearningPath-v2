# LearningPath App

Aplikasi belajar mobile (Expo React Native) dari repo https://github.com/rizkinabawi/LearningPath.

## Architecture

### Artifacts
- **`artifacts/mobile`** — Expo SDK 54 app (primary app)
- **`artifacts/api-server`** — Express API server (placeholder)
- **`artifacts/mockup-sandbox`** — Vite design sandbox

### Mobile App Stack
- **Expo SDK 54** + **Expo Router v6** (file-based routing)
- **React Native StyleSheet** (styling — NO NativeWind/TailwindCSS)
- **@expo/vector-icons** Feather icons
- **lucide-react-native** (juga digunakan di beberapa komponen)
- **AsyncStorage** (semua data lokal — tidak ada backend)
- **expo-file-system**, **expo-document-picker**, **expo-sharing**, **expo-print**
- **jszip** (zip export)
- **expo-clipboard** (copy to clipboard)

## Key Features
1. **Onboarding** — wizard multi-step saat pertama kali buka
2. **Learning Path** — hierarki Path → Module → Lesson
3. **Flashcard Player** — flip card, tandai tahu/tidak tahu
4. **Quiz Player** — pilihan ganda, tracking skor
5. **Create Flashcard** — input manual flashcard per lesson
6. **Create Quiz** — input manual quiz per lesson
7. **Notes** — catatan per lesson
8. **Study Material** — materi belajar (text/html/file) per lesson
9. **Prompt Builder** — generate AI prompt untuk buat soal, dengan JSON export/zip
10. **Mistakes Review** — review ulang jawaban yang salah
11. **Progress Dashboard** — statistik, streak, akurasi, difficulty classifier
12. **Report Generator** — export laporan belajar

## File Structure (Mobile)
```
artifacts/mobile/
  app/
    _layout.tsx                    # Root layout (fonts, providers, splash)
    onboarding.tsx                 # Multi-step wizard onboarding
    mistakes-review.tsx            # Review jawaban salah
    (tabs)/
      _layout.tsx                  # Tab bar (Home, Belajar, Latihan, Progress, Menu)
      index.tsx                    # Dashboard (stats, tips, quick access)
      learn.tsx                    # Learning Path CRUD manager
      practice.tsx                 # Practice hub (flashcard & quiz selection)
      progress.tsx                 # Progress stats + PromptBuilder + AI prompts
      profile.tsx                  # Profil user, edit, share, export, reset
    flashcard/[lessonId].tsx       # Flashcard player
    quiz/[lessonId].tsx            # Quiz player
    create-flashcard/[lessonId].tsx # Input manual flashcard
    create-quiz/[lessonId].tsx      # Input manual quiz
    notes/[lessonId].tsx           # Catatan per lesson
    study-material/[lessonId].tsx  # Materi belajar per lesson
  components/
    Button.tsx
    Card.tsx
    ErrorBoundary.tsx
    ErrorFallback.tsx
    KeyboardAwareScrollViewCompat.tsx
    ProgressBar.tsx
    PromptBuilder.tsx              # AI prompt generator + JSON/ZIP export
    Toast.tsx                      # Global toast notifications
  constants/
    colors.ts                      # Design tokens (flat color palette)
  hooks/
    useColors.ts                   # Returns Colors object
  utils/
    storage.ts                     # AsyncStorage helpers + type definitions
    prompt-templates.ts            # AI prompt templates
    difficulty-classifier.ts       # Klasifikasi kesulitan soal
    report-generator.ts            # Generate HTML report
    json-export.ts                 # Export JSON (share/clipboard)
    zip-handler.ts                 # ZIP export
  babel.config.js                  # Standard expo preset (NO nativewind)
  metro.config.js                  # Standard expo metro (NO withNativeWind)
```

## Development Notes
- **TIDAK menggunakan NativeWind/TailwindCSS** — murni React Native StyleSheet
- **TIDAK ada global.css** — tidak diperlukan
- Routing: Expo Router v6 file-based
- `@/` alias → `artifacts/mobile/`
- Onboarding redirect: jika tidak ada user di AsyncStorage → `/onboarding`
- Icons: Feather dari `@expo/vector-icons`
- Data: hanya AsyncStorage, tidak ada API/database
