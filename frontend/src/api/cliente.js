// Un solo lugar para todos los fetch a la API (guía del frontend, sección 6).
// Errores: la API responde { error: { codigo, mensaje, detalles } }; se lanza ese objeto
// para que la pantalla muestre `mensaje` tal cual (RF-06).

const ERROR_SIN_CONEXION = {
  codigo: 'SIN_CONEXION',
  mensaje: 'No pudimos conectarnos con el servidor. Revisá tu conexión e intentá de nuevo.',
}

const ERROR_RESPUESTA_INVALIDA = {
  codigo: 'ERROR_SERVIDOR',
  mensaje: 'El servidor respondió algo inesperado. Intentá de nuevo en unos minutos.',
}

export async function api(ruta, { metodo = 'GET', cuerpo } = {}) {
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

  if (!res.ok) throw datos.error ?? ERROR_RESPUESTA_INVALIDA
  return datos
}
