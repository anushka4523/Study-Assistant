import { useMemo, useState } from "react";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function QuizView({ block }) {
  const allQuestions = block.questions;
  const [roundIds, setRoundIds] = useState(() => allQuestions.map((q) => q.id));
  const [answers, setAnswers] = useState({}); // { [questionId]: selectedIndex } for this round
  const [masteredIds, setMasteredIds] = useState(() => new Set());
  const [round, setRound] = useState(1);

  const byId = useMemo(() => {
    const map = new Map();
    allQuestions.forEach((q) => map.set(q.id, q));
    return map;
  }, [allQuestions]);

  const roundQuestions = roundIds.map((id) => byId.get(id));
  const roundComplete = roundIds.every((id) => answers[id] !== undefined);
  const roundWrongIds = roundIds.filter(
    (id) => answers[id] !== undefined && answers[id] !== byId.get(id).correctIndex
  );
  const roundCorrectCount = roundIds.length - roundWrongIds.length;

  function selectAnswer(questionId, optionIndex) {
    if (answers[questionId] !== undefined) return; // already answered, locked
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  }

  function retestWrong() {
    setMasteredIds((prev) => {
      const next = new Set(prev);
      roundIds.forEach((id) => {
        if (!roundWrongIds.includes(id)) next.add(id);
      });
      return next;
    });
    setRoundIds(roundWrongIds);
    setAnswers({});
    setRound((r) => r + 1);
  }

  function restartQuiz() {
    setRoundIds(allQuestions.map((q) => q.id));
    setAnswers({});
    setMasteredIds(new Set());
    setRound(1);
  }

  const allMastered = roundComplete && roundWrongIds.length === 0;

  return (
    <div>
      {round > 1 && (
        <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>
          Round {round} · retesting {roundIds.length} question
          {roundIds.length === 1 ? "" : "s"}
        </p>
      )}

      {roundQuestions.map((q, qi) => {
        const selected = answers[q.id];
        const answered = selected !== undefined;
        return (
          <div className="quiz-question" key={q.id}>
            <p className="quiz-question-title">
              {qi + 1}. {q.question}
            </p>
            <div className="quiz-options" role="radiogroup" aria-label={q.question}>
              {q.options.map((opt, oi) => {
                let cls = "quiz-option";
                if (answered) {
                  if (oi === q.correctIndex) cls += " correct";
                  else if (oi === selected) cls += " incorrect";
                } else if (oi === selected) {
                  cls += " selected";
                }
                return (
                  <button
                    key={oi}
                    type="button"
                    className={cls}
                    disabled={answered}
                    onClick={() => selectAnswer(q.id, oi)}
                    role="radio"
                    aria-checked={selected === oi}
                  >
                    <span className="opt-letter">{LETTERS[oi]}</span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
            {answered && <p className="quiz-explanation">{q.explanation}</p>}
          </div>
        );
      })}

      {roundComplete && (
        <div className="quiz-score-banner">
          <div>
            <div className="score-figure">
              {roundCorrectCount} / {roundIds.length}
            </div>
            <div className="eyebrow">
              {allMastered ? "All mastered this round" : "correct this round"}
            </div>
          </div>
          {allMastered ? (
            <button className="btn btn-primary" onClick={restartQuiz}>
              Restart full quiz ▸
            </button>
          ) : (
            <button className="btn btn-primary" onClick={retestWrong}>
              Retest {roundWrongIds.length} wrong answer
              {roundWrongIds.length === 1 ? "" : "s"} ▸
            </button>
          )}
        </div>
      )}

      {masteredIds.size > 0 && !allMastered && (
        <p className="eyebrow">
          {masteredIds.size} question{masteredIds.size === 1 ? "" : "s"} mastered
          so far
        </p>
      )}
    </div>
  );
}
