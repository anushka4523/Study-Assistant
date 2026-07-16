import { useCallback, useRef, useState } from "react";
import { generateStudySet } from "../api/generate.js";
import { saveSession } from "../lib/storage.js";

// idle -> loading -> success | error
export function useStudySession() {
  const [status, setStatus] = useState("idle");
  const [studySet, setStudySet] = useState(null);
  const [error, setError] = useState(null);
  const [lastInput, setLastInput] = useState("");

  // Tracks the in-flight request so we can abort it and, more importantly,
  // so a response from an OLD request can never overwrite a newer one even
  // if abort() doesn't win the race (slow network, etc).
  const requestIdRef = useRef(0);
  const abortRef = useRef(null);

  const generate = useCallback(async (input) => {
    const trimmed = input.trim();
    if (!trimmed) {
      setError("Type a topic or paste some notes first.");
      setStatus("error");
      return;
    }

    // Cancel whatever was in flight - its result must never land after ours.
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const thisRequestId = ++requestIdRef.current;

    setStatus("loading");
    setError(null);
    setLastInput(trimmed);

    try {
      const data = await generateStudySet(trimmed, { signal: controller.signal });

      // A newer request may have started while we were waiting - if so,
      // silently drop this result instead of overwriting fresher state.
      if (thisRequestId !== requestIdRef.current) return;

      setStudySet(data);
      setStatus("success");
      saveSession({ input: trimmed, studySet: data, checkedPoints: {} });
    } catch (err) {
      if (err.name === "AbortError") return; // superseded, not a real error
      if (thisRequestId !== requestIdRef.current) return;

      setError(err.message || "Something went wrong. Please try again.");
      setStatus("error");
    }
  }, []);

  const retry = useCallback(() => {
    if (lastInput) generate(lastInput);
  }, [generate, lastInput]);

  const loadFromSession = useCallback((session) => {
    if (abortRef.current) abortRef.current.abort();
    requestIdRef.current += 1; // invalidate any in-flight request
    setStudySet(session.studySet);
    setLastInput(session.input);
    setStatus("success");
    setError(null);
  }, []);

  const reset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    requestIdRef.current += 1;
    setStatus("idle");
    setStudySet(null);
    setError(null);
    setLastInput("");
  }, []);

  return { status, studySet, error, lastInput, generate, retry, loadFromSession, reset };
}
