interface StatusBadgeProps {
  status: 'Open' | 'Closed'
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const isClosed = status === 'Closed'
  return (
    <span
      className={`inline-flex items-center gap-1 text-sm font-medium ${
        isClosed ? 'text-green-600' : 'text-red-600'
      }`}
    >
      {isClosed ? (
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M16.704 5.29a1 1 0 010 1.415l-7.5 7.5a1 1 0 01-1.415 0l-3.5-3.5a1 1 0 111.415-1.414L8.5 12.086l6.79-6.795a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M10 17a1 1 0 01-1-1V5.414L5.707 8.707a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0l5 5a1 1 0 01-1.414 1.414L11 5.414V16a1 1 0 01-1 1z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {status}
    </span>
  )
}
