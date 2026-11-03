'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowRight, ArrowLeft, Sparkles, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/visualizador/Header'
import { Stepper, type PasoId } from '@/components/visualizador/Stepper'
import { PhotoUploader } from '@/components/visualizador/PhotoUploader'
import { FloorPicker } from '@/components/visualizador/FloorPicker'
import { ResultViewer } from '@/components/visualizador/ResultViewer'
import { toast } from 'sonner'
import type { Catalogo, Piso } from '@/lib/types'

export default function Home() {
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null)
  const [paso, setPaso] = useState<PasoId>('foto')
  const [imagenBase64, setImagenBase64] = useState<string | null>(null)
  const [imagenMime, setImagenMime] = useState<string>('')
  const [piso, setPiso] = useState<Piso | null>(null)

  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [modeloUsado, setModeloUsado] = useState<string | null>(null)

  // Cargar catálogo
  useEffect(() => {
    fetch('/data/productos.json')
      .then((r) => r.json())
      .then((data: Catalogo) => setCatalogo(data))
      .catch(() => toast.error('No pudimos cargar el catálogo.'))
  }, [])

  const pasosCompletados = new Set<PasoId>([
    ...(imagenBase64 ? (['foto'] as PasoId[]) : []),
    ...(piso && imagenBase64 ? (['piso'] as PasoId[]) : []),
    ...(resultado ? (['resultado'] as PasoId[]) : []),
  ])

  const generar = useCallback(async () => {
    if (!imagenBase64 || !piso) return
    setCargando(true)
    setError(null)
    setResultado(null)
    setModeloUsado(null)

    try {
      const resp = await fetch('/api/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imagenBase64,
          imagenMime,
          piso,
        }),
      })

      const data = await resp.json()

      if (!resp.ok) {
        throw new Error(data?.error || 'Error desconocido')
      }

      setResultado(data.imagen)
      setModeloUsado(data.modelo)
      setPaso('resultado')
      toast.success('¡Visualización lista!')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido'
      setError(msg)
      setPaso('resultado')
      toast.error('Hubo un problema al generar la imagen.')
    } finally {
      setCargando(false)
    }
  }, [imagenBase64, imagenMime, piso])

  const handleCambiarPiso = () => {
    setResultado(null)
    setError(null)
    setPaso('piso')
  }

  const puedeAvanzarFoto = !!imagenBase64
  const puedeAvanzarPiso = !!imagenBase64 && !!piso

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero */}
        <section className="mb-8 sm:mb-10 text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-xs text-muted-foreground mb-4">
            <Sparkles className="h-3 w-3" />
            Visualización con IA · Gratis
          </span>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-balance">
            Prueba cualquier piso en tu espacio,
            <br className="hidden sm:block" /> antes de comprarlo.
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground text-pretty">
            Sube una foto de tu habitación, elige un piso del catálogo y deja
            que la IA te muestre cómo se vería.
          </p>
        </section>

        {/* Stepper */}
        <section className="mb-8 sm:mb-10 max-w-3xl mx-auto">
          <Stepper
            pasoActual={paso}
            pasosCompletados={pasosCompletados}
            onPasoClick={(p) => setPaso(p)}
          />
        </section>

        {/* Contenido del paso */}
        <section className="max-w-4xl mx-auto">
          {paso === 'foto' && (
            <div className="space-y-5">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">Sube o toma una foto</h2>
                <span className="text-xs text-muted-foreground">Paso 1 de 3</span>
              </div>
              <PhotoUploader
                imagen={imagenBase64}
                onChange={(img, mime) => {
                  setImagenBase64(img)
                  setImagenMime(mime)
                }}
              />
              {puedeAvanzarFoto && (
                <div className="flex justify-end">
                  <Button onClick={() => setPaso('piso')} size="lg">
                    Continuar a elegir piso
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {paso === 'piso' && catalogo && (
            <div className="space-y-5">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">Elige un piso</h2>
                <span className="text-xs text-muted-foreground">Paso 2 de 3</span>
              </div>
              <FloorPicker
                catalogo={catalogo}
                pisoSeleccionado={piso}
                onSeleccionar={(p) => {
                  setPiso(p)
                  setResultado(null)
                  setError(null)
                }}
              />
              <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-2">
                <Button variant="outline" onClick={() => setPaso('foto')} size="lg">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
                <Button
                  onClick={() => setPaso('resultado')}
                  disabled={!puedeAvanzarPiso}
                  size="lg"
                >
                  Ver resultado
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {paso === 'resultado' && imagenBase64 && piso && (
            <div className="space-y-5">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">Tu resultado</h2>
                <span className="text-xs text-muted-foreground">Paso 3 de 3</span>
              </div>

              {!resultado && !cargando && !error && (
                <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mx-auto">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium">Todo listo para generar</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Vamos a aplicar el piso <strong>{piso.titulo}</strong> en tu
                    espacio usando IA. Pulsa para empezar.
                  </p>
                  <Button onClick={generar} size="lg">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generar visualización
                  </Button>
                </div>
              )}

              {(cargando || resultado || error) && (
                <ResultViewer
                  imagenOriginal={`data:${imagenMime || 'image/jpeg'};base64,${imagenBase64}`}
                  imagenGenerada={resultado}
                  piso={piso}
                  cargando={cargando}
                  error={error}
                  modeloUsado={modeloUsado}
                  onRegenerar={generar}
                  onCambiarPiso={handleCambiarPiso}
                />
              )}

              {!cargando && (
                <div className="flex justify-start">
                  <Button variant="outline" onClick={() => setPaso('piso')} size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver a elegir piso
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Sección informativa */}
        <section className="mt-16 sm:mt-20 max-w-3xl mx-auto">
          <div className="rounded-xl border border-border bg-muted/30 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background border border-border">
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-sm space-y-1.5">
                <p className="font-medium">¿Cómo funciona?</p>
                <ol className="list-decimal pl-5 space-y-1 text-muted-foreground text-[13px]">
                  <li>Tomas o subes una foto del espacio que quieres remodelar.</li>
                  <li>Seleccionas un piso del catálogo de nuestro inventario.</li>
                  <li>La IA procesa ambas imágenes y reemplaza únicamente el piso,
                    conservando paredes y muebles.</li>
                </ol>
                <p className="text-xs text-muted-foreground/80 pt-1.5">
                  Servicio gratuito con límite diario. Si la herramienta está
                  saturada, intenta de nuevo en unos minutos.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t border-border/60 bg-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Visualizador de Pisos. Demo técnica con Pollinations AI.</p>
            <p className="text-[11px]">
              Las imágenes generadas son aproximaciones. Verifica muestras físicas antes de comprar.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
