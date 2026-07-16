// Works for any provider that speaks the OpenAI chat-completions dialect:
// OpenAI itself, Groq, and OpenRouter all do. Point OPENAI_BASE_URL at the
// right host and this adapter doesn't change.
const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export async function callOpenAICompatible({ systemPrompt, userPrompt, signal }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to server/.env (see .env.example)."
    );
  }
  const baseUrl = process.env.OPENAI_BASE_URL || DEFAULT_BASE_URL;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `${baseUrl} error ${res.status}: ${body.slice(0, 300)}`
    );
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("Provider returned no message content.");
  }
  return text;
}
