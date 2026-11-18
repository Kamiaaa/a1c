/* Shared by API routes (parsePaging / pageMeta) and the dashboard UI (getPageItems). No server-only imports. */

export function parsePaging(url: string, opts: { defaultLimit?: number; maxLimit?: number } = {}) {
  const sp = new URL(url).searchParams;
  const maxLimit = opts.maxLimit ?? 100;
  const parsed = parseInt(sp.get('limit') ?? '', 10);
  const requested = parsed >= 1 ? parsed : (opts.defaultLimit ?? 10); // 0, negative or junk -> default
  const limit = Math.min(requested, maxLimit);
  const page = Math.max(parseInt(sp.get('page') ?? '', 10) || 1, 1);
  return { page, limit };
}

/** Clamps the requested page into range (e.g. after deleting the last row of the last page). */
export function pageMeta(total: number, page: number, limit: number) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const current = Math.min(page, totalPages);
  return { page: current, limit, total, totalPages, skip: (current - 1) * limit };
}

/** [1, '…', 4, 5, 6, '…', 20] style list for the page buttons. */
export function getPageItems(page: number, totalPages: number): Array<number | '…'> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const items: Array<number | '…'> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  if (start > 2) items.push('…');
  for (let p = start; p <= end; p++) items.push(p);
  if (end < totalPages - 1) items.push('…');
  items.push(totalPages);
  return items;
}
