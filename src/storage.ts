export function readBest(): number {
  try {
    const value = Number(localStorage.getItem('seed-slash.best'));
    return Number.isSafeInteger(value) && value >= 0 ? value : 0;
  } catch { return 0; }
}
export function saveBest(score: number): boolean {
  try { localStorage.setItem('seed-slash.best', String(Math.max(readBest(), score))); return true; }
  catch { return false; }
}
export function readSetting(key: string, fallback = false): boolean {
  try { const v = localStorage.getItem(`seed-slash.${key}`); return v === null ? fallback : v === 'true'; }
  catch { return fallback; }
}
export function saveSetting(key: string, value: boolean) {
  try { localStorage.setItem(`seed-slash.${key}`, String(value)); } catch { /* Settings are optional. */ }
}
