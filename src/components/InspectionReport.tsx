import type { Inspection } from '../types/inspection'

const CHECKLIST_ITEMS: { label: string; key: keyof Inspection }[] = [
  { label: 'Product Condition', key: 'productCondition' },
  { label: 'Packaging Quality', key: 'packagingQuality' },
  { label: 'Label/Barcode', key: 'labelBarcode' },
  { label: 'Accessories Included', key: 'accessoriesIncluded' },
  { label: 'Proper Sealing', key: 'properSealing' },
  { label: 'FNSKU Present', key: 'fnskuPresent' },
  { label: 'MRP Present', key: 'mrpPresent' },
  { label: 'Serial Number Present', key: 'serialNumberPresent' },
  { label: 'Shipping Label Present', key: 'shippingLabelPresent' }
]
const CHECKLIST_SPLIT = Math.ceil(CHECKLIST_ITEMS.length / 2)
const CHECKLIST_COLUMNS = [CHECKLIST_ITEMS.slice(0, CHECKLIST_SPLIT), CHECKLIST_ITEMS.slice(CHECKLIST_SPLIT)]

function isPass(value: string) {
  return value === 'Y' || value === 'Good'
}

function displayValue(value: string) {
  if (value === 'Y') return 'Yes'
  if (value === 'N') return 'No'
  return value || '—'
}

function ChecklistColumn({ items, startIndex, inspection }: { items: typeof CHECKLIST_ITEMS; startIndex: number; inspection: Inspection }) {
  return (
    <div className="flex-1">
      {items.map((item, i) => {
        const rawValue = inspection[item.key] as string
        const pass = isPass(rawValue)
        return (
          <div
            key={item.key}
            className="flex items-center justify-between gap-2 py-[3px] border-b border-gray-200 text-[10.5px]"
          >
            <span>
              <span className="text-gray-400 mr-1">{startIndex + i + 1}.</span>
              {item.label}
            </span>
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="text-gray-500">{displayValue(rawValue)}</span>
              <span
                className={`inline-block text-[9px] font-bold px-1.5 rounded-full ${
                  pass ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
                }`}
              >
                {pass ? 'Pass' : 'Fail'}
              </span>
            </span>
          </div>
        )
      })}
    </div>
  )
}

