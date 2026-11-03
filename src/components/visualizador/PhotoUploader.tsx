'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Upload, Camera, X, ImageIcon, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PhotoUploaderProps {
  imagen: string | null
  onChange: (imagen: string | null, mime: string) => void
}

type Modo = 'idle' | 'camara'

const MAX_BYTES = 8 * 1024 * 1024 // 8 MB
const DIMENSION_MAX = 1600 // px en el lado más largo

/**
 * Lee un File y lo redimensiona si es muy grande.
 * Devuelve { base64, mime }.
 */
async function procesarImagen(file: File): Promise<{ base64: string; mime: string }> {
  const dataUrl = await leerComoDataURL(file)
  if (file.size > MAX_BYTES) {
    const img = await cargarImagen(dataUrl)
    const { base64, mime } = redimensionarYComprimir(img, DIMENSION_MAX)
    return { base64, mime }
  }
  const base64 = dataUrl.split(',')[1]
  // PNG pequeños se conservan como PNG; el resto a JPEG
  const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  return { base64, mime }
}

function leerComoDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function redimensionarYComprimir(
  img: HTMLImageElement,
  maxLado: number
): { base64: string; mime: string } {
  let { naturalWidth: width, naturalHeight: height } = img
  if (width > maxLado || height > maxLado) {
    if (width > height) {
      height = Math.round((height * maxLado) / width)
      width = maxLado
    } else {
      width = Math.round((width * maxLado) / height)
      height = maxLado
    }
  }
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, width, height)
  // Siempre JPEG para imágenes redimensionadas (mejor compresión para fotos)
  const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1]
  return { base64, mime: 'image/jpeg' }
}

export function PhotoUploader({ imagen, onChange }: PhotoUploaderProps) {
  const [modo, setModo] = useState<Modo>('idle')
  const [error, setError] = useState<string | null>(null)
  const [streaming, setStreaming] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const inputArchivoRef = useRef<HTMLInputElement>(null)

  const detenerCamara = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setStreaming(false)
  }, [])

  useEffect(() => {
    return () => detenerCamara()
  }, [detenerCamara])

  const iniciarCamara = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      })
      streamRef.current = stream
      setModo('camara')
      // Esperar a que el video se monte
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
          setStreaming(true)
        }
      }, 50)
    } catch (e) {
      setError(
        'No pudimos acceder a la cámara. Verifica los permisos del navegador o usa "Subir archivo".'
      )
      setModo('idle')
    }
  }

  const capturarFoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
    const base64 = dataUrl.split(',')[1]
    detenerCamara()
    setModo('idle')
    onChange(base64, 'image/jpeg')
  }

  const cancelarCamara = () => {
    detenerCamara()
    setModo('idle')
  }

  const manejarArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen (JPG, PNG o WebP).')
      return
    }
    try {
      const { base64, mime } = await procesarImagen(file)
      onChange(base64, mime)
    } catch {
      setError('No pudimos procesar la imagen. Intenta con otra.')
    } finally {
      if (inputArchivoRef.current) inputArchivoRef.current.value = ''
    }
  }

  // Modo cámara activo
  if (modo === 'camara') {
    return (
      <div className="space-y-4">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full object-cover"
          />
          {!streaming && (
            <div className="absolute inset-0 flex items-center justify-center text-white/80 text-sm">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Iniciando cámara…
            </div>
          )}
          {/* Marco guía */}
          <div className="pointer-events-none absolute inset-8 border border-white/40 rounded-lg" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={capturarFoto} disabled={!streaming} size="lg" className="flex-1">
            <Camera className="h-4 w-4 mr-2" />
            Tomar foto
          </Button>
          <Button onClick={cancelarCamara} variant="outline" size="lg" className="flex-1">
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    )
  }

  // Foto ya cargada
  if (imagen) {
    return (
      <div className="space-y-4">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
          { }
          <img
            src={`data:image/jpeg;base64,${imagen}`}
            alt="Foto del espacio a remodelar"
            className="h-full w-full object-contain"
          />
          <button
            onClick={() => onChange(null, '')}
            className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/90 transition"
            aria-label="Quitar imagen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => inputArchivoRef.current?.click()}
            variant="outline"
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Cambiar imagen
          </Button>
          <Button onClick={iniciarCamara} variant="outline" className="flex-1">
            <Camera className="h-4 w-4 mr-2" />
            Tomar otra foto
          </Button>
        </div>
        <input
          ref={inputArchivoRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={manejarArchivo}
        />
      </div>
    )
  }

  // Estado inicial: dropzone
  return (
    <div className="space-y-4">
      <button
        onClick={() => inputArchivoRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={async (e) => {
          e.preventDefault()
          const file = e.dataTransfer.files?.[0]
          if (file) {
            const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>
            await manejarArchivo(fakeEvent)
          }
        }}
        className={cn(
          'group relative flex flex-col items-center justify-center gap-3',
          'aspect-video w-full rounded-xl border-2 border-dashed border-border',
          'hover:border-foreground/30 hover:bg-muted/30 transition cursor-pointer p-6'
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:bg-foreground/5 group-hover:text-foreground transition">
          <Upload className="h-5 w-5" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            Arrastra una foto o haz clic para subir
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            JPG, PNG o WebP · máx. 8 MB
          </p>
        </div>
        <input
          ref={inputArchivoRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={manejarArchivo}
        />
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground uppercase tracking-wider">o</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button onClick={iniciarCamara} variant="outline" size="lg" className="w-full">
        <Camera className="h-4 w-4 mr-2" />
        Tomar foto con la cámara
      </Button>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50 text-xs text-muted-foreground">
        <ImageIcon className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-foreground mb-0.5">Consejos para un buen resultado</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>Toma la foto de frente al piso, no desde arriba</li>
            <li>Incluye parte de los muebles para que la IA conserve el contexto</li>
            <li>Evita reflejos directos del sol en el piso</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
