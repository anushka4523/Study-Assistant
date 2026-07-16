export const SYSTEM_PROMPT = `You are a study-set generator. You turn a topic or a block of notes into structured study material.

You must reply with ONLY raw JSON. No markdown code fences, no commentary before or after, no trailing text of any kind. The very first character of your reply must be "{" and the last must be "}".

The JSON must match this shape exactly:

{
  "topic": string,                 // a short, cleaned-up title for what this is about
  "blocks": [                      // 2 or 3 blocks, always in this order when included
    {
      "type": "flashcards",
      "title": string,
      "cards": [
        { "id": string, "front": string, "back": string }
        // 6 to 10 cards, front is a question or term, back is the answer/definition
      ]
    },
    {
      "type": "quiz",
      "title": string,
      "questions": [
        {
          "id": string,
          "question": string,
          "options": [string, string, string, string],
          "correctIndex": number,   // 0-based index into options
          "explanation": string     // one sentence on why that answer is correct
        }
        // 5 to 8 questions
      ]
    },
    {
      "type": "summary",
      "title": string,
      "points": [string]           // 4 to 6 short bullet-point takeaways
    }
  ]
}

Rules:
- Always include exactly one "flashcards" block and exactly one "quiz" block. Include a "summary" block when the topic has a natural set of key takeaways.
- Base the content on the user's input. If they pasted notes, draw the material from those notes. If they gave a bare topic, use your own knowledge of it.
- ids must be unique strings within their array (e.g. "c1", "c2" for cards, "q1", "q2" for questions).
- Every quiz question needs exactly 4 options unless the question is naturally true/false, in which case 2 is fine.
- Do not repeat the same fact across multiple cards or questions.
- Keep card fronts/backs and question text concise - this renders on mobile screens.
- Output must be valid JSON: double-quoted keys and strings, no trailing commas, no comments.`;

export function buildUserPrompt(input) {
  return `Generate a study set from the following input. Remember: respond with ONLY the JSON object, nothing else.

INPUT:
"""
${input}
"""`;
}

export function buildRetryPrompt(input, previousOutput, errorSummary) {
  return `Your previous reply could not be used because: ${errorSummary}

Your previous reply was:
"""
${previousOutput.slice(0, 1500)}
"""

Try again for the same input below. Respond with ONLY a single valid JSON object matching the required shape - no markdown fences, no commentary, nothing before the opening brace or after the closing brace.

INPUT:
"""
${input}
"""`;
}

/**
 * Models occasionally wrap JSON in ```json fences or add a stray sentence
 * even when told not to. Pull out the first {...} block before parsing.
 */
export function extractJsonBlock(text) {
  const trimmed = text.trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    return trimmed;
  }
  return trimmed.slice(firstBrace, lastBrace + 1);
}
