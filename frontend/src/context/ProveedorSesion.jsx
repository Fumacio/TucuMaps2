import { useCallback, useEffect, useMemo, useState } from 'react'
import { cerrarSesion, obtenerSesion } from '../api/auth.js'
import { ContextoSesion } from './sesion.js'

// Al abrir la app pregunta GET /api/auth/me. Si el servidor no responde, sigue como sin sesión:
// el mapa se puede usar igual, y las pantallas que piden sesión vuelven a preguntar.
function ProveedorSesion({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  const actualizar = useCallback(async () => {
    try {
      setUsuario(await obtenerSesion())
    } catch {
      setUsuario(null)
    }
  }, [])

  useEffect(() => {
    let vigente = true
    obtenerSesion()
      .catch(() => null)
      .then((datos) => {
        if (!vigente) return
        setUsuario(datos)
        setCargando(false)
      })
    return () => {
      vigente = false
    }
  }, [])

  // Aunque falle el pedido (por ejemplo, la cookie ya había vencido), en esta pantalla se sale.
  const salir = useCallback(async () => {
    try {
      await cerrarSesion()
    } catch {
      // Sin sesión en el servidor, o sin conexión: igual se sale acá.
    }
    setUsuario(null)
  }, [])

  const valor = useMemo(
    () => ({ usuario, cargando, entrar: setUsuario, salir, actualizar }),
    [usuario, cargando, salir, actualizar],
  )

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>
}

export default ProveedorSesion
