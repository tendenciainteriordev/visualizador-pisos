'use client'

import { Camera, Sparkles } from 'lucide-react'

export function Header() {
  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Camera className="h-4 w-4" strokeWidth={2.2} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[15px] font-semibold tracking-tight">
                Visualizador de Pisos
              </span>
              <span className="text-[11px] text-muted-foreground">
                Prueba tu piso antes de comprar
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Powered by Pollinations AI</span>
          </div>
        </div>
      </div>
    </header>
  )
}
