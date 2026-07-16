import { useCallback, useEffect, useState } from "react";

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function FlashcardDeck({ block }) {
  const [order, setOrder] = useState(() => block.cards.map((_, i) => i));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = block.cards[order[index]];

  const goTo = useCallback((next) => {
    setIndex(next);
    setFlipped(false);
  }, []);

  const next = useCallback(() => {
    goTo((index + 1) % order.length);
  }, [goTo, index, order.length]);

  const prev = useCallback(() => {
    goTo((index - 1 + order.length) % order.length);
  }, [goTo, index, order.length]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [next, prev]);

  function handleShuffle() {
    setOrder(shuffle(block.cards.map((_, i) => i)));
    setIndex(0);
    setFlipped(false);
  }

  return (
    <div>
      <div className="deck-header">
        <span className="deck-progress">
          Card {index + 1} of {order.length}
        </span>
        <button className="btn btn-sm" onClick={handleShuffle}>
          Shuffle ▸
        </button>
      </div>

      <div className="card-stage">
        <div
          className={`flashcard ${flipped ? "flipped" : ""}`}
          onClick={() => setFlipped((f) => !f)}
          role="button"
          tabIndex={0}
          aria-label={flipped ? "Showing answer, click to flip back" : "Showing question, click to flip"}
        >
          <div className="flashcard-face flashcard-front">
            <span className="face-label">Question</span>
            <span className="face-text">{card.front}</span>
          </div>
          <div className="flashcard-face flashcard-back">
            <span className="face-label">Answer</span>
            <span className="face-text">{card.back}</span>
          </div>
        </div>
      </div>

      <div className="deck-nav">
        <button className="btn btn-sm" onClick={prev} aria-label="Previous card">
          ◂ Prev
        </button>
        <button className="btn btn-sm" onClick={() => setFlipped((f) => !f)}>
          Flip
        </button>
        <button className="btn btn-sm" onClick={next} aria-label="Next card">
          Next ▸
        </button>
      </div>

      <div className="deck-dots">
        {order.map((_, i) => (
          <button
            key={i}
            className={`deck-dot ${i === index ? "current" : ""}`}
            onClick={() => goTo(i)}
            aria-label={`Go to card ${i + 1}`}
          />
        ))}
      </div>

      <p className="hint-text">Tap the card to flip · arrow keys to navigate</p>
    </div>
  );
}
