import type { FlashcardBatchJSON, QuizBatchJSON } from "./storage";

export function validateFlashcardBatch(json: unknown): FlashcardBatchJSON {
  if (typeof json !== "object" || json === null) {
    throw new Error('JSON harus berupa object, bukan array atau string.');
  }

  const obj = json as Record<string, unknown>;

  if (!obj.lessonId || typeof obj.lessonId !== "string") {
    throw new Error('Field "lessonId" wajib ada dan bertipe string.');
  }

  if (!Array.isArray(obj.flashcards) || obj.flashcards.length === 0) {
    throw new Error('Field "flashcards" wajib berupa array dan tidak boleh kosong.');
  }

  const VALID_TAGS = ["Key Concept", "Syntax", "Vocabulary", "Example", "Pitfall"];

  obj.flashcards.forEach((item: unknown, i: number) => {
    if (typeof item !== "object" || item === null) {
      throw new Error(`flashcards[${i}] harus berupa object.`);
    }
    const card = item as Record<string, unknown>;
    if (!card.question || typeof card.question !== "string") {
      throw new Error(`flashcards[${i}].question wajib ada dan bertipe string.`);
    }
    if (!card.answer || typeof card.answer !== "string") {
      throw new Error(`flashcards[${i}].answer wajib ada dan bertipe string.`);
    }
    if (!card.tag || typeof card.tag !== "string") {
      throw new Error(`flashcards[${i}].tag wajib ada. Gunakan: ${VALID_TAGS.join(", ")}`);
    }
    if (!VALID_TAGS.includes(card.tag as string)) {
      throw new Error(`flashcards[${i}].tag tidak valid: "${card.tag}". Gunakan: ${VALID_TAGS.join(", ")}`);
    }
  });

  return obj as unknown as FlashcardBatchJSON;
}

export function validateQuizBatch(json: unknown): QuizBatchJSON {
  if (typeof json !== "object" || json === null) {
    throw new Error('JSON harus berupa object, bukan array atau string.');
  }

  const obj = json as Record<string, unknown>;

  if (!obj.lessonId || typeof obj.lessonId !== "string") {
    throw new Error('Field "lessonId" wajib ada dan bertipe string.');
  }

  if (!Array.isArray(obj.quizzes) || obj.quizzes.length === 0) {
    throw new Error('Field "quizzes" wajib berupa array dan tidak boleh kosong.');
  }

  obj.quizzes.forEach((item: unknown, i: number) => {
    if (typeof item !== "object" || item === null) {
      throw new Error(`quizzes[${i}] harus berupa object.`);
    }
    const q = item as Record<string, unknown>;

    if (!q.question || typeof q.question !== "string") {
      throw new Error(`quizzes[${i}].question wajib ada dan bertipe string.`);
    }

    if (!Array.isArray(q.options) || q.options.length < 2) {
      throw new Error(`quizzes[${i}].options harus berupa array minimal 2 item.`);
    }

    q.options.forEach((opt: unknown, j: number) => {
      if (typeof opt !== "string" || !opt.trim()) {
        throw new Error(`quizzes[${i}].options[${j}] harus berupa string tidak kosong.`);
      }
    });

    if (!q.answer || typeof q.answer !== "string") {
      throw new Error(`quizzes[${i}].answer wajib ada dan bertipe string.`);
    }

    if (!(q.options as string[]).includes(q.answer as string)) {
      throw new Error(`quizzes[${i}].answer harus sama persis dengan salah satu nilai di options.`);
    }

    if (q.type !== "multiple-choice" && q.type !== "true-false") {
      throw new Error(`quizzes[${i}].type harus "multiple-choice" atau "true-false".`);
    }

    if (q.type === "true-false") {
      const opts = q.options as string[];
      if (!opts.includes("True") || !opts.includes("False")) {
        throw new Error(`quizzes[${i}] bertipe true-false: options harus ["True", "False"].`);
      }
    }
  });

  return obj as unknown as QuizBatchJSON;
}
