import { useCallback, useEffect, useState } from 'react'
import type { Inspection } from '../types/inspection'
import { getInspections, seedIfEmpty } from '../services/api'

export function useInspections() {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getInspections()
      setInspections(data)
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
