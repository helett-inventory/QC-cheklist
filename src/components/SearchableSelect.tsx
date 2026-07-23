import { useEffect, useRef, useState } from 'react'

interface SearchableSelectProps {
  options: string[]
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
  onAddOption?: (name: string) => void
  addLabel?: string
}

// Custom dropdown with a search box, since a native <select> doesn't support
// typing to filter on most mobile browsers (Android/iOS treat it as a plain
// picker wheel). Works the same everywhere because it's plain HTML/CSS/JS.
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  disabled,
  onAddOption,
  addLabel = '+ Add new...'
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleOutside(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', handleOutside)
    return () => document.removeEventListener('pointerdown', handleOutside)
  }, [open])

  const filtered = options.filter((o) => o.toLowerCase().includes(search.trim().toLowerCase()))

  function pick(opt: string) {
    onChange(opt)
    setSearch('')
    setOpen(false)
  }

  function handleAddNew() {
    const name = window.prompt('Enter new value')
    if (name && name.trim() && onAddOption) {
      onAddOption(name.trim())
      pick(name.trim())
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="w-full h-11 px-3 rounded-md border border-gray-300 text-sm text-left flex items-center justify-between bg-white disabled:bg-gray-100"
      >
        <span className={`truncate ${value ? 'text-gray-900' : 'text-gray-400'}`}>{value || placeholder}</span>
        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && !disabled && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to search..."
              className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto">
            {filtered.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  onClick={() => pick(opt)}
                  className={`w-full text-left px-3 py-2 min-h-[44px] text-sm ${
                    opt === value ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-700 active:bg-gray-50'
                  }`}
                >
                  {opt}
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="px-3 py-2 text-sm text-gray-400">No matches</li>}
          </ul>
          {onAddOption && (
            <button
              type="button"
              onClick={handleAddNew}
              className="w-full text-left px-3 py-2 min-h-[44px] text-sm text-teal-700 font-medium border-t border-gray-100"
            >
              {addLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
