import { useState } from "react";
import { FlashcardDeck } from "./FlashcardDeck.jsx";
import { QuizView } from "./QuizView.jsx";
import { SummaryChecklist } from "./SummaryChecklist.jsx";

const TAB_LABELS = {
  flashcards: "Flashcards",
  quiz: "Quiz",
  summary: "Summary",
};

function BlockRenderer({ block }) {
  switch (block.type) {
    case "flashcards":
      return <FlashcardDeck block={block} key={block.title} />;
    case "quiz":
      return <QuizView block={block} key={block.title} />;
    case "summary":
      return <SummaryChecklist block={block} key={block.title} />;
    default:
      // Defensive: the backend schema should prevent this, but if a new
      // block type is ever added server-side before the client knows
      // about it, fail visibly instead of silently dropping content.
      return (
        <div className="state-panel">
          <h3>Unsupported block type</h3>
          <p>This app doesn't know how to render a "{block.type}" block yet.</p>
        </div>
      );
  }
}

export function ResultTabs({ studySet }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const blocks = studySet.blocks;
  const active = blocks[activeIndex];

  return (
    <div>
      <div className="tab-row" role="tablist" aria-label="Study set sections">
        {blocks.map((block, i) => (
          <button
            key={block.title + i}
            role="tab"
            aria-selected={i === activeIndex}
            className={`tab-btn ${i === activeIndex ? "active" : ""}`}
            onClick={() => setActiveIndex(i)}
          >
            {TAB_LABELS[block.type] || block.type} · {block.title}
          </button>
        ))}
      </div>
      <div className="tab-panel" role="tabpanel">
        <BlockRenderer block={active} />
      </div>
    </div>
  );
}
