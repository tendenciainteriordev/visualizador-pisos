import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import type { Piso } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 120 // segundos; Pollinations puede tardar 30-60s

interface GenerateBody {
  /** Imagen del cuarto del usuario en base64 (data URL o base64 puro) */
  imagenBase64: string
  /** MIME type de la imagen, p.ej. "image/jpeg" */
  imagenMime: string
  /** Piso seleccionado del catálogo */
  piso: Piso
}

/**
 * Construye el prompt para Pollinations.
 * Le dice al modelo EXACTAMENTE qué conservar y qué reemplazar,
 * para reducir el riesgo de que regenere paredes o muebles.
 */
function construirPrompt(piso: Piso): string {
  const partes: string[] = []

  partes.push(
    `Replace ONLY the floor surface in this room with the EXACT flooring shown in the second reference image.`
  )
  partes.push(
    `The second image is a sample of ${piso.material} flooring. You MUST replicate its color, pattern, plank/tile layout, grain texture and finish EXACTLY. Do not invent a different wood tone or color.`
  )
  partes.push(
    `Floor spec: name "${piso.titulo}", color "${piso.color}", finish ${piso.acabado.toLowerCase()}, pattern ${piso.look}.`
  )
  partes.push(
    'CRITICAL: Keep every wall, the ceiling, all furniture, decorations, windows, doors and lighting EXACTLY as they are in the FIRST image (the room photo). Do NOT add, remove, or modify any object.'
  )
  partes.push(
    'The new floor must follow the existing perspective lines, vanishing point and lighting direction. Preserve original shadows on and around the floor.'
  )
  partes.push(
    'Apply realistic floor reflections based on the room light sources. Match plank/tile direction to the room perspective (typically running toward the window or longest wall).'
  )
  partes.push('Photorealistic result. Same camera angle as input. 1024x1024.')

  return partes.join(' ')
}

/**
 * Redimensiona y normaliza la imagen del usuario a 1024x1024 JPEG.
 * Esto es lo que la API de Pollinations espera.
 * Recorta al centro (cover) para mantener la región principal de la foto.
 */
