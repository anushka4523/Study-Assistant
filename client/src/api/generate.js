const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";

/**
 * Posts the user's input to the backend and returns the parsed study set.
 * Accepts an AbortSignal so callers can cancel a stale in-flight request
 * (e.g. the user submits a new prompt before the previous one resolves).
 *
 * Throws an Error with a user-facing message on any failure - the caller
 * is expected to catch it and show it in the UI.
 */
export async function generateStudySet(input, { signal } = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
      signal,
    });
  } catch (err) {
    if (err.name === "AbortError") throw err; // let caller distinguish cancellation
    throw new Error(
      "Couldn't reach the server. Is it running? (npm run start:server)"
    );
  }

  let body;
  try {
    body = await res.json();
  } catch {
    throw new Error("The server sent back something that wasn't valid JSON.");
  }

  if (!res.ok) {
    throw new Error(body.error || `Server error (${res.status}).`);
  }

  return body.data;
}
