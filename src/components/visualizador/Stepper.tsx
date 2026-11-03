'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PasoId = 'foto' | 'piso' | 'resultado'

interface StepperProps {
  pasoActual: PasoId
  onPasoClick?: (paso: PasoId) => void
  pasosCompletados: Set<PasoId>
}

const PASOS: { id: PasoId; titulo: string; descripcion: string }[] = [
  { id: 'foto', titulo: 'Tu foto', descripcion: 'Sube o toma la foto' },
  { id: 'piso', titulo: 'Elige piso', descripcion: 'Explora el catálogo' },
  { id: 'resultado', titulo: 'Resultado', descripcion: 'Compara antes / después' },
]

export function Stepper({ pasoActual, onPasoClick, pasosCompletados }: StepperProps) {
  const idxActual = PASOS.findIndex((p) => p.id === pasoActual)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {PASOS.map((paso, i) => {
          const completado = pasosCompletados.has(paso.id)
          const activo = paso.id === pasoActual
          const clickable =
            onPasoClick &&
            (paso.id === 'foto' || pasosCompletados.has('foto'))

          return (
            <div key={paso.id} className="flex items-1 flex-1 last:flex-none">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onPasoClick?.(paso.id)}
                className={cn(
                  'group flex items-center gap-3 transition',
                  clickable && 'cursor-pointer',
                  !clickable && 'cursor-not-allowed'
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-all',
                    activo &&
                      'border-primary bg-primary text-primary-foreground shadow-sm',
                    completado &&
                      !activo &&
                      'border-primary bg-primary/10 text-primary',
                    !activo &&
                      !completado &&
                      'border-border bg-background text-muted-foreground'
                  )}
                >
                  {completado && !activo ? (
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  ) : (
                    i + 1
                  )}
                </span>

                <div className="hidden sm:flex flex-col leading-tight">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      activo ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {paso.titulo}
                  </span>
                  <span className="text-[11px] text-muted-foreground/80">
                    {paso.descripcion}
                  </span>
                </div>
              </button>

              {i < PASOS.length - 1 && (
                <div
                  className={cn(
                    'mx-3 sm:mx-4 h-px flex-1 transition-all',
                    i < idxActual ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