async function normalizarImagen(imagenBuffer: Buffer): Promise<Buffer> {
  return await sharp(imagenBuffer)
    .resize(1024, 1024, {
      fit: 'cover',
      position: 'centre',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer()
}

/**
 * Redimensiona la imagen del piso del catálogo a 512x512 JPEG (referencia).
 * Tamaño menor = menos peso en la petición.
 */
async function normalizarImagenPiso(imagenBuffer: Buffer): Promise<Buffer> {
  return await sharp(imagenBuffer)
    .resize(512, 512, {
      fit: 'cover',
      position: 'centre',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer()
}

/**
 * Descarga la imagen del piso del catálogo para enviarla como referencia.
 * Devuelve null si no se puede descargar (la IA trabajará solo con texto).
 */
async function descargarImagenPiso(urlPiso: string): Promise<Buffer | null> {
  try {
    const resp = await fetch(urlPiso, {
      signal: AbortSignal.timeout(8000),
    })
    if (!resp.ok) return null
    const buf = Buffer.from(await resp.arrayBuffer())
    if (buf.length < 500) return null
    return await normalizarImagenPiso(buf)
  } catch {
    return null
  }
}

interface PollinationsResult {
  imagenBase64: string
  modeloUsado: string
}

/**
 * Llama a la API de Pollinations con un modelo específico.
 * Lanza error explícito si falla, para que el llamador pueda hacer fallback.
 */
async function llamarModelo(
  imagenCuarto: Buffer,
  imagenPiso: Buffer | null,
  prompt: string,
  modelo: string,
  apiKey: string,
  referrer: string
): Promise<PollinationsResult> {
  const form = new FormData()
  // Imagen 1: la foto del cuarto del usuario (la que se va a editar)
  const blob = new Blob([imagenCuarto], { type: 'image/jpeg' })
  form.append('image', blob, 'cuarto.jpg')

  // Imagen 2 (referencia): la imagen del piso del catálogo.
  if (imagenPiso) {
    const blobPiso = new Blob([imagenPiso], { type: 'image/jpeg' })
    form.append('image', blobPiso, 'piso-referencia.jpg')
  }

  form.append('prompt', prompt)
  form.append('model', modelo)
  form.append('size', '1024x1024')
  form.append('referrer', referrer)

  const resp = await fetch('https://gen.pollinations.ai/v1/images/edits', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  })

  if (!resp.ok) {
    const errText = await resp.text()
    const err = new Error(`Pollinations ${resp.status}: ${errText.slice(0, 300)}`)
    err.name = resp.status === 429 ? 'RateLimitError' : resp.status >= 500 ? 'ServerError' : 'ClientError'
    throw err
  }

  // Pollinations devuelve JSON estilo OpenAI: { data: [{ b64_json | url }] }
  const data = await resp.json()
  const item = data?.data?.[0]
  if (item?.b64_json) {
    return { imagenBase64: item.b64_json, modeloUsado: modelo }
  }
  if (item?.url) {
    const imgResp = await fetch(item.url)
    const imgBuf = Buffer.from(await imgResp.arrayBuffer())
    return { imagenBase64: imgBuf.toString('base64'), modeloUsado: modelo }
  }
  throw new Error('Respuesta sin imagen: ' + JSON.stringify(data).slice(0, 300))
}

/**
 * Orquesta la llamada a Pollinations con fallback automático.
 * 1. Intenta con el modelo configurado (default: kontext).
 * 2. Si falla con error de cliente (no rate limit ni server), prueba mai-image-2.6-flash.
 * 3. Si todo falla, lanza error con mensaje útil.
 */
async function llamarPollinations(
  imagenBuffer: Buffer,
  _mime: string,
  prompt: string,
  piso: Piso
): Promise<PollinationsResult> {
  const apiKey = process.env.POLLINATIONS_API_KEY?.trim()
  const modeloPrincipal =
    process.env.POLLINATIONS_MODEL?.trim() || 'black-forest-labs/flux.1-kontext-pro'
  const referrer = process.env.POLLINATIONS_REFERRER?.trim() || 'localhost'

  // --- Sin API key: modo demo anónimo ---
  if (!apiKey || apiKey === 'sk_aqui_va_tu_api_key') {
    const promptGen = `Photorealistic interior room with ${piso.material.toLowerCase()} floor in ${piso.color}, ${piso.acabado.toLowerCase()} finish. Modern furniture, natural daylight. The floor is the main visual focus.`
    const seed = Math.floor(Math.random() * 1_000_000)
    const url =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(promptGen)}` +
      `?width=1024&height=768&seed=${seed}&nologo=true&model=flux`

    const imgResp = await fetch(url)
    if (!imgResp.ok) {
      throw new Error(`Endpoint anónimo falló: ${imgResp.status}`)
    }
    const imgBuf = Buffer.from(await imgResp.arrayBuffer())
    return { imagenBase64: imgBuf.toString('base64'), modeloUsado: 'flux-anonimo' }
  }

  // --- Con API key: camino normal con fallback ---
  // Normalizar la imagen del cuarto del usuario a 1024x1024 JPEG
  const imagenCuarto = await normalizarImagen(imagenBuffer)

  // Descargar y normalizar la imagen del piso del catálogo
  const imagenPiso = await descargarImagenPiso(piso.imagen)

  // Intento 1: modelo configurado
  try {
    return await llamarModelo(imagenCuarto, imagenPiso, prompt, modeloPrincipal, apiKey, referrer)
  } catch (err) {
    const errName = (err as Error).name
    // Si es rate limit o server error, no reintentamos con otro modelo (probablemente también falle)
    if (errName === 'RateLimitError' || errName === 'ServerError') {
      throw err
    }
    console.warn(
      `[API /generar] Modelo ${modeloPrincipal} falló con ${(err as Error).message}. ` +
      `Intentando fallback a microsoft/mai-image-2.6-flash...`
    )

    // Intento 2: fallback a mai-image-2.6-flash (modelo gratuito de respaldo)
    try {
      return await llamarModelo(
        imagenCuarto,
        imagenPiso,
        prompt,
        'microsoft/mai-image-2.6-flash',
        apiKey,
        referrer
      )
    } catch (err2) {
      // Intento 3: último intento con mai-image-2.6 (la versión no flash)
      console.warn(
        `[API /generar] Fallback 1 también falló. Intentando microsoft/mai-image-2.6...`
      )
      return await llamarModelo(
        imagenCuarto,
        imagenPiso,
        prompt,
        'microsoft/mai-image-2.6',
        apiKey,
        referrer
      )
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateBody

    if (!body.imagenBase64 || !body.piso) {
      return NextResponse.json(
        { error: 'Faltan datos: se requiere imagenBase64 y piso.' },
        { status: 400 }
      )
    }

    // Normalizar base64 (quitar el prefijo data URL si viene)
    const base64Limpio = body.imagenBase64.replace(/^data:[^;]+;base64,/, '')
    const imagenBuffer = Buffer.from(base64Limpio, 'base64')

    if (imagenBuffer.length < 1024) {
      return NextResponse.json(
        { error: 'La imagen es demasiado pequeña o está corrupta.' },
        { status: 400 }
      )
    }

    const prompt = construirPrompt(body.piso)
    const resultado = await llamarPollinations(
      imagenBuffer,
      body.imagenMime || 'image/jpeg',
      prompt,
      body.piso
    )

    return NextResponse.json({
      imagen: `data:image/png;base64,${resultado.imagenBase64}`,
      modelo: resultado.modeloUsado,
      prompt,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[API /generar] Error:', msg)

    // Mensaje de error más útil para el usuario final
    let mensajeUsuario =
      'No pudimos generar la imagen. Intenta de nuevo en unos minutos.'

    if (msg.includes('429') || msg.toLowerCase().includes('rate limit')) {
      mensajeUsuario =
        'Has alcanzado el límite de generaciones por minuto/hora de tu plan de Pollinations. ' +
        'Espera 5-10 minutos y vuelve a intentarlo.'
    } else if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
      mensajeUsuario =
        'Tu API key de Pollinations no es válida o ha expirado. Verifica tu archivo .env.local.'
    } else if (msg.includes('402') || msg.toLowerCase().includes('payment')) {
      mensajeUsuario =
        'Tu cuenta de Pollinations no tiene saldo. El modelo seleccionado requiere Pollen (créditos de pago). ' +
        'Cambia POLLINATIONS_MODEL en .env.local a un modelo gratuito como "microsoft/mai-image-2.6-flash".'
    } else if (msg.includes('5') && msg.includes(':')) {
      // Errores 5xx de Pollinations
      mensajeUsuario =
        'El servicio de Pollinations está temporalmente caído o saturado. ' +
        'Intenta de nuevo en 2-3 minutos.'
    }

    return NextResponse.json(
      {
        error: mensajeUsuario,
        detalle: msg,
      },
      { status: 500 }
    )
  }
}
