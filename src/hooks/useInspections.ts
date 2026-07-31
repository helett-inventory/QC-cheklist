import { useCallback, useEffect, useRef, useState } from 'react'
import type { Inspection } from '../types/inspection'
import { getInspections, seedIfEmpty } from '../services/api'
import { readCachedList, writeCachedList } from '../services/cache'

export function useInspections() {
  const [inspections, setInspections] = useState<Inspection[]>(() => readCachedList() ?? [])
  // Only the very first load (no cache yet) should show a full loading
  // state. Once we have cached data to show immediately, later refetches
  // (including from the Refresh button) update the list silently in the
  // background — stale-while-revalidate, no loading flash.
  const hasData = useRef(inspections.length > 0)
  const [loading, setLoading] = useState(!hasData.current)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!hasData.current) setLoading(true)
    setError(null)
    try {
      const data = await getInspections()
      setInspections(data)
      writeCachedList(data)
      hasData.current = true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inspections')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    seedIfEmpty()
    refetch()
  }, [refetch])

  return { inspections, loading, error, refetch }
}
