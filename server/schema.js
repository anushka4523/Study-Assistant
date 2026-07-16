import { z } from "zod";

// A single flashcard
const FlashcardSchema = z.object({
  id: z.string().min(1),
  front: z.string().min(1),
  back: z.string().min(1),
});

const FlashcardsBlockSchema = z.object({
  type: z.literal("flashcards"),
  title: z.string().min(1),
  cards: z.array(FlashcardSchema).min(3).max(12),
});

// A single multiple-choice question
const QuizQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(6),
  correctIndex: z.number().int().min(0),
  explanation: z.string().min(1),
});

const QuizBlockSchema = z.object({
  type: z.literal("quiz"),
  title: z.string().min(1),
  questions: z.array(QuizQuestionSchema).min(3).max(10),
});

const SummaryBlockSchema = z.object({
  type: z.literal("summary"),
  title: z.string().min(1),
  points: z.array(z.string().min(1)).min(3).max(8),
});

// A block is one of the three kinds above. Order in the union matters for
// error messages only; parsing tries each in turn.
const BlockSchema = z.discriminatedUnion("type", [
  FlashcardsBlockSchema,
  QuizBlockSchema,
  SummaryBlockSchema,
]);

export const StudySetSchema = z.object({
  topic: z.string().min(1),
  blocks: z.array(BlockSchema).min(1).max(6),
});

/**
 * Extra semantic checks zod's shape validation can't express, e.g. making
 * sure correctIndex actually points at one of the options. Returns a list
 * of human-readable problems (empty = valid).
 */
export function semanticIssues(studySet) {
  const issues = [];
  for (const block of studySet.blocks) {
    if (block.type === "quiz") {
      for (const q of block.questions) {
        if (q.correctIndex > q.options.length - 1) {
          issues.push(
            `Question "${q.id}" has correctIndex ${q.correctIndex} but only ${q.options.length} options.`
          );
        }
      }
    }
  }
  return issues;
}
