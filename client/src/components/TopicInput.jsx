import { useState } from "react";

const MAX_CHARS = 8000;
const PLACEHOLDER =
  "Paste your notes, or just type a topic — e.g. \"the French Revolution\" or \"React useEffect cleanup\"...";

export function TopicInput({ onSubmit, disabled }) {
  const [value, setValue] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(value);
  }

  const overLimit = value.length > MAX_CHARS;

  return (
    <form className="input-panel" onSubmit={handleSubmit}>
      <label htmlFor="topic-input" className="eyebrow">
        Notes or topic
      </label>
      <textarea
        id="topic-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={PLACEHOLDER}
        disabled={disabled}
        aria-describedby="char-count"
      />
      <div className="input-panel-footer">
        <span
          id="char-count"
          className={`char-count ${overLimit ? "char-count-warn" : ""}`}
        >
          {value.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
        </span>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={disabled || !value.trim() || overLimit}
        >
          {disabled ? "Generating…" : "Generate study set ▸"}
        </button>
      </div>
    </form>
  );
}
