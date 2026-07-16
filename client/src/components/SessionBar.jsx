import { useEffect, useState } from "react";
import { listSessions } from "../lib/storage.js";

function formatWhen(ts) {
  const diffMin = Math.round((Date.now() - ts) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(ts).toLocaleDateString();
}

export function SessionBar({ onLoad, refreshKey }) {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    setSessions(listSessions());
  }, [refreshKey]);

  if (sessions.length === 0) return null;

  return (
    <div className="session-bar">
      <span>Saved on this device:</span>
      <select
        className="session-select"
        defaultValue=""
        onChange={(e) => {
          const session = sessions.find((s) => s.id === e.target.value);
          if (session) onLoad(session);
          e.target.value = "";
        }}
      >
        <option value="" disabled>
          Reload a past set…
        </option>
        {sessions.map((s) => (
          <option key={s.id} value={s.id}>
            {s.studySet.topic} · {formatWhen(s.savedAt)}
          </option>
        ))}
      </select>
    </div>
  );
}
