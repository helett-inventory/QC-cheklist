import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Inspection, YesNo } from '../types/inspection'
import { createInspection, getInspection, updateInspection } from '../services/api'
import { readCachedInspection } from '../services/cache'
import { SignaturePad } from '../components/SignaturePad'
import { SearchableSelect } from '../components/SearchableSelect'
import { InspectionReport } from '../components/InspectionReport'
import { PRODUCTS } from '../data/products'

// To edit the names offered in the "Dispatch Confirmed By" dropdown, edit this list.
const DISPATCH_NAMES = ['Amal Anilkumar', 'MHD Anas']

// To edit the names offered in the "Inspector Name" dropdown, edit this list.
const INSPECTOR_NAMES = ['Suhail K', 'MHD Vasil', 'MHD Ziyad', 'MHD Shafi', 'Adarsh P', 'MHD Afras' ]

// Final Confirmation By is always this fixed name — not user-editable.
const FINAL_CONFIRMATION_NAME = 'Mohammed Misbahudeen KC'

// Inspector names added via "+ Add new inspector..." in the app are persisted
// here so they show up in the dropdown from then on, without editing code.
const CUSTOM_INSPECTORS_KEY = 'helett-qc-custom-inspectors'

function loadCustomInspectors(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_INSPECTORS_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function saveCustomInspectors(names: string[]) {
  localStorage.setItem(CUSTOM_INSPECTORS_KEY, JSON.stringify(names))
}

function emptyInspection(): Inspection {
  const today = new Date().toISOString().slice(0, 10)
  return {
    id: '',
    timestamp: '',
    inspectionDate: today,
    shipmentId: '',
    productName: '',
    sku: '',
    receivedQty: 0,
    qcQty: 0,
    acceptedQty: 0,
    rejectedQty: 0,
    modelDispatched: '',
    productCondition: '',
    packagingQuality: '',
    labelBarcode: '',
    accessoriesIncluded: '',
    properSealing: '',
    fullPhoto: 'N',
    fnskuPresent: '',
    mrpPresent: '',
    serialNumberPresent: '',
    shippingLabelPresent: '',
    fullRemarks: '',
    overallResult: '',
    qcRemarks: '',
    inspectorName: '',
    qcSignatureUrl: '',
    dispatchConfirmedBy: '',
    dispatchDate: '',
    dispatchSignUrl: '',
    finalConfirmationBy: FINAL_CONFIRMATION_NAME,
    signatureUrl: '',
    status: 'Open',
    updatedAt: ''
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}

function Stepper({
  value,
  onChange,
  disabled
}: {
  value: number
  onChange: (v: number) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-11 h-11 rounded-md border border-gray-300 text-lg font-semibold text-gray-700 disabled:opacity-50"
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        disabled={disabled}
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10)
          onChange(isNaN(n) ? 0 : Math.max(0, n))
        }}
        className="w-16 h-11 text-center font-medium rounded-md border border-gray-300 disabled:bg-gray-100"
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(value + 1)}
        className="w-11 h-11 rounded-md border border-gray-300 text-lg font-semibold text-gray-700 disabled:opacity-50"
      >
        +
      </button>
    </div>
  )
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  disabled,
  colors,
  labels
}: {
  options: T[]
  value: T
  onChange: (v: T) => void
  disabled?: boolean
  colors?: Partial<Record<T, string>>
  labels?: Partial<Record<T, string>>
}) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => {
        const active = opt === value
        const activeColor = colors?.[opt] ?? 'bg-teal-600 text-white border-teal-600'
        return (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt)}
            className={`flex-1 min-h-[44px] px-3 rounded-md border text-sm font-medium disabled:opacity-60 ${
              active ? activeColor : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            {labels?.[opt] ?? opt}
          </button>
        )
      })}
    </div>
  )
}

function YesNoToggle({
  value,
  onChange,
  disabled
}: {
  value: YesNo
  onChange: (v: YesNo) => void
  disabled?: boolean
}) {
  return (
    <Segmented
      options={['Y', 'N'] as YesNo[]}
      value={value}
      onChange={onChange}
      disabled={disabled}
      labels={{ Y: 'Yes', N: 'No' }}
      colors={{ Y: 'bg-green-600 text-white border-green-600', N: 'bg-red-600 text-white border-red-600' }}
    />
  )
}

// Manages one or more inspector selects (for shipments checked by multiple
// people). The joined, comma-separated result is written back into the
// same `inspectorName` field, e.g. "Aditi Rao, Anson, Amal".
function InspectorNamesField({
  initialValue,
  onChange,
  options,
  onAddOption,
  disabled
}: {
  initialValue: string
  onChange: (v: string) => void
  options: string[]
  onAddOption: (name: string) => void
  disabled?: boolean
}) {
  const [rows, setRows] = useState<string[]>(() => {
    const parsed = initialValue.split(',').map((s) => s.trim()).filter(Boolean)
    return parsed.length > 0 ? parsed : ['']
  })

  function commit(next: string[]) {
    setRows(next)
    onChange(next.filter(Boolean).join(', '))
  }

  function handleSelect(index: number, val: string) {
    const next = [...rows]
    next[index] = val
    commit(next)
  }

  function addRow() {
    setRows((prev) => [...prev, ''])
  }

  function removeRow(index: number) {
    const next = rows.filter((_, i) => i !== index)
    commit(next.length > 0 ? next : [''])
  }

  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div key={index} className="flex gap-2">
          <div className="flex-1">
            <SearchableSelect
              options={options}
              value={row}
              onChange={(v) => handleSelect(index, v)}
              disabled={disabled}
              onAddOption={onAddOption}
              addLabel="+ Add new inspector..."
            />
          </div>
          {!disabled && rows.length > 1 && (
            <button
              type="button"
              aria-label="Remove inspector"
              onClick={() => removeRow(index)}
              className="w-11 h-11 shrink-0 rounded-md border border-gray-300 text-gray-500 text-lg"
            >
              ×
            </button>
          )}
        </div>
      ))}
      {!disabled && (
        <button type="button" onClick={addRow} className="text-sm font-medium text-teal-700 min-h-[44px] px-2">
          + Add Inspector
        </button>
      )}
    </div>
  )
}

export function QCForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const [form, setForm] = useState<Inspection>(emptyInspection())
  const [initialForm, setInitialForm] = useState<Inspection>(emptyInspection())
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [customInspectors, setCustomInspectors] = useState<string[]>(() => loadCustomInspectors())

  const inspectorOptions = useMemo(
    () => [...new Set([...INSPECTOR_NAMES, ...customInspectors])],
    [customInspectors]
  )

  function addCustomInspector(name: string) {
    setCustomInspectors((prev) => {
      if (prev.includes(name) || INSPECTOR_NAMES.includes(name)) return prev
      const next = [...prev, name]
      saveCustomInspectors(next)
      return next
    })
  }

  useEffect(() => {
    if (isNew || !id) {
      const fresh = emptyInspection()
      setForm(fresh)
      setInitialForm(fresh)
      setErrors({})
      return
    }
    // Stale-while-revalidate: if the Dashboard already cached this record
    // (from its last list fetch), show it immediately instead of a blank
    // loading screen, then quietly fetch the authoritative version in the
    // background. Only apply that refreshed data if the user hasn't started
    // editing yet, so an in-flight fetch can't clobber their changes.
    const cached = readCachedInspection(id)
    if (cached) {
      setForm(cached)
      setInitialForm(cached)
      setErrors({})
      setLoading(false)
    } else {
      setLoading(true)
    }
    getInspection(id)
      .then((insp) => {
        if (!cached) {
          setForm(insp)
          setInitialForm(insp)
          setErrors({})
          return
        }
        // Only overwrite with the freshly fetched copy if the form still
        // matches what we seeded from cache — i.e. the user hasn't edited
        // anything yet in the time it took this request to resolve.
        const cachedJson = JSON.stringify(cached)
        setForm((current) => (JSON.stringify(current) === cachedJson ? insp : current))
        setInitialForm((current) => (JSON.stringify(current) === cachedJson ? insp : current))
      })
      .finally(() => setLoading(false))
  }, [id, isNew])

  // Locked based on the status the record had when loaded, NOT the live
  // form.status — otherwise toggling "Closed" would instantly hide the Save
  // button and lock the form before the user could ever persist the change.
  const readOnly = initialForm.status === 'Closed'

  function set<K extends keyof Inspection>(key: K, value: Inspection[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function hasUnsavedChanges() {
    return JSON.stringify(form) !== JSON.stringify(initialForm)
  }

  function handleBack() {
    if (hasUnsavedChanges() && !readOnly) {
      if (!window.confirm('You have unsaved changes. Discard them?')) return
    }
    navigate('/')
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!form.shipmentId.trim()) errs.shipmentId = 'Shipment ID is required'
    if (!form.productName.trim()) errs.productName = 'Product name is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSave() {
    if (saving) return
    if (!validate()) return
    setSaving(true)
    try {
      const dataToSave: Inspection = { ...form, finalConfirmationBy: FINAL_CONFIRMATION_NAME }
      if (isNew) {
        const { id: _id, timestamp: _ts, updatedAt: _u, ...rest } = dataToSave
        await createInspection(rest)
      } else if (id) {
        await updateInspection(id, dataToSave)
      }
      navigate('/')
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to save inspection')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>
  }

  return (
    <>
    <div className="min-h-screen bg-gray-100 pb-24 print:hidden">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 flex items-center px-2 h-14">
        <button
          type="button"
          aria-label="Back"
          onClick={handleBack}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="ml-1 text-lg font-bold text-gray-900">
          {isNew ? 'New Inspection' : form.productName || 'Inspection'}
        </h1>
      </header>

      {readOnly && (
        <div className="bg-gray-200 text-gray-700 text-sm text-center py-2 px-4">Closed — view only</div>
      )}

      <main className="p-4 max-w-xl mx-auto">
        <Field label="Inspection ID">
          <input
            readOnly
            disabled
            value={form.id || '(auto-generated)'}
            className="w-full h-11 px-3 rounded-md border border-gray-200 bg-gray-100 text-gray-500 text-sm"
          />
        </Field>

        <Field label="Shipment ID">
          <input
            type="text"
            disabled={readOnly}
            value={form.shipmentId}
            onChange={(e) => set('shipmentId', e.target.value)}
            className="w-full h-11 px-3 rounded-md border border-gray-300 text-sm disabled:bg-gray-100"
          />
          {errors.shipmentId && <p className="text-red-600 text-xs mt-1">{errors.shipmentId}</p>}
        </Field>

        <Field label="Product Name">
          <SearchableSelect
            options={PRODUCTS.map((p) => p.name)}
            value={form.productName}
            onChange={(name) => {
              const product = PRODUCTS.find((p) => p.name === name)
              set('productName', name)
              set('sku', product?.asin ?? '')
            }}
            placeholder="Select product..."
            disabled={readOnly}
          />
          {errors.productName && <p className="text-red-600 text-xs mt-1">{errors.productName}</p>}
        </Field>

        <Field label="SKU (ASIN)">
          <input
            readOnly
            disabled
            value={form.sku}
            placeholder="Auto-filled from Product Name"
            className="w-full h-11 px-3 rounded-md border border-gray-200 bg-gray-100 text-gray-500 text-sm"
          />
        </Field>

        <Field label="Quantity (Created)">
          <Stepper value={form.receivedQty} onChange={(v) => set('receivedQty', v)} disabled={readOnly} />
        </Field>

        <Field label="Box Quantity">
          <Stepper value={form.qcQty} onChange={(v) => set('qcQty', v)} disabled={readOnly} />
        </Field>

        <Field label="Quantity Verified">
          <Stepper value={form.acceptedQty} onChange={(v) => set('acceptedQty', v)} disabled={readOnly} />
        </Field>

        <Field label="Model of Dispatch">
          <Segmented
            options={['ATS', 'Drop In']}
            value={form.modelDispatched}
            onChange={(v) => set('modelDispatched', v)}
            disabled={readOnly}
          />
        </Field>

        <Field label="Product Condition">
          <Segmented
            options={['Good', 'Bad']}
            value={form.productCondition}
            onChange={(v) => set('productCondition', v)}
            disabled={readOnly}
            colors={{ Good: 'bg-green-600 text-white border-green-600', Bad: 'bg-red-600 text-white border-red-600' }}
          />
        </Field>

        <Field label="Packaging Quality">
          <Segmented
            options={['Good', 'Bad']}
            value={form.packagingQuality}
            onChange={(v) => set('packagingQuality', v)}
            disabled={readOnly}
            colors={{ Good: 'bg-green-600 text-white border-green-600', Bad: 'bg-red-600 text-white border-red-600' }}
          />
        </Field>

        <Field label="Label/Barcode">
          <YesNoToggle value={form.labelBarcode} onChange={(v) => set('labelBarcode', v)} disabled={readOnly} />
        </Field>

        <Field label="Accessories Included">
          <YesNoToggle
            value={form.accessoriesIncluded}
            onChange={(v) => set('accessoriesIncluded', v)}
            disabled={readOnly}
          />
        </Field>

        <Field label="Proper Sealing">
          <YesNoToggle value={form.properSealing} onChange={(v) => set('properSealing', v)} disabled={readOnly} />
        </Field>

        <Field label="Full Photo">
          <button
            type="button"
            disabled
            className="min-h-[44px] px-4 rounded-md border border-gray-300 bg-gray-100 text-gray-400 flex items-center gap-2 text-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Upload Photo (coming soon)
          </button>
        </Field>

        <Field label="FNSKU Present">
          <YesNoToggle value={form.fnskuPresent} onChange={(v) => set('fnskuPresent', v)} disabled={readOnly} />
        </Field>

        <Field label="MRP Present">
          <YesNoToggle value={form.mrpPresent} onChange={(v) => set('mrpPresent', v)} disabled={readOnly} />
        </Field>

        <Field label="Serial Number Present">
          <YesNoToggle
            value={form.serialNumberPresent}
            onChange={(v) => set('serialNumberPresent', v)}
            disabled={readOnly}
          />
        </Field>

        <Field label="Shipping Label Present">
          <YesNoToggle
            value={form.shippingLabelPresent}
            onChange={(v) => set('shippingLabelPresent', v)}
            disabled={readOnly}
          />
        </Field>

        <Field label="Full Remarks">
          <textarea
            disabled={readOnly}
            value={form.fullRemarks}
            onChange={(e) => set('fullRemarks', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm disabled:bg-gray-100"
          />
        </Field>

        <Field label="Overall Result">
          <Segmented
            options={['Good', 'Bad', 'Satisfactory']}
            value={form.overallResult}
            onChange={(v) => set('overallResult', v)}
            disabled={readOnly}
            colors={{
              Good: 'bg-green-600 text-white border-green-600',
              Bad: 'bg-red-600 text-white border-red-600',
              Satisfactory: 'bg-yellow-500 text-white border-yellow-500'
            }}
          />
        </Field>

        <Field label="QC Remarks">
          <textarea
            disabled={readOnly}
            value={form.qcRemarks}
            onChange={(e) => set('qcRemarks', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm disabled:bg-gray-100"
          />
        </Field>

        <Field label="Inspector Name">
          <InspectorNamesField
            key={id}
            initialValue={form.inspectorName}
            onChange={(v) => set('inspectorName', v)}
            options={inspectorOptions}
            onAddOption={addCustomInspector}
            disabled={readOnly}
          />
          {errors.inspectorName && <p className="text-red-600 text-xs mt-1">{errors.inspectorName}</p>}
        </Field>

        <Field label="QC Signature">
          <SignaturePad
            key={id}
            value={form.qcSignatureUrl}
            onChange={(v) => set('qcSignatureUrl', v)}
            readOnly={readOnly}
          />
        </Field>

        <Field label="Dispatch Confirmed By">
          <SearchableSelect
            options={DISPATCH_NAMES}
            value={form.dispatchConfirmedBy}
            onChange={(v) => set('dispatchConfirmedBy', v)}
            disabled={readOnly}
          />
        </Field>

        <Field label="Dispatch Date">
          <input
            type="date"
            disabled={readOnly}
            value={form.dispatchDate}
            onChange={(e) => set('dispatchDate', e.target.value)}
            className="w-full h-11 px-3 rounded-md border border-gray-300 text-sm disabled:bg-gray-100"
          />
        </Field>

        <Field label="Dispatch Sign">
          <SignaturePad
            key={id}
            value={form.dispatchSignUrl}
            onChange={(v) => set('dispatchSignUrl', v)}
            readOnly={readOnly}
          />
        </Field>

        <Field label="Final Confirmation By">
          <input
            readOnly
            disabled
            value={FINAL_CONFIRMATION_NAME}
            className="w-full h-11 px-3 rounded-md border border-gray-200 bg-gray-100 text-gray-500 text-sm"
          />
        </Field>

        <Field label="Signature">
          <SignaturePad
            key={id}
            value={form.signatureUrl}
            onChange={(v) => set('signatureUrl', v)}
            readOnly={readOnly}
          />
        </Field>

        <Field label="Status">
          <Segmented
            options={['Open', 'Closed']}
            value={form.status}
            onChange={(v) => set('status', v)}
            disabled={readOnly}
            colors={{ Open: 'bg-red-600 text-white border-red-600', Closed: 'bg-green-600 text-white border-green-600' }}
          />
          {readOnly && (
            <p className="text-xs text-gray-500 mt-1">
              Closed cases can only be reopened in Google Sheets by an admin.
            </p>
          )}
        </Field>

        {!readOnly && (
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="w-full h-12 mt-2 rounded-md bg-teal-600 text-white font-semibold disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        )}

        {readOnly && (
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full h-12 mt-2 rounded-md border border-teal-600 text-teal-700 font-semibold flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"
              />
              <rect x="6" y="14" width="12" height="8" strokeWidth={2} strokeLinejoin="round" />
            </svg>
            Download Report
          </button>
        )}
      </main>
    </div>
    {/* A fixed height + overflow:hidden here (an earlier attempt at a hard
        page-fit guarantee) caused a phantom blank second page: Chrome's
        print dialog reserves its own header/footer space beyond our @page
        margin, so a box sized to the full printable area no longer fits on
        one physical page — the (already visually clipped) remainder spills
        onto page 2. The actual guarantee is the compact layout itself
        (~162mm of content, well under a page) plus the QC Remarks clamp
        below — no artificial height cap needed. */}
    <div className="hidden print:block">
      <InspectionReport inspection={form} />
    </div>
    </>
  )
}
