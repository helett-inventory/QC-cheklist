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

// Called right after a successful save so the device that just made the
// change sees it instantly (e.g. the QC/IC/FC badges on the Dashboard),
// without waiting on a network refetch — the record is already known, in
// full, right here. Adds it if new (create) or replaces it if it already
// exists (update); leaves ordering to whatever the next real fetch settles
// on (this is just a same-session correctness patch, not a re-sort).
export function upsertCachedInspection(inspection: Inspection) {
  const current = readCachedList() ?? []
  const idx = current.findIndex((i) => i.id === inspection.id)
  if (idx === -1) {
    writeCachedList([...current, inspection])
  } else {
    const next = [...current]
    next[idx] = inspection
    writeCachedList(next)
  }
}
