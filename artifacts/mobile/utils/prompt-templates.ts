export type TemplateTopic = "Programming" | "Language" | "Science" | "Math" | "History" | "General";
export type TemplateType = "Flashcards" | "Quiz";

interface PromptTemplate {
  id: string;
  topic: TemplateTopic;
  type: TemplateType;
  title: string;
  template: string;
}

// ─── JSON FORMAT SPECS ────────────────────────────────────────────────────────
//
// Flashcard JSON:
// {
//   "lessonId": "<lessonId>",
//   "flashcards": [
//     { "question": "...", "answer": "...", "tag": "Key Concept" }
//   ]
// }
//
// Quiz JSON:
// {
//   "lessonId": "<lessonId>",
//   "quizzes": [
//     {
//       "question": "...",
//       "options": ["A", "B", "C", "D"],
//       "answer": "A",
//       "type": "multiple-choice"
//     }
//   ]
// }
// ─────────────────────────────────────────────────────────────────────────────

const FLASHCARD_JSON_FORMAT = `
Respond ONLY with valid JSON in this exact format (no explanation, no markdown):
{
  "lessonId": "[LESSON_ID]",
  "flashcards": [
    { "question": "...", "answer": "...", "tag": "Key Concept" },
    { "question": "...", "answer": "...", "tag": "Syntax" }
  ]
}
Valid tags: "Key Concept", "Syntax", "Vocabulary", "Example", "Pitfall"`;

const QUIZ_JSON_FORMAT = `
Respond ONLY with valid JSON in this exact format (no explanation, no markdown):
{
  "lessonId": "[LESSON_ID]",
  "quizzes": [
    {
      "question": "...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Option A",
      "type": "multiple-choice"
    }
  ]
}
Rules: "answer" must exactly match one of the "options". "type" must be "multiple-choice" or "true-false". For true-false, options must be ["True", "False"].`;

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: "prog-fc",
    topic: "Programming",
    type: "Flashcards",
    title: "Concepts & Syntax",
    template: `Create 10 flashcards about [TOPIC]. Focus on core concepts, syntax, and common pitfalls.\n${FLASHCARD_JSON_FORMAT}`,
  },
  {
    id: "prog-qz",
    topic: "Programming",
    type: "Quiz",
    title: "Multiple Choice Quiz",
    template: `Generate 5 multiple-choice quiz questions about [TOPIC]. Difficulty: Intermediate.\n${QUIZ_JSON_FORMAT}`,
  },
  {
    id: "lang-fc",
    topic: "Language",
    type: "Flashcards",
    title: "Vocabulary & Phrases",
    template: `Create 15 vocabulary flashcards for learning [TOPIC]. Include the word, meaning, and an example sentence.\n${FLASHCARD_JSON_FORMAT}`,
  },
  {
    id: "lang-qz",
    topic: "Language",
    type: "Quiz",
    title: "Grammar & Vocabulary Quiz",
    template: `Generate 5 multiple-choice questions about [TOPIC] grammar and vocabulary.\n${QUIZ_JSON_FORMAT}`,
  },
  {
    id: "science-fc",
    topic: "Science",
    type: "Flashcards",
    title: "Key Principles",
    template: `Create 10 flashcards about key principles and terms in [TOPIC].\n${FLASHCARD_JSON_FORMAT}`,
  },
  {
    id: "science-qz",
    topic: "Science",
    type: "Quiz",
    title: "Science Concepts Quiz",
    template: `Generate 5 multiple-choice quiz questions about [TOPIC] concepts.\n${QUIZ_JSON_FORMAT}`,
  },
  {
    id: "math-fc",
    topic: "Math",
    type: "Flashcards",
    title: "Formulas & Definitions",
    template: `Create 10 flashcards about [TOPIC] formulas, definitions, and key concepts.\n${FLASHCARD_JSON_FORMAT}`,
  },
  {
    id: "math-qz",
    topic: "Math",
    type: "Quiz",
    title: "Problem Solving Quiz",
    template: `Generate 5 multiple-choice math problems about [TOPIC] from simple to complex.\n${QUIZ_JSON_FORMAT}`,
  },
  {
    id: "hist-fc",
    topic: "History",
    type: "Flashcards",
    title: "Dates & Events",
    template: `Generate 10 flashcards about major events, dates, and figures in [TOPIC] history.\n${FLASHCARD_JSON_FORMAT}`,
  },
  {
    id: "hist-qz",
    topic: "History",
    type: "Quiz",
    title: "Historical Events Quiz",
    template: `Generate 5 multiple-choice questions about important events in [TOPIC] history.\n${QUIZ_JSON_FORMAT}`,
  },
  {
    id: "gen-fc",
    topic: "General",
    type: "Flashcards",
    title: "General Knowledge Cards",
    template: `Create 10 flashcards about [TOPIC] general knowledge.\n${FLASHCARD_JSON_FORMAT}`,
  },
  {
    id: "gen-qz",
    topic: "General",
    type: "Quiz",
    title: "General Knowledge Quiz",
    template: `Generate 5 multiple-choice general knowledge questions about [TOPIC].\n${QUIZ_JSON_FORMAT}`,
  },
];

export const generatePrompt = (template: string, topic: string, lessonId?: string) => {
  return template
    .replace(/\[TOPIC\]/g, topic)
    .replace(/\[LESSON_ID\]/g, lessonId || "YOUR_LESSON_ID");
};
