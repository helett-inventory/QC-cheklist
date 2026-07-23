import { useEffect, useRef, useState } from 'react'

interface SignaturePadProps {
  value?: string
  onChange: (dataUrl: string) => void
  readOnly?: boolean
}

export function SignaturePad({ value, onChange, readOnly }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [unlocked, setUnlocked] = useState(!!value)

  useEffect(() => {
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

    if (value) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      img.src = value
    }
  }, [])

  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height
    }
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (readOnly) return
    setUnlocked(true)
    drawing.current = true
    const ctx = canvasRef.current?.getContext('2d')
    const pos = getPos(e)
    ctx?.beginPath()
    ctx?.moveTo(pos.x, pos.y)
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (readOnly || !drawing.current) return
    const ctx = canvasRef.current?.getContext('2d')
    const pos = getPos(e)
    ctx?.lineTo(pos.x, pos.y)
    ctx?.stroke()
  }

  function handlePointerUp() {
    if (readOnly || !drawing.current) return
    drawing.current = false
    const canvas = canvasRef.current
    if (canvas) onChange(canvas.toDataURL('image/png'))
  }

  function handleClear() {
    if (readOnly) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setUnlocked(false)
    onChange('')
  }

  if (readOnly) {
    return value ? (
      <img src={value} alt="Signature" className="w-full h-32 object-contain border border-gray-200 rounded-md bg-white" />
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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="w-full h-32 border border-gray-300 rounded-md bg-white touch-none"
      />
      {!unlocked && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm pointer-events-none">
          Tap to unlock
        </div>
      )}
      <button
        type="button"
        onClick={handleClear}
        className="mt-1 text-sm text-teal-700 font-medium min-h-[44px] px-2"
      >
        Clear
      </button>
    </div>
  )
}
