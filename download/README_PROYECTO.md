# Visualizador de Pisos

Herramienta web para visualizar cómo se vería un piso del catálogo en el espacio del usuario, usando IA de Pollinations.ai.

## Requisitos

- **Node.js 18+** o **Bun** (recomendado) — descarga desde https://bun.sh
- Conexión a internet

## Instalación

### 1. Descomprime el proyecto

```bash
unzip visualizador-pisos.zip
cd visualizador-pisos
```

### 2. Instala dependencias

```bash
# Con bun (recomendado):
bun install

# O con npm:
npm install
```

### 3. Configura tu API key de Pollinations

```bash
cp .env.example .env.local
```

Edita `.env.local` con tu editor favorito y rellena:

```env
POLLINATIONS_API_KEY=sk_aqui_pega_tu_api_key_real
POLLINATIONS_MODEL=kontext
POLLINATIONS_REFERRER=localhost
```

> Si todavía no tienes tu API key, abre la guía paso a paso en
> `download/CONFIGURACION_POLLINATIONS.md`.

### 4. Arranca el servidor

```bash
# Con bun:
bun run dev

# Con npm:
npm run dev
```

Abre **http://localhost:3000** en tu navegador.

## Estructura del proyecto

```
visualizador-pisos/
├── public/
│   └── data/
│       └── productos.json        ← TU CATÁLOGO. Reemplázalo con tu JSON real
├── src/
│   ├── app/
│   │   ├── api/generar/route.ts  ← Endpoint que llama a Pollinations
│   │   ├── layout.tsx
│   │   ├── page.tsx              ← Página principal con flujo de 3 pasos
│   │   └── globals.css
│   ├── components/
│   │   ├── visualizador/
│   │   │   ├── Header.tsx
│   │   │   ├── Stepper.tsx
│   │   │   ├── PhotoUploader.tsx  ← Cámara + subida de imagen
│   │   │   ├── FloorPicker.tsx    ← Catálogo con filtros
│   │   │   └── ResultViewer.tsx   ← Comparador antes/después
│   │   └── ui/                    ← Componentes shadcn/ui
│   └── lib/
│       └── types.ts               ← Tipos del catálogo
├── .env.example
├── package.json
└── README.md
```

## Cómo integrar tu catálogo real

1. Copia tu archivo `productos.json` real a `public/data/productos.json`
2. Si tienes nuevas categorías (por ejemplo `pisosvinilicos`, `pisosceramicos`),
   aparecerán automáticamente en los filtros. Solo asegúrate de mapearles una
   etiqueta legible en `src/lib/types.ts` (campo `ETIQUETAS_CATEGORIAS`).
3. Reinicia el servidor.

## Cambiar de modelo de IA

En `.env.local`:

```env
# Kontext — mejor calidad de edición (recomendado)
POLLINATIONS_MODEL=kontext

# Seedream — alternativa, a veces más rápido
POLLINATIONS_MODEL=seedream

# Nanobanana — modelo Gemini vía Pollinations, alta calidad pero más lento
POLLINATIONS_MODEL=nanobanana
```

## Comandos disponibles

```bash
bun run dev        # Servidor de desarrollo
bun run build      # Build de producción
bun run start      # Servir build de producción
bun run lint       # Verificar calidad de código
```

## Producción

Para desplegar en producción:

1. Sube el proyecto a tu hosting (Vercel, Netlify, tu VPS, etc.)
2. Configura la variable de entorno `POLLINATIONS_API_KEY` en el panel de tu
   hosting (no subas `.env.local` a Git)
3. Si usas Vercel: Settings → Environment Variables
4. Si usas tu propio servidor: build y start, sirviendo en el puerto que uses

## Límites del tier gratuito de Pollinations

- Sin API key: solo generación de imágenes nuevas (no edición de tu foto real)
- Con API key: edición real con `kontext` o `seedream`, ~500-1000 imágenes/día
- Pollinations puede cambiar límites sin previo aviso

Para tráfico alto, considera migrar a Imagen 3 (~$0.02 USD por imagen).

## Soporte

- Documentación oficial de Pollinations: https://docs.pollinations.ai
- Guía de configuración detallada: `download/CONFIGURACION_POLLINATIONS.md`
