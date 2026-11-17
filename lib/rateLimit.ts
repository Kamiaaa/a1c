// Small in-memory limiter for login attempts (per server instance).
// For multi-instance deployments swap this for Redis/Upstash.
const failures = new Map<string, { count: number; resetAt: number }>();

const LIMIT = 8;
const WINDOW_MS = 15 * 60 * 1000;

export function isBlocked(key: string): number {
  const rec = failures.get(key);
  if (!rec) return 0;
  if (rec.resetAt < Date.now()) {
    failures.delete(key);
    return 0;
  }
  return rec.count >= LIMIT ? Math.ceil((rec.resetAt - Date.now()) / 1000) : 0;
}

export function recordFailure(key: string) {
  const now = Date.now();
  const rec = failures.get(key);
  if (!rec || rec.resetAt < now) failures.set(key, { count: 1, resetAt: now + WINDOW_MS });
  else rec.count += 1;
}

export function clearFailures(key: string) {
  failures.delete(key);
}
