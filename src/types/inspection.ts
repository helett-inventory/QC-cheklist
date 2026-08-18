// '' represents "not yet answered" — these fields have no default selection
// on a new inspection, forcing the inspector to actively pick one.
export type YesNo = 'Y' | 'N' | ''

export interface Inspection {
  id: string
  timestamp: string
  inspectionDate: string
  shipmentId: string
  productName: string
  sku: string
  receivedQty: number
  qcQty: number
  acceptedQty: number
  rejectedQty: number
  modelDispatched: 'ATS' | 'Drop In' | ''
  productCondition: 'Good' | 'Bad' | ''
  packagingQuality: 'Good' | 'Bad' | ''
  labelBarcode: YesNo
  accessoriesIncluded: YesNo
  properSealing: YesNo
  fnskuPresent: YesNo
  mrpPresent: YesNo
  serialNumberPresent: YesNo
  shippingLabelPresent: YesNo
  fullRemarks: string
  overallResult: 'Good' | 'Bad' | 'Satisfactory' | ''
  qcRemarks: string
  inspectorName: string
  qcSignatureUrl: string
  dispatchConfirmedBy: string
  dispatchDate: string
  dispatchSignUrl: string
  finalConfirmationBy: string
  signatureUrl: string
  status: 'Open' | 'Closed'
  updatedAt: string
  // Decoded text from the QR/barcode scanner (src/components/BarcodeScanner.tsx).
  // Reuses column Q, which used to be 'fullPhoto' (the old disabled "Upload
  // Photo" placeholder, never actually implemented) — same column, repointed.
  scannedCode: string
}

export type NewInspection = Omit<Inspection, 'id' | 'timestamp' | 'updatedAt'>
