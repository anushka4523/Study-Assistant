import { useState } from "react";

export function SummaryChecklist({ block }) {
  const [checked, setChecked] = useState({});

  function toggle(i) {
    setChecked((prev) => ({ ...prev, [i]: !prev[i] }));
  }

  const doneCount = Object.values(checked).filter(Boolean).length;

  return (
    <div>
      <p className="eyebrow" style={{ marginBottom: "0.9rem" }}>
        {doneCount} / {block.points.length} reviewed
      </p>
      <ul className="summary-list">
        {block.points.map((point, i) => (
          <li
            key={i}
            className={`summary-item ${checked[i] ? "checked" : ""}`}
            onClick={() => toggle(i)}
            role="checkbox"
            aria-checked={!!checked[i]}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                toggle(i);
              }
            }}
          >
            <span className="check-box">{checked[i] ? "✓" : ""}</span>
            <span className="item-text">{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
