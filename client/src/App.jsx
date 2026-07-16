import { useState } from "react";
import { TopicInput } from "./components/TopicInput.jsx";
import { LoadingState } from "./components/LoadingState.jsx";
import { ErrorState } from "./components/ErrorState.jsx";
import { EmptyState } from "./components/EmptyState.jsx";
import { ResultTabs } from "./components/ResultTabs.jsx";
import { SessionBar } from "./components/SessionBar.jsx";
import { useStudySession } from "./hooks/useStudySession.js";

export default function App() {
  const { status, studySet, error, generate, retry, loadFromSession } =
    useStudySession();
  const [sessionRefreshKey, setSessionRefreshKey] = useState(0);

  function handleSubmit(input) {
    generate(input).then(() => {
      // bump so SessionBar re-reads localStorage after a successful save
      setSessionRefreshKey((k) => k + 1);
    });
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            NC
          </div>
          <div>
            <h1>Notecard</h1>
            <p>Turn any topic or notes into flashcards, a quiz, and a summary.</p>
          </div>
        </div>
      </header>

      <TopicInput onSubmit={handleSubmit} disabled={status === "loading"} />
      <SessionBar onLoad={loadFromSession} refreshKey={sessionRefreshKey} />

      {status === "idle" && <EmptyState />}
      {status === "loading" && <LoadingState />}
      {status === "error" && <ErrorState message={error} onRetry={retry} />}
      {status === "success" && studySet && <ResultTabs studySet={studySet} />}

      <footer className="app-footer">
        Notecard · built for the frontend internship assignment
      </footer>
    </div>
  );
}
