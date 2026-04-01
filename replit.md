# MobileLearning App

Aplikasi belajar mobile (Expo React Native) dengan flashcard, quiz, dan learning path management.

## Architecture

### Artifacts
- **`artifacts/mobile`** — Expo SDK 54 app (primary app)
- **`artifacts/api-server`** — Express API server (placeholder)
- **`artifacts/mockup-sandbox`** — Vite design sandbox

### Mobile App Stack
- **Expo SDK 54** + **Expo Router v6** (file-based routing)
- **NativeWind v4** + **TailwindCSS v3** (styling via className)
- **lucide-react-native** (icons — NOT @expo/vector-icons)
- **AsyncStorage** (all data stored locally — no backend/database)
- **expo-file-system** (image/file storage)
- **expo-document-picker** (JSON file import)

## Key Features
1. **Onboarding** — first launch wizard, saved to AsyncStorage
2. **Learning Path** — hierarki Path → Module → Lesson
3. **Flashcard Player** — flip animation, mark known/unknown
4. **Quiz Player** — multiple choice, score tracking, results screen
5. **Upload Batch JSON** — import flashcard/quiz dari file .json (strict format)
6. **Prompt Builder** — generate AI prompts yang output JSON siap upload
7. **Mistakes Review** — review ulang jawaban yang salah
8. **AdMob Banner** — placeholder component (untuk production: react-native-google-mobile-ads)

## JSON Batch Format

### Flashcard
```json
{
  "lessonId": "<lessonId>",
  "flashcards": [
    { "question": "...", "answer": "...", "tag": "Key Concept" }
  ]
}
```
Valid tags: `"Key Concept"`, `"Syntax"`, `"Vocabulary"`, `"Example"`, `"Pitfall"`

### Quiz
```json
{
  "lessonId": "<lessonId>",
  "quizzes": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "answer": "A",
      "type": "multiple-choice"
    }
  ]
}
```
- `answer` harus sama persis dengan salah satu value di `options`
- `type`: `"multiple-choice"` atau `"true-false"`
- Untuk `true-false`: options wajib `["True", "False"]`

## AdMob Setup (Production)
Untuk production build, tambahkan di `app.json`:
```json
"plugins": [
  ["react-native-google-mobile-ads", {
    "androidAppId": "ca-app-pub-XXXXXXXX~XXXXXXXX",
    "iosAppId": "ca-app-pub-XXXXXXXX~XXXXXXXX"
  }]
]
```
Test Ad Unit IDs:
- Android Banner: `ca-app-pub-3940256099942544/6300978111`
- iOS Banner: `ca-app-pub-3940256099942544/2934735716`

## File Structure (Mobile)
```
artifacts/mobile/
  app/
    _layout.tsx              # Root layout + onboarding guard
    onboarding.tsx           # First-launch wizard
    (tabs)/
      _layout.tsx            # Tab bar (Home, Belajar, Progress, Menu)
      index.tsx              # Dashboard
      learn.tsx              # Learning Path manager
      progress.tsx           # Stats & mistakes
      profile.tsx            # User profile & reset
    flashcard/[lessonId].tsx # Flashcard player (flip animation)
    quiz/[lessonId].tsx      # Quiz player
    create-flashcard/[lessonId].tsx  # Manual flashcard input
    create-quiz/[lessonId].tsx       # Manual quiz input
    upload-batch/[lessonId].tsx      # JSON batch import (KEY FEATURE)
    mistakes-review.tsx      # Review jawaban salah
  components/
    Button.tsx               # Reusable button (NativeWind + CVA)
    Card.tsx                 # Card container
    Progress.tsx             # Progress bar
    AdBanner.tsx             # AdMob placeholder
    PromptBuilder.tsx        # AI prompt generator (JSON-format aware)
  utils/
    storage.ts               # AsyncStorage helpers + type definitions
    prompt-templates.ts      # Prompt templates with JSON output format
    validateBatchJSON.ts     # Strict JSON validator (Indonesian error msgs)
    cn.ts                    # Tailwind class merger
    permissions.ts           # Media/storage permission helpers
  global.css                 # NativeWind Tailwind directives
  tailwind.config.js         # TailwindCSS v3 config
  babel.config.js            # NativeWind babel plugin
  metro.config.js            # NativeWind metro config
```

## Development Notes
- NativeWind v4 requires TailwindCSS v3 (NOT v4)
- React Native Reanimated v4 does NOT use the babel plugin
- All routing uses Expo Router v6 file-based conventions
- `@/` alias maps to the artifact root (`artifacts/mobile/`)
