import type { Inspection } from '../types/inspection'

// ---------------------------------------------------------------------------
// Backend switch: if VITE_API_URL is set (in .env), every call goes to the
// deployed Google Apps Script Web App. If it's unset, calls fall back to a
// localStorage mock so the app still works standalone. This is the only
// file involved in wiring up the real backend — no other code changes.
//
// GAS Web Apps note: GAS doesn't handle CORS preflight (OPTIONS) requests, so
// every call to the real backend must be a POST with `Content-Type: text/plain`
// (a "simple request" that skips preflight) and a JSON string as the body,
// even for what would normally be a GET. The `action` field in the body tells
// Code.gs which operation to perform (list/get/create/update).
// ---------------------------------------------------------------------------

const API_URL = import.meta.env.VITE_API_URL as string | undefined
const STORAGE_KEY = 'helett-qc-inspections'

async function callApi<T>(payload: Record<string, unknown>): Promise<T> {
  const res = await fetch(API_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload)
  })
  const json = await res.json()
  if (json && typeof json === 'object' && 'error' in json) {
    throw new Error(String((json as { error: unknown }).error))
  }
  return json as T
}

function readAll(): Inspection[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? (JSON.parse(raw) as Inspection[]) : []
}

function writeAll(inspections: Inspection[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inspections))
}

function genId() {
  return `INS-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

export async function getInspections(): Promise<Inspection[]> {
  if (API_URL) return callApi<Inspection[]>({ action: 'list' })

  const all = readAll()
  return [...all].sort((a, b) => b.inspectionDate.localeCompare(a.inspectionDate))
}

export async function getInspection(id: string): Promise<Inspection> {
  if (API_URL) return callApi<Inspection>({ action: 'get', id })

  const all = readAll()
  const found = all.find((i) => i.id === id)
  if (!found) throw new Error(`Inspection ${id} not found`)
  return found
}

export async function createInspection(
  data: Omit<Inspection, 'id' | 'timestamp' | 'updatedAt'>
): Promise<Inspection> {
  if (API_URL) return callApi<Inspection>({ action: 'create', ...data })

  const all = readAll()
  const now = new Date().toISOString()
  const inspection: Inspection = {
    ...data,
    id: genId(),
    timestamp: now,
    updatedAt: now
  }
  all.push(inspection)
  writeAll(all)
  return inspection
}

export async function updateInspection(
  id: string,
  data: Partial<Inspection>
): Promise<Inspection> {
  if (API_URL) return callApi<Inspection>({ action: 'update', id, ...data })

  const all = readAll()
  const idx = all.findIndex((i) => i.id === id)
  if (idx === -1) throw new Error(`Inspection ${id} not found`)
  const updated: Inspection = { ...all[idx], ...data, id, updatedAt: new Date().toISOString() }
  all[idx] = updated
  writeAll(all)
  return updated
}

// Seeds a couple of demo inspections on first run so the Dashboard isn't
// empty. Only applies to the localStorage mock — never touches the real backend.
export function seedIfEmpty() {
  if (API_URL) return
  if (readAll().length > 0) return
  const now = new Date().toISOString()
  const demo: Inspection[] = [
    {
      id: genId(),
      timestamp: now,
      inspectionDate: '2026-07-13',
      shipmentId: 'SHP-10234',
      productName: 'Wireless Mouse M185',
      sku: 'SKU-8841',
      receivedQty: 120,
      qcQty: 120,
      acceptedQty: 118,
      rejectedQty: 2,
      modelDispatched: 'ATS',
      productCondition: 'Good',
      packagingQuality: 'Good',
      labelBarcode: 'Y',
      accessoriesIncluded: 'Y',
      properSealing: 'Y',
      fullPhoto: 'Y',
      fnskuPresent: 'Y',
      mrpPresent: 'Y',
      serialNumberPresent: 'Y',
      shippingLabelPresent: 'Y',
      fullRemarks: '',
      overallResult: 'Good',
      qcRemarks: '',
      inspectorName: 'Aditi Rao',
      qcSignatureUrl: '',
      dispatchConfirmedBy: 'Ravi Kumar',
      dispatchDate: '2026-07-13',
      dispatchSignUrl: '',
      finalConfirmationBy: 'Ravi Kumar',
      signatureUrl: '',
      status: 'Closed',
      updatedAt: now,
      scannedCode: ''
    },
    {
      id: genId(),
      timestamp: now,
      inspectionDate: '2026-07-13',
      shipmentId: 'SHP-10240',
      productName: 'USB-C Charging Cable',
      sku: 'SKU-2210',
      receivedQty: 300,
      qcQty: 50,
      acceptedQty: 0,
      rejectedQty: 0,
      modelDispatched: 'Drop In',
      productCondition: 'Good',
      packagingQuality: 'Good',
      labelBarcode: 'Y',
      accessoriesIncluded: 'N',
      properSealing: 'Y',
      fullPhoto: 'N',
      fnskuPresent: 'Y',
      mrpPresent: 'Y',
      serialNumberPresent: 'N',
      shippingLabelPresent: 'Y',
      fullRemarks: '',
      overallResult: 'Satisfactory',
      qcRemarks: '',
      inspectorName: 'Aditi Rao',
      qcSignatureUrl: '',
      dispatchConfirmedBy: '',
      dispatchDate: '',
      dispatchSignUrl: '',
      finalConfirmationBy: '',
      signatureUrl: '',
      status: 'Open',
      updatedAt: now,
      scannedCode: ''
    },
    {
      id: genId(),
      timestamp: now,
      inspectionDate: '2026-07-12',
      shipmentId: 'SHP-10199',
      productName: 'Bluetooth Speaker Mini',
      sku: 'SKU-5573',
      receivedQty: 80,
      qcQty: 80,
      acceptedQty: 80,
      rejectedQty: 0,
      modelDispatched: 'ATS',
      productCondition: 'Good',
      packagingQuality: 'Good',
      labelBarcode: 'Y',
      accessoriesIncluded: 'Y',
      properSealing: 'Y',
      fullPhoto: 'Y',
      fnskuPresent: 'Y',
      mrpPresent: 'Y',
      serialNumberPresent: 'Y',
      shippingLabelPresent: 'Y',
      fullRemarks: '',
      overallResult: 'Good',
      qcRemarks: '',
      inspectorName: 'Manoj Singh',
      qcSignatureUrl: '',
      dispatchConfirmedBy: 'Ravi Kumar',
      dispatchDate: '2026-07-12',
      dispatchSignUrl: '',
      finalConfirmationBy: 'Ravi Kumar',
      signatureUrl: '',
      status: 'Closed',
      updatedAt: now,
      scannedCode: ''
    }
  ]
  writeAll(demo)
}
