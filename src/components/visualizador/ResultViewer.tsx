'use client'

import { Download, RefreshCw, Sparkles, AlertCircle, ArrowRight, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Piso } from '@/lib/types'

interface ResultViewerProps {
  imagenOriginal: string
  imagenGenerada: string | null
  piso: Piso
  cargando: boolean
  error: string | null
  modeloUsado: string | null
  onRegenerar: () => void
  onCambiarPiso: () => void
}

export function ResultViewer({
  imagenOriginal,
  imagenGenerada,
  piso,
  cargando,
  error,
  modeloUsado,
  onRegenerar,
  onCambiarPiso,
}: ResultViewerProps) {
  const descargar = () => {
    if (!imagenGenerada) return
    const a = document.createElement('a')
    a.href = imagenGenerada
    a.download = `visualizador-${piso.id}-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // Estado: cargando
  if (cargando) {
    return (
      <div className="space-y-4">
        <div className="relative aspect-video w-full rounded-xl bg-muted overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted/70 to-muted animate-pulse" />
          <div className="relative flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background/80 shadow-sm">
              <Wand2 className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Generando tu visualización…
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Esto puede tardar entre 20 y 60 segundos.
                <br />
                Estamos aplicando el piso <strong>{piso.titulo}</strong> en tu espacio.
              </p>
            </div>
            <div className="flex gap-1 mt-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
        <p className="text-xs text-center text-muted-foreground">
          Mantén esta pestaña abierta. No cierres el navegador.
        </p>
      </div>
    )
  }

  // Estado: error
  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">
            No pudimos generar la imagen
          </p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">{error}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={onRegenerar} className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Intentar de nuevo
          </Button>
          <Button onClick={onCambiarPiso} variant="outline" className="flex-1">
            Probar con otro piso
          </Button>
        </div>
      </div>
    )
  }

  // Estado: cargando imagen pero aún sin mostrar
  if (!imagenGenerada) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Aún no hay resultado. Vuelve al paso 2 y selecciona un piso.
      </div>
    )
  }

  // Estado: éxito
  return (
    <div className="space-y-5">
      {/* Comparador lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Antes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Antes
            </span>
          </div>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted border border-border">
            { }
            <img
              src={imagenOriginal}
              alt="Espacio original"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Después */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-primary">
              Después
            </span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {piso.titulo} · {piso.color}
            </span>
          </div>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted border-2 border-primary/30">
            { }
            <img
              src={imagenGenerada}
              alt={`Espacio con piso ${piso.titulo}`}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Indicador de flecha en mobile */}
      <div className="md:hidden flex items-center justify-center -my-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <ArrowRight className="h-3.5 w-3.5 rotate-90" />
        </div>
      </div>

      {/* Modelo usado (informativo) */}
      {modeloUsado && (
        <p className="text-[11px] text-center text-muted-foreground/80">
          Generado con: <span className="font-mono">{modeloUsado}</span>
        </p>
      )}

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button onClick={descargar} className="flex-1" size="lg">
          <Download className="h-4 w-4 mr-2" />
          Descargar imagen
        </Button>
        <Button onClick={onRegenerar} variant="outline" size="lg" className="flex-1">
          <RefreshCw className="h-4 w-4 mr-2" />
          Generar de nuevo
        </Button>
        <Button onClick={onCambiarPiso} variant="outline" size="lg" className="flex-1">
          Probar otro piso
        </Button>
      </div>

      {/* Aviso honesto */}
      <div className="mt-2 p-3 rounded-md bg-muted/50 text-xs text-muted-foreground leading-relaxed">
        <strong className="text-foreground">Nota:</strong> La imagen es una
        aproximación generada por IA y puede no reflejar con 100% de precisión el
        tamaño real de las piezas, las juntas ni el acabado final del producto.
        Te recomendamos visitar tienda para ver una muestra física antes de
        comprar.
      </div>
    </div>
  )
}
