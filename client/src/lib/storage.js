const STORAGE_KEY = "notecard:sessions:v1";
const MAX_SESSIONS = 12;

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    // Corrupt or inaccessible storage shouldn't crash the app.
    return [];
  }
}

function writeAll(sessions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // Storage full or unavailable (e.g. private browsing) - fail silently,
    // saving sessions is a nice-to-have, not core functionality.
  }
}

export function listSessions() {
  return readAll().sort((a, b) => b.savedAt - a.savedAt);
}

export function saveSession({ input, studySet, checkedPoints }) {
  const sessions = readAll();
  const id = `${Date.now()}`;
  const entry = {
    id,
    savedAt: Date.now(),
    input,
    studySet,
    checkedPoints: checkedPoints || {},
  };
  const next = [entry, ...sessions].slice(0, MAX_SESSIONS);
  writeAll(next);
  return entry;
}

export function deleteSession(id) {
  writeAll(readAll().filter((s) => s.id !== id));
}

export function getSession(id) {
  return readAll().find((s) => s.id === id) || null;
}
