import { useEffect, useState } from "react";

const MESSAGES = [
  "Reading through what you gave it…",
  "Drafting flashcards…",
  "Writing quiz questions…",
  "Double-checking the answer key…",
];

export function LoadingState() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMessageIndex((i) => (i + 1) % MESSAGES.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="state-panel" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <h3>Building your study set</h3>
      <p className="loading-fact">{MESSAGES[messageIndex]}</p>
    </div>
  );
}
