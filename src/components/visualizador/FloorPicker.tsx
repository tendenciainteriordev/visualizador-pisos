'use client'

import { useMemo, useState } from 'react'
import { Search, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Catalogo, Piso } from '@/lib/types'
import { nombreCategoria } from '@/lib/types'

interface FloorPickerProps {
  catalogo: Catalogo
  pisoSeleccionado: Piso | null
  onSeleccionar: (piso: Piso) => void
}

export function FloorPicker({
  catalogo,
  pisoSeleccionado,
  onSeleccionar,
}: FloorPickerProps) {
  const [categoriaActiva, setCategoriaActiva] = useState<string>(
    Object.keys(catalogo)[0] ?? ''
  )
  const [busqueda, setBusqueda] = useState('')

  const categorias = useMemo(() => Object.keys(catalogo), [catalogo])

  const pisosFiltrados = useMemo(() => {
    const lista = catalogo[categoriaActiva] ?? []
    if (!busqueda.trim()) return lista
    const q = busqueda.toLowerCase()
    return lista.filter(
      (p) =>
        p.titulo.toLowerCase().includes(q) ||
        p.color.toLowerCase().includes(q) ||
        p.material.toLowerCase().includes(q) ||
        p.acabado.toLowerCase().includes(q)
    )
  }, [catalogo, categoriaActiva, busqueda])

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar por nombre, color o material…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-9 bg-background"
        />
      </div>

      {/* Filtros por categoría */}
      <div className="flex flex-wrap gap-2">
        {categorias.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoriaActiva(cat)}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-medium border transition',
              cat === categoriaActiva
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground'
            )}
          >
            {nombreCategoria(cat)}
            <span
              className={cn(
                'ml-1.5 text-[10px]',
                cat === categoriaActiva
                  ? 'text-primary-foreground/70'
                  : 'text-muted-foreground/70'
              )}
            >
              {catalogo[cat]?.length ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Cuadrícula de pisos */}
      {pisosFiltrados.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No encontramos pisos con esa búsqueda.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {pisosFiltrados.map((piso) => {
            const seleccionado = pisoSeleccionado?.id === piso.id
            return (
              <button
                key={piso.id}
                onClick={() => onSeleccionar(piso)}
                className={cn(
                  'group relative flex flex-col text-left rounded-lg border bg-card overflow-hidden transition',
                  seleccionado
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-foreground/30 hover:shadow-sm'
                )}
              >
                <div className="relative aspect-square bg-muted">
                  { }
                  <img
                    src={piso.imagen}
                    alt={`${piso.titulo} - ${piso.color}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  {seleccionado && (
                    <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-[13px] font-medium leading-tight truncate">
                    {piso.titulo}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {piso.color}
                  </p>
                  <p className="text-[10px] text-muted-foreground/80 mt-0.5 uppercase tracking-wider">
                    {piso.material}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Piso seleccionado: detalle compacto */}
      {pisoSeleccionado && (
        <div className="mt-2 p-4 rounded-lg border border-border bg-muted/30">
          <div className="flex items-start gap-3">
            { }
            <img
              src={pisoSeleccionado.imagen}
              alt={pisoSeleccionado.titulo}
              className="h-16 w-16 rounded-md object-cover border border-border"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {pisoSeleccionado.titulo} · {pisoSeleccionado.color}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {pisoSeleccionado.descripcion}
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[11px] text-muted-foreground">
                <span>Material: {pisoSeleccionado.material}</span>
                <span>Acabado: {pisoSeleccionado.acabado}</span>
                {pisoSeleccionado.medidas?.[0] && (
                  <span>Formato: {pisoSeleccionado.medidas[0].formato}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
