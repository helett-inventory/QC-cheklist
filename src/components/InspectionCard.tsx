import { useNavigate } from 'react-router-dom'
import type { Inspection } from '../types/inspection'
import { StatusBadge } from './StatusBadge'

interface InspectionCardProps {
  inspection: Inspection
}

function StageBadge({ label, done }: { label: string; done: boolean }) {
  return (
    <span
      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
        done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
      }`}
    >
      {label}
    </span>
  )
}

export function InspectionCard({ inspection }: InspectionCardProps) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate(`/inspection/${inspection.id}`)}
      className="w-full flex flex-col gap-1.5 px-4 py-3 bg-white text-left border-b border-gray-100 active:bg-gray-50 min-h-[44px]"
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <div className="font-bold text-gray-900 truncate">{inspection.productName}</div>
          <div className="text-sm text-gray-500 truncate">{inspection.shipmentId}</div>
        </div>
        <div className="shrink-0 pl-3">
          <StatusBadge status={inspection.status} />
        </div>
      </div>
      <div className="flex gap-1.5">
        <StageBadge label="QC" done={!!inspection.qcSignatureUrl} />
        <StageBadge label="IC" done={!!inspection.dispatchSignUrl} />
        <StageBadge label="FC" done={!!inspection.signatureUrl} />
      </div>
    </button>
  )
}
