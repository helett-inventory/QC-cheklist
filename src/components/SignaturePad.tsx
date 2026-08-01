import { useEffect, useRef, useState } from 'react'

interface SignaturePadProps {
  value?: string
  onChange: (dataUrl: string) => void
  readOnly?: boolean
}

// Pointer Events only exist in iOS Safari 13+ (2019). On anything older,
// onPointerDown/Move/Up simply never fire — silent, total failure to draw.
// Feature-detecting once and falling back to plain touch events covers
// those devices without needing to know the exact minimum iOS version.
const SUPPORTS_POINTER_EVENTS = typeof window !== 'undefined' && 'PointerEvent' in window

function getPosFromClient(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
  const rect = canvas.getBoundingClientRect()
  return {
    x: ((clientX - rect.left) / rect.width) * canvas.width,
    y: ((clientY - rect.top) / rect.height) * canvas.height
  }
}

export function SignaturePad({ value, onChange, readOnly }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const loadedRef = useRef(false)
  // Tracks the last value *this component* produced via onChange (drawing a
  // stroke, clearing). Lets the load effect below tell "value changed
  // because we just drew on it" (already correctly on the canvas, no reload
  // needed) apart from "value changed because fresh data arrived from the
  // network/cache" (needs a real reload) — both look identical as a prop
  // change otherwise. Starts at a sentinel that can never equal a real
  // value, so the very first render's effect always runs (seeding it with
  // the initial `value` instead would wrongly skip initializing the canvas
  // whenever a pad starts out empty).
  const NEVER_EMITTED = useRef(Symbol('never-emitted')).current
  const lastEmittedValue = useRef<string | symbol | undefined>(NEVER_EMITTED)
  const [hasContent, setHasContent] = useState(!!value)
  // The pad only captures touch (blocking page scroll) while "active". Until
  // then it behaves like normal scrollable content, so a scroll gesture that
  // starts over the pad while flicking through the form doesn't get read as
  // a stroke. Tapping expands it into drawing mode.
  const [active, setActive] = useState(false)

  // A form can hold several of these (QC/Dispatch/Final signatures), each
  // backed by a Drive-hosted image — load the pixel data only once the pad
  // actually scrolls into view instead of fetching all of them immediately
  // on page load. `loadedRef` guards against loading twice for the SAME
  // value (once from the observer, again if the user taps to expand before
  // it fired) — it gets reset below whenever `value` itself changes.
  function loadSignature() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !value || loadedRef.current) return
    loadedRef.current = true
    const img = new Image()
    img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    img.src = value
  }

  useEffect(() => {
    // Skip: this "change" is just our own drawing/clearing echoing back
    // through props — the canvas already reflects it live, redrawing would
    // just flash a clear+reload after every stroke.
    if (value === lastEmittedValue.current) return

    setHasContent(!!value)
    // A record can be shown from stale-while-revalidate cache first (see
    // useInspections/QCForm), then get a corrected `value` moments later
    // once the real fetch resolves — this must re-run when that happens,
    // not just once on mount, or the canvas stays stuck on the stale value.
    loadedRef.current = false

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (!value) return

    if (!('IntersectionObserver' in window)) {
      loadSignature()
      return
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadSignature()
        observer.disconnect()
      }
    })
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [value])

  // iOS Safari registers React's synthetic onTouchMove as a passive
  // listener by default, so calling preventDefault() inside it silently
  // does nothing — the page can still hijack the gesture as a scroll. A
  // real, non-passive listener attached directly to the canvas is the only
  // reliable way to block that during a touch-drawn stroke. Only needed on
  // the touch-fallback path (see SUPPORTS_POINTER_EVENTS above); pointer
  // events don't have this passive-by-default behavior.
  useEffect(() => {
    if (SUPPORTS_POINTER_EVENTS) return
    const canvas = canvasRef.current
    if (!canvas) return

    function onTouchMoveNative(e: TouchEvent) {
      if (readOnly || !active || !drawing.current) return
      e.preventDefault()
      const touch = e.touches[0]
      if (!touch || !canvas) return
      const pos = getPosFromClient(canvas, touch.clientX, touch.clientY)
      const ctx = canvas.getContext('2d')
      ctx?.lineTo(pos.x, pos.y)
      ctx?.stroke()
    }

    canvas.addEventListener('touchmove', onTouchMoveNative, { passive: false })
    return () => canvas.removeEventListener('touchmove', onTouchMoveNative)
  }, [active, readOnly])

  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    return getPosFromClient(canvasRef.current!, e.clientX, e.clientY)
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (readOnly || !active) return
    setHasContent(true)
    drawing.current = true
    const ctx = canvasRef.current?.getContext('2d')
    const pos = getPos(e)
    ctx?.beginPath()
    ctx?.moveTo(pos.x, pos.y)
    try {
      // Support for this has been inconsistent across Safari versions; if
      // it throws, drawing should still work via the move/up handlers, so
      // don't let it break the rest of the gesture.
      ;(e.target as Element).setPointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (readOnly || !active || !drawing.current) return
    const ctx = canvasRef.current?.getContext('2d')
    const pos = getPos(e)
    ctx?.lineTo(pos.x, pos.y)
    ctx?.stroke()
  }

  function finishStroke() {
    if (readOnly || !active || !drawing.current) return
    drawing.current = false
    const canvas = canvasRef.current
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png')
      lastEmittedValue.current = dataUrl
      onChange(dataUrl)
    }
  }

  function handleTouchStart(e: React.TouchEvent<HTMLCanvasElement>) {
    if (readOnly || !active) return
    e.preventDefault()
    const touch = e.touches[0]
    const canvas = canvasRef.current
    if (!touch || !canvas) return
    setHasContent(true)
    drawing.current = true
    const ctx = canvas.getContext('2d')
    const pos = getPosFromClient(canvas, touch.clientX, touch.clientY)
    ctx?.beginPath()
    ctx?.moveTo(pos.x, pos.y)
  }

  function handleClear() {
    if (readOnly) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasContent(false)
    lastEmittedValue.current = ''
    onChange('')
  }

  if (readOnly) {
    return value ? (
      <img
        src={value}
        alt="Signature"
        loading="lazy"
        decoding="async"
        className="w-full h-32 object-contain border border-gray-200 rounded-md bg-white"
      />
    ) : (
      <div className="w-full h-32 flex items-center justify-center border border-gray-200 rounded-md bg-gray-50 text-gray-400 text-sm">
        No signature
      </div>
    )
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={600}
        height={200}
        onPointerDown={SUPPORTS_POINTER_EVENTS ? handlePointerDown : undefined}
        onPointerMove={SUPPORTS_POINTER_EVENTS ? handlePointerMove : undefined}
        onPointerUp={SUPPORTS_POINTER_EVENTS ? finishStroke : undefined}
        onPointerLeave={SUPPORTS_POINTER_EVENTS ? finishStroke : undefined}
        onTouchStart={SUPPORTS_POINTER_EVENTS ? undefined : handleTouchStart}
        onTouchEnd={SUPPORTS_POINTER_EVENTS ? undefined : finishStroke}
        // iOS treats a touch-and-hold on any element as a possible text
        // selection / "Look Up" gesture unless explicitly told not to —
        // without this, iOS can show its selection callout instead of
        // drawing a stroke. touch-action (via the Tailwind classes below)
        // doesn't cover this; it's a separate, WebKit-specific behavior.
        style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
        className={`w-full h-32 border rounded-md bg-white ${
          active ? 'touch-none border-teal-600' : 'touch-pan-y border-gray-300'
        }`}
      />
      {!active && (
        <button
          type="button"
          onClick={() => {
            loadSignature()
            setActive(true)
          }}
          className="absolute inset-0 flex items-end justify-center pb-2"
        >
          <span className="text-xs font-medium text-gray-500 bg-white/90 px-2 py-1 rounded-full border border-gray-200">
            {hasContent ? 'Tap to expand & edit' : 'Tap to expand & sign'}
          </span>
        </button>
      )}
      {active && (
        <div className="flex gap-4 mt-1">
          <button
            type="button"
            onClick={handleClear}
            className="text-sm text-teal-700 font-medium min-h-[44px] px-2"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => setActive(false)}
            className="text-sm text-gray-600 font-medium min-h-[44px] px-2"
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}
