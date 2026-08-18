import { useEffect, useRef, useState } from 'react'
import type { IScannerControls } from '@zxing/browser'

interface BarcodeScannerProps {
  onScan: (value: string) => void
  onClose: () => void
}

// Full-screen camera scanner. Imported via React.lazy() in QCForm — that,
// combined with the dynamic import() below for the @zxing/browser library
// itself, means none of this (component or library) is downloaded until
// the user actually taps "Scan", keeping it off the initial app load.
export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'starting' | 'scanning'>('starting')

  useEffect(() => {
    let cancelled = false

    async function start() {
      try {
        // getUserMedia only exists in a "secure context" — HTTPS, or literally
        // localhost. Loaded over plain http:// (e.g. a phone hitting a dev
        // server by LAN IP instead of a deployed https:// URL, which is NOT
        // treated as secure even though localhost on that same machine
        // would be), the whole API is simply undefined — camera access
        // silently can't work at all, and it's worth telling the user that
        // directly instead of a generic failure.
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError(
            window.isSecureContext
              ? 'Camera access is not supported in this browser.'
              : 'Camera access requires a secure (https://) connection. This page was loaded over an insecure connection.'
          )
          return
        }

        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        if (cancelled) return
        const reader = new BrowserMultiFormatReader()
        const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current!, (result) => {
          // The callback also fires repeatedly with a "not found yet" error
          // while no code is in view — that's normal mid-scan noise, not a
          // failure, so only a successful `result` is acted on here.
          if (result) onScan(result.getText())
        })
        if (cancelled) {
          controls.stop()
          return
        }
        controlsRef.current = controls
        setStatus('scanning')
      } catch (err) {
        if (cancelled) return
        const name = err instanceof Error ? err.name : ''
        const message = err instanceof Error ? err.message : String(err)
        if (name === 'NotAllowedError') {
          setError('Camera permission was denied. Allow camera access in your browser/device settings to scan.')
        } else if (name === 'NotFoundError') {
          setError('No camera was found on this device.')
        } else {
          // Not a case we recognize yet — show the real error instead of a
          // generic message, so it can actually be diagnosed.
          setError(`Could not access the camera (${name || 'error'}: ${message}). You can close this and enter the code manually.`)
        }
      }
    }

    start()
    return () => {
      cancelled = true
      controlsRef.current?.stop()
    }
  }, [onScan])

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 h-14 text-white shrink-0">
        <span className="font-semibold">Scan barcode / QR code</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close scanner"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        {error ? (
          <div className="text-white text-center px-6 max-w-sm">
            <p className="mb-5 text-sm">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-6 rounded-md bg-white text-gray-900 font-semibold"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-2 border-white/80 rounded-lg" />
            </div>
            {status === 'starting' && (
              <div className="absolute bottom-10 text-white text-sm bg-black/60 px-3 py-1.5 rounded-full">
                Starting camera...
              </div>
            )}
          </>
        )}
      </div>

      {!error && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 m-4 min-h-[44px] rounded-md border border-white/40 text-white font-medium"
        >
          Cancel
        </button>
      )}
    </div>
  )
}
