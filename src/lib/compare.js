// Compare list lives in localStorage so it survives navigation and reloads
// without needing a server-side model.
const KEY = 'bf_compare';
export const MAX_COMPARE = 3;

export function getCompareIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function save(ids) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // storage unavailable (private mode); compare simply won't persist
  }
  return ids;
}

export function isCompared(id) {
  return getCompareIds().includes(id);
}

// Returns the new list. Adding past MAX_COMPARE drops the oldest entry.
export function toggleCompare(id) {
  const ids = getCompareIds();
  if (ids.includes(id)) return save(ids.filter((item) => item !== id));
  return save([...ids, id].slice(-MAX_COMPARE));
}

export function removeCompare(id) {
  return save(getCompareIds().filter((item) => item !== id));
}

export function clearCompare() {
  return save([]);
}
