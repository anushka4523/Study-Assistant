export function ErrorState({ message, onRetry }) {
  return (
    <div className="state-panel state-error" role="alert">
      <h3>That didn't work</h3>
      <p>{message}</p>
      <button className="btn" onClick={onRetry}>
        Try again ▸
      </button>
    </div>
  );
}
