// Google Apps Script backend for the Helett QC Checklist App.
// Deploy as a Web App (Execute as: Me, Who has access: Anyone with the link).
// Mirrors the contract in src/services/api.ts. All requests are POST with a
// JSON string body (Content-Type: text/plain) — see api.ts for why.
//
// Sheet setup: a single sheet named "Inspections" with header row matching
// the FIELDS array below, in the same order.

var SHEET_NAME = 'Inspections'

var FIELDS = [
  'id', 'timestamp', 'inspectionDate', 'shipmentId', 'productName', 'sku',
  'receivedQty', 'qcQty', 'acceptedQty', 'rejectedQty', 'modelDispatched',
  'productCondition', 'packagingQuality', 'labelBarcode', 'accessoriesIncluded',
  'properSealing', 'fullPhoto', 'fnskuPresent', 'mrpPresent',
  'serialNumberPresent', 'shippingLabelPresent', 'fullRemarks', 'overallResult',
  'qcRemarks', 'inspectorName', 'qcSignatureUrl', 'dispatchConfirmedBy',
  'dispatchDate', 'dispatchSignUrl', 'finalConfirmationBy', 'signatureUrl',
  'status', 'updatedAt'
]

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sheet = ss.getSheetByName(SHEET_NAME)
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME)
    sheet.appendRow(FIELDS)
  }
  return sheet
}

function rowToInspection_(row) {
  var obj = {}
  for (var i = 0; i < FIELDS.length; i++) {
    obj[FIELDS[i]] = row[i] === undefined ? '' : row[i]
  }
  return obj
}

function inspectionToRow_(insp) {
  return FIELDS.map(function (f) {
    return insp[f] !== undefined ? insp[f] : ''
  })
}

function findRowIndexById_(sheet, id) {
  var data = sheet.getDataRange().getValues()
  for (var r = 1; r < data.length; r++) {
    if (data[r][0] === id) return r + 1 // 1-indexed sheet row
  }
  return -1
}

var SIGNATURE_FIELDS = ['qcSignatureUrl', 'dispatchSignUrl', 'signatureUrl']
var DRIVE_FOLDER_NAME = 'Helett QC Signatures'

function getSignatureFolder_() {
  var folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME)
  if (folders.hasNext()) return folders.next()
  return DriveApp.createFolder(DRIVE_FOLDER_NAME)
}

// If a signature field holds a base64 PNG data URL (from SignaturePad's
// toDataURL()), decode it and store it as a file in Drive, replacing the
// field with the file's view URL. Leaves already-uploaded URLs untouched.
function persistSignatures_(insp) {
  var folder = null
  SIGNATURE_FIELDS.forEach(function (field) {
    var value = insp[field]
    if (typeof value === 'string' && value.indexOf('data:image') === 0) {
      if (!folder) folder = getSignatureFolder_()
      var base64 = value.split(',')[1]
      var blob = Utilities.newBlob(Utilities.base64Decode(base64), 'image/png', insp.id + '-' + field + '.png')
      var file = folder.createFile(blob)
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)
      insp[field] = file.getUrl()
    }
  })
  return insp
}

function doPost(e) {
  var body = JSON.parse(e.postData.contents)
  var action = body.action
  var sheet = getSheet_()
  var result

  if (action === 'list') {
    var data = sheet.getDataRange().getValues()
    var rows = data.slice(1).map(rowToInspection_)
    result = rows
  } else if (action === 'get') {
    var rowIdx = findRowIndexById_(sheet, body.id)
    if (rowIdx === -1) {
      return jsonResponse_({ error: 'Inspection not found' }, 404)
    }
    var row = sheet.getRange(rowIdx, 1, 1, FIELDS.length).getValues()[0]
    result = rowToInspection_(row)
  } else if (action === 'create') {
    var now = new Date().toISOString()
    var insp = Object.assign({}, body)
    delete insp.action
    insp.id = Utilities.getUuid()
    insp.timestamp = now
    insp.updatedAt = now
    insp = persistSignatures_(insp)
    sheet.appendRow(inspectionToRow_(insp))
    result = insp
  } else if (action === 'update') {
    var updateRowIdx = findRowIndexById_(sheet, body.id)
    if (updateRowIdx === -1) {
      return jsonResponse_({ error: 'Inspection not found' }, 404)
    }
    var existingRow = sheet.getRange(updateRowIdx, 1, 1, FIELDS.length).getValues()[0]
    var existing = rowToInspection_(existingRow)
    var updated = Object.assign({}, existing, body)
    delete updated.action
    updated.updatedAt = new Date().toISOString()
    updated = persistSignatures_(updated)
    sheet.getRange(updateRowIdx, 1, 1, FIELDS.length).setValues([inspectionToRow_(updated)])
    result = updated
  } else {
    return jsonResponse_({ error: 'Unknown action: ' + action }, 400)
  }

  return jsonResponse_(result, 200)
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  )
}
