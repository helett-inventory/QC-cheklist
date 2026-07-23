import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInspections } from '../hooks/useInspections'
import { InspectionCard } from '../components/InspectionCard'

function formatDateHeader(dateStr: string): string {
  if (!dateStr) return 'Unknown Date'
  // Parse "YYYY-MM-DD" (optionally with a time suffix, from legacy rows) as a
  // plain local date rather than via `new Date(dateStr)`, which treats a
  // bare date as UTC midnight and can shift the displayed date by a day
  // depending on the viewer's timezone.
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return dateStr
  const [, year, month, day] = match
  const d = new Date(Number(year), Number(month) - 1, Number(day))
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function Dashboard() {
  const { inspections, loading, error, refetch } = useInspections()
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    if (!query.trim()) return inspections
    const q = query.trim().toLowerCase()
    const matches = (value: unknown) => String(value ?? '').toLowerCase().includes(q)
    return inspections.filter(
      (i) => matches(i.shipmentId) || matches(i.productName) || matches(i.sku) || matches(i.inspectorName)
    )
  }, [inspections, query])

  const grouped = useMemo(() => {
    const groups = new Map<string, typeof filtered>()
    for (const insp of filtered) {
      const key = insp.inspectionDate || 'Unknown Date'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(insp)
    }
    return [...groups.entries()].sort((a, b) =>
      sortDir === 'desc' ? b[0].localeCompare(a[0]) : a[0].localeCompare(b[0])
    )
  }, [filtered, sortDir])

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="text-lg font-bold text-gray-900">helett</h1>
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Search"
              onClick={() =>
                setSearchOpen((s) => {
                  if (s) setQuery('')
                  return !s
                })
              }
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Refresh"
              onClick={() => refetch()}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
        {searchOpen && (
          <div className="px-4 pb-3">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by shipment, product, SKU, inspector..."
              className="w-full h-11 px-3 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>
        )}
      </header>

      <main className="flex-1 pb-24">
        {loading && <div className="p-4 text-center text-gray-500">Loading...</div>}
        {error && <div className="p-4 text-center text-red-600">{error}</div>}
        {!loading && !error && grouped.length === 0 && (
          <div className="p-4 text-center text-gray-500">No inspections found.</div>
        )}
        {grouped.map(([date, items]) => (
          <div key={date}>
            <div className="sticky top-[56px] z-10 bg-gray-200 px-4 py-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {formatDateHeader(date)}
            </div>
            <div>
              {items.map((insp) => (
                <InspectionCard key={insp.id} inspection={insp} />
              ))}
            </div>
          </div>
        ))}
      </main>

      <button
        type="button"
        aria-label="New Inspection"
        onClick={() => navigate('/inspection/new')}
        className="fixed bottom-20 right-5 w-14 h-14 rounded-full bg-teal-600 text-white text-3xl leading-none shadow-lg flex items-center justify-center active:bg-teal-700"
      >
        +
      </button>

      <nav className="fixed bottom-0 inset-x-0 h-14 bg-teal-800 flex items-center justify-center text-white">
        <button
          type="button"
          onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
          className="flex items-center gap-2 min-h-[44px] px-4"
        >
          {sortDir === 'desc' ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9M3 12h5m4 8V4m0 16l-4-4m4 4l4-4" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 20h13M3 16h9M3 12h5m4-8v16m0-16l-4 4m4-4l4 4" />
            </svg>
          )}
          <span className="text-sm font-medium">
            Sort: {sortDir === 'desc' ? 'Newest first' : 'Oldest first'}
          </span>
        </button>
      </nav>
    </div>
  )
}