function SignatureBlock({ label, name, src }: { label: string; name: string; src: string }) {
  return (
    <div className="text-center">
      <div className="text-[10.5px] font-semibold mb-0.5 truncate">{name || '—'}</div>
      <div className="h-9 border-b border-gray-900 flex items-end justify-center">
        {src ? (
          <img src={src} alt={`${label} signature`} className="max-h-9 object-contain" />
        ) : (
          <span className="text-[10px] italic text-gray-400 pb-0.5">No signature</span>
        )}
      </div>
      <div className="text-[8px] uppercase tracking-wide text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}

// Print-only view of a single inspection. Rendered hidden on screen
// (`hidden print:block` at the call site) and shown only when printing, so
// "Download Report" (window.print) produces a clean one-page certificate
// instead of the editable form UI. Only ever shown for Closed inspections.
//
// Kept to one printed page by construction, not by clipping: every section
// has a fixed, predictable height (a set list of checklist items, three
// signatures, one quantity row) except QC Remarks, which is the one field
// with unbounded length — that's clamped to 2 lines below. Total content
// comes in around 162mm, well under an A4 page's ~269mm usable height.
// (An earlier version instead force-fit this into a fixed-height, clipped
// box — don't reintroduce that: it caused a phantom blank second page,
// since Chrome's print header/footer eats into the usable page height
// beyond what @page's own margin accounts for.)
export function InspectionReport({ inspection }: { inspection: Inspection }) {
  return (
    <div className="p-6 text-gray-900 bg-white">
      <div className="flex justify-between items-start border-b-2 border-teal-600 pb-2 mb-3">
        <div>
          <div className="text-base font-extrabold leading-tight">Helett Enterprises LLP</div>
          <div className="text-[9px] uppercase tracking-widest text-gray-500">Warehouse · Quality Assurance</div>
        </div>
        <div className="text-right">
          <div className="text-[8.5px] uppercase tracking-widest text-gray-500">Inspection ID</div>
          <div className="font-mono font-bold text-[11px] border border-gray-300 rounded px-1.5 py-0.5 mt-0.5 inline-block">
            {inspection.id || '—'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <div className="text-[8.5px] font-bold uppercase tracking-widest text-teal-700 mb-1">
            Inspection Details
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[10.5px]">
            <dt className="text-gray-500">Shipment ID</dt>
            <dd className="font-mono font-semibold truncate">{inspection.shipmentId || '—'}</dd>
            <dt className="text-gray-500">Product Name</dt>
            <dd className="font-semibold truncate">{inspection.productName || '—'}</dd>
            <dt className="text-gray-500">SKU / ASIN</dt>
            <dd className="font-mono font-semibold truncate">{inspection.sku || '—'}</dd>
            <dt className="text-gray-500">Dispatch Date</dt>
            <dd className="font-mono font-semibold">{inspection.dispatchDate || '—'}</dd>
          </dl>
        </div>
        <div>
          <div className="text-[8.5px] font-bold uppercase tracking-widest text-teal-700 mb-1">People</div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[10.5px]">
            <dt className="text-gray-500">Inspector</dt>
            <dd className="font-semibold truncate">{inspection.inspectorName || '—'}</dd>
            <dt className="text-gray-500">Dispatch Confirmed By</dt>
            <dd className="font-semibold truncate">{inspection.dispatchConfirmedBy || '—'}</dd>
            <dt className="text-gray-500">Final Confirmation</dt>
            <dd className="font-semibold truncate">{inspection.finalConfirmationBy || '—'}</dd>
          </dl>
        </div>
      </div>

      <div className="flex items-center justify-between border border-gray-200 rounded px-3 py-1.5 mb-3 text-[10.5px]">
        <span className="text-[8.5px] font-bold uppercase tracking-widest text-teal-700">Quantity</span>
        <span>
          <span className="text-gray-500">Received</span>{' '}
          <span className="font-mono font-semibold">{inspection.receivedQty}</span>
        </span>
        <span>
          <span className="text-gray-500">Box Qty</span>{' '}
          <span className="font-mono font-semibold">{inspection.qcQty}</span>
        </span>
        <span>
          <span className="text-gray-500">Verified</span>{' '}
          <span className="font-mono font-semibold">{inspection.acceptedQty}</span>
        </span>
      </div>

      <div className="text-[8.5px] font-bold uppercase tracking-widest text-teal-700 mb-1">
        Physical Inspection Checklist
      </div>
      <div className="flex gap-6 mb-3">
        <ChecklistColumn items={CHECKLIST_COLUMNS[0]} startIndex={0} inspection={inspection} />
        <ChecklistColumn items={CHECKLIST_COLUMNS[1]} startIndex={CHECKLIST_SPLIT} inspection={inspection} />
      </div>

      <div className="flex gap-3 mb-3">
        <div
          className={`flex-shrink-0 border-2 rounded-lg px-3 py-1.5 flex flex-col items-center justify-center font-extrabold tracking-wide -rotate-2 ${
            inspection.overallResult === 'Bad'
              ? 'border-red-700 text-red-700'
              : inspection.overallResult === 'Satisfactory'
                ? 'border-yellow-600 text-yellow-700'
                : 'border-green-700 text-green-700'
          }`}
        >
          <div className="text-sm">{(inspection.overallResult || 'Pending').toUpperCase()}</div>
          <div className="text-[7px] uppercase tracking-widest text-gray-500 font-normal">Overall Result</div>
        </div>
        <div className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 min-w-0">
          <div className="text-[8.5px] font-bold uppercase tracking-widest text-teal-700 mb-0.5">QC Remarks</div>
          <p className="text-[10.5px] leading-snug line-clamp-2">{inspection.qcRemarks || '—'}</p>
        </div>
      </div>

      <div className="text-[8.5px] font-bold uppercase tracking-widest text-teal-700 mb-1.5">Approval</div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <SignatureBlock label="Inspector Signature" name={inspection.inspectorName} src={inspection.qcSignatureUrl} />
        <SignatureBlock
          label="Dispatch Confirmation Signature"
          name={inspection.dispatchConfirmedBy}
          src={inspection.dispatchSignUrl}
        />
        <SignatureBlock
          label="Final Confirmation Signature"
          name={inspection.finalConfirmationBy}
          src={inspection.signatureUrl}
        />
      </div>

      <div
        className={`flex items-center justify-between rounded-md px-3 py-1.5 mb-3 border ${
          inspection.status === 'Closed' ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
        }`}
      >
        <span className="text-[8.5px] uppercase tracking-widest text-gray-500">Status</span>
        <span
          className={`text-[12px] font-extrabold tracking-wide ${
            inspection.status === 'Closed' ? 'text-green-700' : 'text-red-700'
          }`}
        >
          {inspection.status === 'Closed' ? 'Closed — Inspection Completed' : 'Open'}
        </span>
      </div>

      <div className="flex justify-between border-t border-gray-200 pt-1.5 font-mono text-[8.5px] text-gray-500">
        <span>Generated by Helett Enterprises LLP · Inspection {inspection.id || '—'}</span>
        <span>Printed {new Date().toLocaleString()}</span>
      </div>
    </div>
  )
}
