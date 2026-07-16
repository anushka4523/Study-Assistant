# Notecard — study set generator

Paste your notes or name a topic, and get back an interactive study set:
flashcards you can flip through, a multiple-choice quiz with a
"retest wrong answers" loop, and a checklist summary — all rendered as real
UI components, not a wall of chat text.

Built for the **Frontend Internship Assignment** (Study assistant option).

## What it looks like

- **Input** — a notebook-style textarea where you paste notes or type a topic.
- **Flashcards** — a flip-card deck with keyboard navigation (←/→ to move,
  space/enter to flip) and shuffle.
- **Quiz** — multiple choice with per-question feedback, a score banner, and a
  "retest wrong answers" button that loops until every question is answered
  correctly.
- **Summary** — a checklist of key takeaways you can tick off as you review.
- Saved sessions (localStorage) so you can reload a past study set without
  regenerating it.

## Project structure

```
study-ai-assistant/
├── client/          Vite + React frontend
│   └── src/
│       ├── components/   TopicInput, FlashcardDeck, QuizView, SummaryChecklist,
│       │                 ResultTabs, SessionBar, Loading/Error/Empty states
│       ├── hooks/         useStudySession.js — request lifecycle & stale-response guard
│       ├── api/           generate.js — fetch wrapper to the backend
│       ├── lib/           storage.js — localStorage session persistence
│       └── styles/        global.css — design system
├── server/          Express backend (keeps the API key off the client)
│   ├── index.js         /api/generate route: prompts the model, validates,
│   │                     retries on bad output
│   ├── schema.js         zod schema the AI's JSON must satisfy
│   ├── prompt.js          system prompt + retry-prompt builders
│   └── providers/         anthropic.js, openaiCompatible.js (OpenAI/Groq/OpenRouter)
└── package.json     runs both with one command
```

## Setup

Requires Node 18+.

1. **Get an API key** from any supported provider:
   - [Anthropic](https://console.anthropic.com/) (default), or
   - [Groq](https://console.groq.com/) / [OpenRouter](https://openrouter.ai/) /
     OpenAI (all use the same OpenAI-compatible adapter — free tiers available
     on Groq and OpenRouter).

2. **Configure the server:**
   ```bash
   cp server/.env.example server/.env
   ```
   Open `server/.env` and paste your key in. To use Anthropic (default), just
   set `ANTHROPIC_API_KEY`. To use Groq/OpenRouter/OpenAI instead, set
   `AI_PROVIDER=openai`, `OPENAI_API_KEY`, and (for Groq/OpenRouter)
   `OPENAI_BASE_URL` — examples are commented in the file.

3. **(Optional) Configure the client**, only needed if you change the
   server's port:
   ```bash
   cp client/.env.example client/.env
   ```

4. **Install and run everything from the repo root:**
   ```bash
   npm install
   npm start
   ```
   This installs both `client/` and `server/` dependencies and starts them
   together — the API on `http://localhost:8787`, the app on
   `http://localhost:5173`. Open the second one.

   To run them separately: `npm run start:server` and `npm run start:client`.

## Why a backend at all?

The assignment requires the API key never ship to the browser. `client/`
never talks to the AI provider directly — it POSTs the raw text to
`server`'s `/api/generate`, which holds the key, builds the prompt, calls the
model, and only returns validated JSON back to the browser.

## How bad AI output is handled

This was the main point of the assignment, so here's the full chain:

1. **Prompting** — the system prompt spells out the exact JSON shape, tells
   the model to output nothing but that JSON, and caps list lengths so
   replies don't get so long they run out of tokens mid-object.
2. **Extraction** — `extractJsonBlock()` strips markdown fences or stray
   commentary the model adds despite instructions, by slicing from the first
   `{` to the last `}`.
3. **Structural validation** — the extracted text is parsed with `JSON.parse`
   and checked against a `zod` schema (`server/schema.js`). This catches
   missing fields, wrong types, empty arrays, and unknown block types.
4. **Semantic validation** — `semanticIssues()` catches things a shape
   check can't, like a quiz question's `correctIndex` pointing past the end
   of its own `options` array.
5. **Automatic retry** — if validation fails, the server calls the model
   again (up to 2 more times), this time telling it exactly what was wrong
   and showing it its own broken output, then re-validates. This is what
   `attempts` in the API response reflects. I tested this against a mock
   provider that returns malformed JSON on the first call and a valid
   payload on the second — the endpoint correctly recovers and returns
   `attempts: 2`.
6. **Giving up gracefully** — after 3 total attempts the server returns a
   502 with a clear message instead of ever passing broken data to the
   client.
7. **On the client** — every state (loading / error / empty / success) has
   its own UI. A failed request shows a retry button; it never crashes the
   page or renders a half-parsed object.
8. **Stale responses** — if you submit a new prompt before the previous one
   finishes, the in-flight request is aborted *and* every response is
   tagged with a request id, so even if an old response arrives late it's
   silently dropped instead of overwriting newer state. This is handled in
   `useStudySession.js`.
9. **Timeouts** — the server aborts the model call after 30s and returns a
   504 rather than leaving the client hanging indefinitely.

## AI-usage note

This project was built with heavy use of Claude (Anthropic) as a pair
programmer — architecture, component code, the validation/retry pipeline,
CSS, and this README were all written with AI assistance, then reviewed and
tested. Being upfront about that per the assignment's instructions.

## Known limitations

- **No streaming.** The full study set is generated in one request rather
  than streamed token-by-token. Given the retry/validation pipeline needs a
  complete response to validate against the schema, streaming would need
  partial-JSON parsing — noted as a good next step, not implemented here.
- **No refinement loop.** You regenerate a full new set rather than sending
  a follow-up like "make the quiz harder." Would build this next by keeping
  the previous study set in the prompt context and asking the model to edit
  it, then re-validating.
- **Retry cost is invisible to the user.** If the model needs 2–3 attempts,
  the user just sees a slightly longer loading state, not *why*. Fine for
  this scope, but a production version might surface "cleaning up the AI's
  response…" on retry.
- **Provider-side rate limiting isn't specially handled** beyond the generic
  network-error path — a 429 currently surfaces as a generic "could not
  reach the AI provider" error rather than a friendlier "slow down" message.
- **Sessions are per-browser** (localStorage), not synced across devices —
  fine for the assignment's scope, no auth was in scope either.
- Smaller/local models (e.g. via Ollama) will hit the retry path far more
  often than Claude/GPT-4o-mini; the pipeline is built to handle that but it
  hasn't been benchmarked against a local model specifically.

## Time spent

~8 hours total: backend + provider adapters + validation/retry pipeline
(~3h), frontend components and state management (~3h), design/CSS pass and
mobile responsiveness (~1.5h), testing (mock-provider integration test for
the retry path) and this README (~0.5h).
