// Tipos del catálogo de pisos (basado en el JSON de Terza)

export interface PisoMedida {
  formato: string
  inventario: string
  preciominimo: string
  preciomaximo: string
  metroscaja: string
  piezascaja: string
  espesor: string
  capanomble: string
}

export interface Piso {
  id: string
  titulo: string
  imagen: string
  banner: string
  ambiente: string
  descripcion: string
  material: string
  acabado: string
  look: string
  color: string
  medidas: PisoMedida[]
  marca: string
  url: string
  galeria1: string
  galeria2: string
  galeria3: string
}

// Mapa de categorías → array de pisos
export type Catalogo = Record<string, Piso[]>

// Etiquetas legibles para cada categoría del JSON
export const ETIQUETAS_CATEGORIAS: Record<string, string> = {
  pisosrigidos: 'Vinílicos Rígidos',
  pisoslaminados: 'Laminados',
  pisoaportland: 'Porcelanato',
  pisosvinilicos: 'Vinílicos',
  pisosceramicos: 'Cerámicos',
}

export function nombreCategoria(clave: string): string {
  return ETIQUETAS_CATEGORIAS[clave] ?? clave.charAt(0).toUpperCase() + clave.slice(1)
}
