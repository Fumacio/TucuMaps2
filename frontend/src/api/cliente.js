// Un solo lugar para todos los fetch a la API (guía del frontend, sección 6).
// Errores: la API responde { error: { codigo, mensaje, detalles } }; se lanza ese objeto
// para que la pantalla muestre `mensaje` tal cual (RF-06).

const ERROR_SIN_CONEXION = {
  codigo: 'SIN_CONEXION',
  mensaje: 'No pudimos conectarnos con el servidor. Revisá tu conexión e intentá de nuevo.',
}

// Pasa cuando el servidor no contesta bien: el backend está apagado (en desarrollo, el proxy de
// Vite responde 500 sin JSON) o todavía se está "despertando" en Render.
const ERROR_RESPUESTA_INVALIDA = {
  codigo: 'ERROR_SERVIDOR',
  mensaje: 'El servidor no está respondiendo. Intentá de nuevo en unos minutos.',
}

// RF-06, RNF-05: Render "duerme" el backend y el primer pedido puede tardar ~1 minuto.
// Si un pedido pasa este tiempo sin respuesta, se avisa a quien escuche (componente Cargando).
export const UMBRAL_DEMORA_MS = 5000
let pedidosDemorados = 0
const oyentesDemora = new Set()

function avisarDemora() {
  for (const oyente of oyentesDemora) oyente()
}

export function hayDemora() {
  return pedidosDemorados > 0
}

// Devuelve la función para dejar de escuchar (la forma que pide useSyncExternalStore).
export function escucharDemora(oyente) {
  oyentesDemora.add(oyente)
  return () => oyentesDemora.delete(oyente)
}

// Errores que pueden andar al reintentar: sin conexión o un problema del servidor. Un dato
// inválido o algo que no existe da el mismo error cada vez.
const ERRORES_PASAJEROS = ['SIN_CONEXION', 'ERROR_SERVIDOR', 'ERROR_INTERNO', 'DEMASIADOS_INTENTOS']

export function sePuedeReintentar(error) {
  return ERRORES_PASAJEROS.includes(error?.codigo)
}

export async function api(ruta, opciones = {}) {
  let demorado = false
  const temporizador = setTimeout(() => {
    demorado = true
    pedidosDemorados++
    avisarDemora()
  }, UMBRAL_DEMORA_MS)

  try {
    return await pedir(ruta, opciones)
  } finally {
    clearTimeout(temporizador)
    if (demorado) {
      pedidosDemorados--
      avisarDemora()
    }
  }
}

async function pedir(ruta, { metodo = 'GET', cuerpo } = {}) {
  let res
  try {
    res = await fetch(`/api${ruta}`, {
      method: metodo,
      credentials: 'include', // para que viaje la cookie de sesión
      headers: {
        'Content-Type': 'application/json',
        // Las rutas que modifican datos lo exigen; sin él la API responde 403.
        ...(metodo !== 'GET' && { 'X-Requested-With': 'TucuMaps' }),
      },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    })
  } catch {
    throw ERROR_SIN_CONEXION
  }

  if (res.status === 204) return null

  let datos
  try {
    datos = await res.json()
  } catch {
    // Por ejemplo, una página de error en HTML mientras el backend "despierta".
    throw ERROR_RESPUESTA_INVALIDA
  }

  if (!res.ok) throw datos?.error ?? ERROR_RESPUESTA_INVALIDA // datos puede ser null
  return datos
}
