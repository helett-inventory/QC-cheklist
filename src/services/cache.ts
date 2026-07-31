import type { Inspection } from '../types/inspection'

// Stale-while-revalidate cache for the inspections list. This is separate
// from the localStorage *mock backend* in api.ts — this cache exists even
// when talking to the real Sheets backend, so the app has something to show
// instantly on load instead of a blank/loading screen while the network
// request is in flight.
const LIST_CACHE_KEY = 'helett-qc-cache-list'

export function readCachedList(): Inspection[] | null {
  try {
    const raw = localStorage.getItem(LIST_CACHE_KEY)
    return raw ? (JSON.parse(raw) as Inspection[]) : null
  } catch {
    return null
  }
}

export function writeCachedList(data: Inspection[]) {
  try {
    localStorage.setItem(LIST_CACHE_KEY, JSON.stringify(data))
  } catch {
    // Best-effort optimization only — safe to ignore if storage is full/unavailable.
  }
}

export function readCachedInspection(id: string): Inspection | null {
  return readCachedList()?.find((i) => i.id === id) ?? null
}
