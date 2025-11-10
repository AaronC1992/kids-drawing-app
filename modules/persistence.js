// Simple persistence helpers for Kids Drawing App
export function save(key, value) {
  try { localStorage.setItem(key, value); } catch (e) {}
}

export function load(key, fallback = null) {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? v : fallback;
  } catch (e) { return fallback; }
}

export function saveJSON(key, obj) {
  try { localStorage.setItem(key, JSON.stringify(obj)); } catch (e) {}
}

export function loadJSON(key, fallback = null) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) { return fallback; }
}
