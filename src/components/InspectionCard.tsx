import { useNavigate } from 'react-router-dom'
import type { Inspection } from '../types/inspection'
import { StatusBadge } from './StatusBadge'

interface InspectionCardProps {
  inspection: Inspection
}

export function InspectionCard({ inspection }: InspectionCardProps) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate(`/inspection/${inspection.id}`)}
      className="w-full flex items-center justify-between px-4 py-3 bg-white text-left border-b border-gray-100 active:bg-gray-50 min-h-[44px]"
    >
      <div className="min-w-0">
        <div className="font-bold text-gray-900 truncate">{inspection.productName}</div>
        <div className="text-sm text-gray-500 truncate">{inspection.shipmentId}</div>
      </div>
      <div className="shrink-0 pl-3">
        <StatusBadge status={inspection.status} />
      </div>
    </button>
  )
}
