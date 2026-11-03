# Guía de configuración de Pollinations.ai

Esta guía te explica paso a paso cómo crear tu cuenta gratuita en Pollinations.ai,
obtener tu API key y conectarla con el Visualizador de Pisos.

---

## ¿Qué es Pollinations.ai y por qué lo usamos?

Pollinations.ai es una infraestructura abierta que da acceso a múltiples modelos
de IA (incluyendo edición de imágenes) con un tier gratuito funcional. No
requiere tarjeta de crédito.

**Lo que hace en nuestra herramienta:** recibe la foto del cuarto del usuario +
la descripción del piso seleccionado, y devuelve una nueva imagen con el piso
aplicado, conservando paredes y muebles.

---

## Paso 1 — Crear tu cuenta en Pollinations

1. Abre **https://pollinations.ai** en tu navegador.
2. En la esquina superior derecha, haz clic en **Sign in** (o **Sign up**).
3. Puedes registrarte con:
   - Cuenta de Google (más rápido), o
   - Correo electrónico + contraseña.
4. Verifica tu correo si te lo pide.
5. Una vez dentro, verás tu panel (Dashboard).

> No necesitas el plan Pro para usar la herramienta. El tier gratuito es
> suficiente para empezar.

---

## Paso 2 — Generar tu API key

La API key es una cadena de texto que comienza con `sk_` y que identifica tu
cuenta cuando el sitio web hace peticiones a Pollinations.

### Dónde encontrarla

1. Inicia sesión en **https://pollinations.ai**.
2. Haz clic en tu avatar (esquina superior derecha) → **Dashboard** o **Keys**.
   - URL directa: **https://pollinations.ai/keys**
3. Verás una sección llamada **API Keys** o **Secret Keys**.
4. Haz clic en **Create new key** (o **+ New key**).
5. Asígnale un nombre descriptivo, por ejemplo `visualizador-pisos-web`.
6. (Opcional) Configura un límite de gasto (spending cap) — por defecto el tier
   gratuito no consume saldo, pero si quieres evitar cargos accidentales si
   algún día subes a plan de pago, pon $0.00 o un tope bajo.
7. Copia la key. **Se muestra una sola vez**; si la pierdes tendrás que crear
   otra.

> ⚠️ **No la subas a GitHub ni la compartas con nadie.** Es el equivalente a
> una contraseña de tu cuenta de Pollinations.

---

## Paso 3 — Activar el modelo de edición de imágenes

El modelo que usamos para reemplazar el piso se llama **Kontext** (también hay
otros como **Seedream** o **Nanobanana**). Por defecto, todas las cuentas
nuevas tienen acceso a los modelos gratuitos.

Para confirmar:

1. En tu dashboard, busca la sección **Models** o **Model catalog**.
2. Verifica que **Kontext** aparezca con la etiqueta "free" o sin candado.
3. Si por algún motivo no está disponible, prueba con **Seedream** como
   alternativa (cambia el valor en `.env.local`).

---

## Paso 4 — Pegar la API key en el proyecto

En la raíz del proyecto tienes un archivo llamado `.env.example`. Cópialo a
`.env.local` y rellena los valores:

```bash
# En la raíz del proyecto:
cp .env.example .env.local
```

Abre `.env.local` con tu editor favorito (VS Code, Sublime, etc.) y edítalo:

```env
# Tu API key de Pollinations (la que copiaste en el paso 2)
POLLINATIONS_API_KEY=sk_aqui_va_tu_api_key_real

# Modelo de edición de imágenes a usar
POLLINATIONS_MODEL=kontext

# Identificador de tu sitio (usa tu dominio real en producción)
POLLINATIONS_REFERRER=misitio.com
```

Guarda el archivo y **reinicia el servidor de desarrollo**:

```bash
# Si usas bun (recomendado):
bun run dev

# Si usas npm:
npm run dev
```

---

## Paso 5 — Verificar que funciona

1. Abre tu sitio web local.
2. Sube una foto de prueba.
3. Selecciona cualquier piso.
4. Pulsa **Generar visualización**.
5. Si todo está bien, en 20–60 segundos verás el comparador antes/después con
   una etiqueta `Generado con: kontext` (en vez de `flux-anonimo`, que aparece
   cuando no hay API key).

Si en su lugar aparece un error, salta a la sección "Solución de problemas"
abajo.

---

## ¿Dónde está la API key en el código?

No está hardcodeada en ningún archivo. Se lee automáticamente desde variables
de entorno en este archivo:

```
src/app/api/generar/route.ts   ← línea 35
```

```typescript
const apiKey = process.env.POLLINATIONS_API_KEY?.trim()
```

**Buenas prácticas de seguridad:**

- ✅ `.env.local` está en `.gitignore` por defecto en Next.js. Verifica que NO
  se suba a tu repositorio Git.
- ✅ La API key solo se usa en el backend (server-side). El navegador del
  usuario final nunca la ve.
- ✅ Si tienes varios entornos (dev, staging, producción), usa una API key
  distinta en cada uno.

---

## Límites gratuitos y cuotas

| Concepto | Tier gratuito (anon) | Tier gratuito (con API key) |
|---|---|---|
| **Edición de imágenes** | No soportado | Sí, con `kontext` o `seedream` |
| **Generación de imágenes** | ~1 cada 15s | Más rápido y estable |
| **Límite diario** | Variable (servicio best-effort) | ~500-1000/día, sujeto a demanda |
| **Marca de agua** | Sí (a veces) | No |
| **Latencia** | 30-90s | 20-60s |

**Aviso importante:** Pollinations puede cambiar estos límites sin previo
aviso (ya ha pasado). Para producción con tráfico real, considera:

1. **Pagar saldo en Pollinations** (prepago, sin suscripción) — muy barato,
   ~$0.01-0.05 por imagen.
2. **Migrar a otro proveedor** (Imagen 3, fal.ai, Replicate) cuando el
   catálogo tenga tráfico alto.

---

## Solución de problemas

### "Error: Pollinations respondió 4xx: ..."
- Tu API key puede ser inválida o estar mal copiada. Vuelve a generarla.
- Verifica que no haya espacios en blanco antes/después de la key en `.env.local`.

### "Error: Pollinations respondió 429"
- Alcanzaste el rate limit. Espera 1-5 minutos y reintenta.
- Si pasa seguido, distribuye las peticiones en el tiempo o sube a plan de
  pago.

### "Error: Pollinations respondió 5xx"
- Servicio temporalmente caído. Reintenta en 2-3 minutos.
- Verifica el estado en https://status.pollinations.ai (si existe) o en su
  Discord.

### La imagen generada no respeta el piso
- Kontext y Seedream hacen lo que pueden, pero a veces cambian muebles o
  paredes. Es una limitación de la IA generativa actual.
- Prueba con una foto más limpia (mejor iluminación, menos muebles).
- Prueba con otro modelo cambiando `POLLINATIONS_MODEL=seedream` en `.env.local`.

### Funciona en `localhost` pero no en producción
- Verifica que las variables de entorno estén configuradas en tu plataforma
  de hosting (Vercel, Netlify, tu propio servidor, etc.).
- En Vercel: Settings → Environment Variables → añade `POLLINATIONS_API_KEY`.
- Si tu producción tiene CORS restrictivo, asegúrate de que tu backend pueda
  hacer peticiones salientes a `api.pollinations.ai`.

---

## ¿Necesitas ayuda?

- Documentación oficial de Pollinations: https://docs.pollinations.ai
- Comunidad en Discord: enlace desde https://pollinations.ai
- Para reportar un bug en la integración, abre un issue en tu repositorio
  interno.
